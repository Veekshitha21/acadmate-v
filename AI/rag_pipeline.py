import os
import numpy as np
from sentence_transformers import SentenceTransformer
from groq import Groq
from dotenv import load_dotenv
import logging
from typing import List, Dict, Any, Optional, Tuple
import json
import time
from datetime import datetime
import threading
from concurrent.futures import ThreadPoolExecutor
import warnings

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Suppress warnings for cleaner output
warnings.filterwarnings("ignore", category=FutureWarning)

# Handle different Pinecone package versions
try:
    from pinecone import Pinecone
    PINECONE_NEW_VERSION = True
    logger.info("Using new Pinecone package")
except ImportError:
    try:
        import pinecone
        PINECONE_NEW_VERSION = False
        logger.info("Using legacy Pinecone package")
    except ImportError:
        raise ImportError("Neither 'pinecone' nor legacy pinecone package found. Please install: pip install pinecone")

class EmbeddingModelManager:
    """Manages embedding model detection and caching"""
    
    # Comprehensive list of embedding models with their dimensions
    EMBEDDING_MODELS = {
        # Sentence Transformers - Most Popular
        'sentence-transformers/all-mpnet-base-v2': 768,
        'sentence-transformers/all-MiniLM-L12-v2': 384,
        'sentence-transformers/all-MiniLM-L6-v2': 384,
        'sentence-transformers/paraphrase-mpnet-base-v2': 768,
        'sentence-transformers/paraphrase-MiniLM-L6-v2': 384,
        'sentence-transformers/multi-qa-mpnet-base-dot-v1': 768,
        'sentence-transformers/multi-qa-MiniLM-L6-cos-v1': 384,
        'sentence-transformers/all-roberta-large-v1': 1024,
        'sentence-transformers/stsb-roberta-large': 1024,
        'sentence-transformers/msmarco-distilbert-base-v4': 768,
        'sentence-transformers/distilbert-base-nli-stsb-mean-tokens': 768,
        
        # OpenAI Models (hypothetical - would need OpenAI API)
        'text-embedding-ada-002': 1536,
        'text-embedding-3-small': 1536,
        'text-embedding-3-large': 3072,
        
        # Google/Universal Sentence Encoder
        'universal-sentence-encoder': 512,
        'universal-sentence-encoder-large': 512,
    }
    
    # Recommended models by dimension
    RECOMMENDED_BY_DIMENSION = {
        384: ['sentence-transformers/all-MiniLM-L12-v2', 'sentence-transformers/multi-qa-MiniLM-L6-cos-v1'],
        512: ['universal-sentence-encoder'],
        768: ['sentence-transformers/all-mpnet-base-v2', 'sentence-transformers/paraphrase-mpnet-base-v2'],
        1024: ['sentence-transformers/all-roberta-large-v1'],
        1536: ['text-embedding-ada-002', 'text-embedding-3-small'],
        3072: ['text-embedding-3-large']
    }
    
    def __init__(self):
        self.model_cache = {}
        self.performance_cache = {}
        self.loading_lock = threading.Lock()
    
    def get_compatible_models(self, dimension: int) -> List[str]:
        """Get models compatible with given dimension"""
        compatible = [name for name, dim in self.EMBEDDING_MODELS.items() if dim == dimension]
        
        # Prioritize recommended models
        recommended = self.RECOMMENDED_BY_DIMENSION.get(dimension, [])
        compatible_recommended = [m for m in recommended if m in compatible]
        other_compatible = [m for m in compatible if m not in recommended]
        
        return compatible_recommended + other_compatible
    
    def load_model(self, model_name: str) -> SentenceTransformer:
        """Load model with caching"""
        if model_name in self.model_cache:
            return self.model_cache[model_name]
        
        with self.loading_lock:
            if model_name in self.model_cache:  # Double-check after acquiring lock
                return self.model_cache[model_name]
            
            try:
                logger.info(f"Loading embedding model: {model_name}")
                model = SentenceTransformer(model_name)
                self.model_cache[model_name] = model
                logger.info(f"Successfully loaded: {model_name}")
                return model
            except Exception as e:
                logger.error(f"Failed to load {model_name}: {e}")
                raise
    
    def test_model_performance(self, model_name: str, test_queries: List[str], index, max_retries: int = 2) -> float:
        """Test model performance with multiple queries"""
        if model_name in self.performance_cache:
            return self.performance_cache[model_name]
        
        try:
            model = self.load_model(model_name)
            total_score = 0.0
            successful_queries = 0
            
            for query in test_queries:
                for retry in range(max_retries):
                    try:
                        # Generate embedding
                        query_embedding = model.encode(query).tolist()
                        
                        # Query index with timeout
                        result = index.query(
                            vector=query_embedding,
                            top_k=3,
                            include_metadata=True
                        )
                        
                        if result['matches']:
                            max_score = max(match['score'] for match in result['matches'])
                            total_score += max_score
                            successful_queries += 1
                            break  # Success, no need to retry
                            
                    except Exception as e:
                        logger.debug(f"Retry {retry + 1} for query '{query}' with {model_name}: {e}")
                        if retry == max_retries - 1:
                            logger.warning(f"Failed all retries for query '{query}' with {model_name}")
                        time.sleep(0.1)  # Brief pause before retry
            
            avg_score = total_score / successful_queries if successful_queries > 0 else 0.0
            self.performance_cache[model_name] = avg_score
            return avg_score
            
        except Exception as e:
            logger.error(f"Error testing model {model_name}: {e}")
            self.performance_cache[model_name] = 0.0
            return 0.0

class EnhancedRAGPipeline:
    """
    Enhanced RAG Pipeline with simplified and working retrieval mechanism
    """
    
    def __init__(self, index_name: str = None, auto_detect_model: bool = True, force_model: str = None):
        """
        Initialize Enhanced RAG Pipeline
        
        Args:
            index_name (str): Name of the Pinecone index
            auto_detect_model (bool): Whether to auto-detect the best embedding model
            force_model (str): Force use of specific model (overrides auto_detect_model)
        """
        self.index_name = index_name or os.getenv("PINECONE_INDEX_NAME", "acadmate-gemini")
        self.embedding_model = None
        self.current_model_name = None
        self.index = None
        self.groq_client = None
        self.pc = None
        self.index_dimension = None
        self.auto_detect_model = auto_detect_model and not force_model
        self.force_model = force_model
        
        # Initialize model manager
        self.model_manager = EmbeddingModelManager()
        
        # Performance tracking
        self.query_stats = {
            'total_queries': 0,
            'successful_queries': 0,
            'failed_queries': 0,
            'avg_response_time': 0.0
        }
        
        # Initialize components
        self._initialize_clients()
        self._get_index_dimension()
        self._initialize_embedding_model()
    
    def _initialize_clients(self):
        """Initialize Pinecone and Groq clients with better error handling"""
        try:
            # Initialize Pinecone
            pinecone_api_key = os.getenv("PINECONE_API_KEY")
            if not pinecone_api_key:
                raise ValueError("PINECONE_API_KEY not found in environment variables")
            
            if PINECONE_NEW_VERSION:
                self.pc = Pinecone(api_key=pinecone_api_key)
                logger.info("Pinecone client (new version) initialized successfully")
            else:
                pinecone_env = os.getenv("PINECONE_ENV", "us-east-1-aws")
                pinecone.init(api_key=pinecone_api_key, environment=pinecone_env)
                logger.info(f"Pinecone (legacy version) initialized successfully in {pinecone_env}")

            # Initialize Groq
            groq_api_key = os.getenv("GROQ_API_KEY")
            if not groq_api_key:
                raise ValueError("GROQ_API_KEY not found in environment variables")
            
            self.groq_client = Groq(api_key=groq_api_key)
            logger.info("Groq client initialized successfully")
            
        except Exception as e:
            logger.error(f"Error initializing clients: {str(e)}")
            raise
    
    def _get_index_dimension(self):
        """Get the dimension of the Pinecone index with better error handling"""
        try:
            if PINECONE_NEW_VERSION:
                self.index = self.pc.Index(self.index_name)
            else:
                self.index = pinecone.Index(self.index_name)
            
            # Get index stats
            stats = self.index.describe_index_stats()
            logger.info(f"Index stats: {stats}")
            
            # Try multiple methods to get dimension
            self.index_dimension = None
            
            # Method 1: From index description (new Pinecone)
            if PINECONE_NEW_VERSION:
                try:
                    index_info = self.pc.describe_index(self.index_name)
                    self.index_dimension = index_info.dimension
                    logger.info(f"Got dimension from index description: {self.index_dimension}")
                except Exception as e:
                    logger.debug(f"Could not get dimension from index description: {e}")
            
            # Method 2: Infer from sample vectors
            if not self.index_dimension:
                self.index_dimension = self._infer_dimension_from_sample()
                logger.info(f"Inferred dimension from sample: {self.index_dimension}")
            
            # Method 3: Default fallback
            if not self.index_dimension:
                self.index_dimension = 768
                logger.warning(f"Using default dimension: {self.index_dimension}")
            
        except Exception as e:
            logger.error(f"Error getting index information: {str(e)}")
            self.index_dimension = 768
            logger.warning(f"Using fallback dimension: {self.index_dimension}")
    
    def _infer_dimension_from_sample(self) -> Optional[int]:
        """Infer dimension by testing with common dimensions"""
        common_dimensions = [384, 768, 1024, 1536, 3072]
        
        for dim in common_dimensions:
            try:
                dummy_vector = [0.1] * dim  # Use small non-zero values
                result = self.index.query(
                    vector=dummy_vector,
                    top_k=1,
                    include_metadata=False
                )
                # If no error, this dimension works
                return dim
            except Exception as e:
                logger.debug(f"Dimension {dim} test failed: {e}")
                continue
        
        return None
    
    def _initialize_embedding_model(self):
        """Initialize embedding model based on configuration"""
        if self.force_model:
            logger.info(f"Force using model: {self.force_model}")
            self._load_specific_model(self.force_model)
        elif self.auto_detect_model:
            logger.info("Auto-detecting best embedding model...")
            self._auto_detect_embedding_model()
        else:
            logger.info("Loading default embedding model...")
            self._load_default_model()
    
    def _load_specific_model(self, model_name: str):
        """Load a specific model"""
        try:
            self.embedding_model = self.model_manager.load_model(model_name)
            self.current_model_name = model_name
            logger.info(f"Successfully loaded forced model: {model_name}")
        except Exception as e:
            logger.error(f"Failed to load forced model {model_name}: {e}")
            logger.info("Falling back to auto-detection...")
            self._auto_detect_embedding_model()
    
    def _load_default_model(self):
        """Load default model based on dimension"""
        recommended = self.model_manager.RECOMMENDED_BY_DIMENSION.get(self.index_dimension, [])
        
        if recommended:
            default_model = recommended[0]
        else:
            # Fallback defaults
            if self.index_dimension <= 384:
                default_model = 'sentence-transformers/all-MiniLM-L12-v2'
            elif self.index_dimension <= 768:
                default_model = 'sentence-transformers/all-mpnet-base-v2'
            else:
                default_model = 'sentence-transformers/all-roberta-large-v1'
        
        try:
            self.embedding_model = self.model_manager.load_model(default_model)
            self.current_model_name = default_model
            logger.info(f"Loaded default model: {default_model}")
        except Exception as e:
            logger.error(f"Failed to load default model: {e}")
            raise
    
    def _auto_detect_embedding_model(self):
        """Auto-detect the best embedding model using parallel testing"""
        logger.info(f"Auto-detecting best model for dimension {self.index_dimension}...")
        
        compatible_models = self.model_manager.get_compatible_models(self.index_dimension)
        
        if not compatible_models:
            logger.warning(f"No compatible models found for dimension {self.index_dimension}")
            self._load_default_model()
            return
        
        logger.info(f"Testing {len(compatible_models)} compatible models...")
        
        # Enhanced test queries for better detection
        test_queries = [
            "software engineering principles",
            "software quality assurance",
            "testing methodology and practices",
            "system design patterns",
            "database management systems",
            "algorithms and data structures"
        ]
        
        # Test models in parallel for faster detection
        best_model = None
        best_score = 0.0
        
        # Test up to 3 models in parallel
        with ThreadPoolExecutor(max_workers=3) as executor:
            future_to_model = {}
            
            for model_name in compatible_models[:6]:  # Test top 6 models
                future = executor.submit(
                    self.model_manager.test_model_performance,
                    model_name, test_queries, self.index
                )
                future_to_model[future] = model_name
            
            for future in future_to_model:
                model_name = future_to_model[future]
                try:
                    score = future.result(timeout=60)  # 60 second timeout per model
                    logger.info(f"Model {model_name}: avg score = {score:.4f}")
                    
                    if score > best_score:
                        best_score = score
                        best_model = model_name
                        
                except Exception as e:
                    logger.error(f"Error testing model {model_name}: {e}")
        
        # Load the best model
        if best_model and best_score > 0.05:  # Minimum threshold
            logger.info(f"Best model detected: {best_model} (avg score: {best_score:.4f})")
            try:
                self.embedding_model = self.model_manager.load_model(best_model)
                self.current_model_name = best_model
            except Exception as e:
                logger.error(f"Failed to load best model {best_model}: {e}")
                self._load_default_model()
        else:
            logger.warning(f"No suitable model found (best score: {best_score:.4f}), using default")
            self._load_default_model()
    
    def generate_embedding(self, text: str) -> List[float]:
        """Generate embedding for given text with error handling"""
        try:
            if not text or not text.strip():
                raise ValueError("Empty text provided for embedding generation")
            
            embedding = self.embedding_model.encode(text.strip())
            return embedding.tolist()
        except Exception as e:
            logger.error(f"Error generating embedding for text: {str(e)}")
            raise
    
    def retrieve_relevant_documents(self, query: str, top_k: int = 5, min_score: float = 0.0, 
                                   max_retries: int = 3) -> List[Dict]:
        """
        Simplified retrieval function based on your working code
        This replaces the complex original method with the proven working approach
        """
        for attempt in range(max_retries):
            try:
                logger.info(f"Retrieving documents for query: '{query}' (attempt {attempt + 1})")
                
                # Generate query embedding using the loaded model (exact same as your working code)
                query_vector = self.embedding_model.encode(query).tolist()
                logger.debug(f"Generated embedding with dimension: {len(query_vector)}")
                
                # Query Pinecone index - exact same approach as your working code
                result = self.index.query(
                    vector=query_vector,
                    top_k=top_k,
                    include_metadata=True
                )
                
                matches = result.get("matches", [])
                logger.info(f"Found {len(matches)} matches from Pinecone")
                
                # Process matches into our document format - NO FILTERING BY SCORE
                documents = []
                for i, match in enumerate(matches):
                    score = match.get('score', 0.0)
                    doc_id = match.get('id', f'doc_{i}')
                    metadata = match.get('metadata', {})
                    
                    # Extract text content - check multiple possible keys
                    text_content = ""
                    possible_text_keys = ['text', 'chunk_text', 'content', 'document_text', 'body', 'description', 'page_content']
                    
                    for text_key in possible_text_keys:
                        if text_key in metadata and metadata[text_key]:
                            text_content = str(metadata[text_key])
                            logger.debug(f"Found text content in key '{text_key}' for document {doc_id}")
                            break
                    
                    # Only skip if no text content found at all
                    if not text_content.strip():
                        logger.debug(f"Skipping document {doc_id}: no text content in any key. Available keys: {list(metadata.keys())}")
                        continue
                    
                    # Apply minimal score filtering only if min_score > 0
                    if min_score > 0 and score < min_score:
                        logger.debug(f"Skipping document {doc_id}: score={score:.6f} < threshold={min_score}")
                        continue
                    
                    documents.append({
                        'id': doc_id,
                        'score': score,
                        'text': text_content,
                        'metadata': metadata
                    })
                    
                    logger.debug(f"Added document {doc_id}: score={score:.6f}, text_length={len(text_content)}")
                
                logger.info(f"Successfully processed {len(documents)} documents")
                
                # Debug: Log score distribution
                if documents:
                    scores = [doc['score'] for doc in documents]
                    logger.info(f"Score range: {min(scores):.6f} to {max(scores):.6f}")
                
                return documents
                
            except Exception as e:
                logger.warning(f"Attempt {attempt + 1} failed: {e}")
                if attempt == max_retries - 1:
                    logger.error(f"All {max_retries} attempts failed for query: {query}")
                    raise
                time.sleep(0.5 * (attempt + 1))  # Exponential backoff
        
        return []
    
    def _get_marks_based_prompt(self, marks: int) -> str:
        """Generate enhanced prompt template based on marks"""
        prompts = {
            1: "Provide a concise definition in 2-3 lines only.",
            2: "Provide: 1. Clear definition (2-3 lines) 2. One practical example with brief explanation.",
            3: "Provide: 1. Definition 2. Key characteristics (3-4 points) 3. One example.",
            5: "Provide: 1. Clear definition 2. 5-7 key bullet points explaining important aspects 3. Brief practical application.",
            8: "Provide: 1. Comprehensive definition 2. Detailed explanation (7-10 points) 3. Advantages and disadvantages 4. Example application.",
            10: "Provide: 1. Complete definition 2. Detailed explanation (10-12 points) 3. Advantages and disadvantages 4. Real-world applications 5. Best practices.",
            15: ("Provide a comprehensive answer including: 1. Clear definition 2. Detailed explanation (15+ points) "
                 "3. Advantages and disadvantages 4. Multiple real-world applications 5. Best practices "
                 "6. Common pitfalls and how to avoid them 7. Future trends or considerations")
        }
        
        # Find the closest match
        if marks in prompts:
            return prompts[marks]
        elif marks < 3:
            return prompts[2]
        elif marks < 5:
            return prompts[3]
        elif marks < 8:
            return prompts[5]
        elif marks < 10:
            return prompts[8]
        elif marks < 15:
            return prompts[10]
        else:
            return prompts[15]
    
    def generate_answer_with_groq(self, query: str, context: str, marks: int, temperature: float = 0.3) -> str:
        """Generate answer using Groq API with enhanced prompting"""
        try:
            marks_prompt = self._get_marks_based_prompt(marks)
            
            system_prompt = f"""You are an expert AI tutor specializing in software engineering and computer science. 
Answer questions based on the provided context with academic precision.

FORMATTING REQUIREMENTS FOR {marks} MARKS:
{marks_prompt}

IMPORTANT GUIDELINES:
- Use the provided context as your primary source of information
- Provide accurate, detailed explanations suitable for exam preparation
- Use appropriate technical terminology with clear explanations
- Structure your answer with clear headings and bullet points where appropriate
- Include specific examples when relevant
- Ensure content depth matches the mark allocation
- If context is insufficient, acknowledge this but provide what you can from the available information

STYLE:
- Academic but accessible
- Well-structured with clear organization
- Technical accuracy is paramount
- Include practical applications where relevant"""
            
            user_prompt = f"""Context Information:
{context}

Question: {query}

Please provide a comprehensive answer for {marks} marks following the formatting requirements above."""
            
            chat_completion = self.groq_client.chat.completions.create(
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                model="llama-3.1-8b-instant",
                temperature=temperature,
                max_tokens=min(2000, marks * 150)  # Scale tokens with marks
            )
            
            return chat_completion.choices[0].message.content
            
        except Exception as e:
            logger.error(f"Error generating answer with Groq: {str(e)}")
            return f"Error generating answer: {str(e)}"
    
    def build_context_from_documents(self, documents: List[Dict]) -> str:
        """Build context string from retrieved documents - simplified approach"""
        if not documents:
            return "No relevant context found."
        
        context_parts = []
        for i, doc in enumerate(documents):
            text = doc.get('text', '')
            score = doc.get('score', 0.0)
            
            # Truncate very long texts for context
            if len(text) > 1000:
                text = text[:1000] + "..."
            
            context_parts.append(f"[Source {i+1}] (Relevance: {score:.3f})\n{text}")
        
        return "\n\n" + ("="*50 + "\n\n").join(context_parts)
    
    def query_rag(self, user_query: str, marks: int = 5, top_k: int = 5, 
                  temperature: float = 0.3, min_score: float = 0.0) -> Dict[str, Any]:
        """Main RAG query function with simplified and working retrieval"""
        start_time = time.time()
        self.query_stats['total_queries'] += 1
        
        try:
            if not user_query.strip():
                return {
                    'answer': 'Please provide a valid question.',
                    'sources': [],
                    'error': 'Empty query',
                    'query_time': 0.0
                }
            
            logger.info(f"Processing query: '{user_query}' (marks: {marks}, model: {self.current_model_name})")
            
            # Use the simplified retrieval method
            relevant_docs = self.retrieve_relevant_documents(user_query, top_k, min_score)
            
            if not relevant_docs:
                # Try with absolutely no threshold - match your working code exactly
                logger.info("No documents found with initial threshold, trying with no threshold...")
                relevant_docs = self.retrieve_relevant_documents(user_query, top_k, 0.0)
            
            if not relevant_docs:
                self.query_stats['failed_queries'] += 1
                query_time = time.time() - start_time
                
                return {
                    'answer': f'''No relevant documents found for your query: "{user_query}"

Possible Issues:
1. Embedding Model Mismatch: Current model ({self.current_model_name}) may not match the indexing model
2. Content Gap: The specific topic might not be in the knowledge base
3. Query Specificity: Try using more general or alternative terms

Suggestions:
- Rephrase with broader terminology
- Use synonyms or related concepts
- Check if the content exists in your document collection

System Information:
- Index: {self.index_name}
- Dimension: {self.index_dimension}
- Current Model: {self.current_model_name}''',
                    'sources': [],
                    'error': 'No relevant documents found',
                    'query_time': query_time,
                    'embedding_model': self.current_model_name,
                    'index_dimension': self.index_dimension
                }
            
            # Build context using simplified approach
            context = self.build_context_from_documents(relevant_docs)
            
            # Generate answer
            answer = self.generate_answer_with_groq(user_query, context, marks, temperature)
            
            # Prepare sources for response
            sources = []
            for i, doc in enumerate(relevant_docs):
                sources.append({
                    'id': doc['id'],
                    'score': doc['score'],
                    'rank': i + 1,
                    'preview': doc['text'][:300] + "..." if len(doc['text']) > 300 else doc['text'],
                    'metadata': {k: v for k, v in doc['metadata'].items() if k != 'text'}  # Exclude text to avoid duplication
                })
            
            self.query_stats['successful_queries'] += 1
            query_time = time.time() - start_time
            
            # Update average response time
            total_time = self.query_stats['avg_response_time'] * (self.query_stats['successful_queries'] - 1) + query_time
            self.query_stats['avg_response_time'] = total_time / self.query_stats['successful_queries']
            
            return {
                'answer': answer,
                'sources': sources,
                'marks': marks,
                'query': user_query,
                'relevance_score': relevant_docs[0]['score'] if relevant_docs else 0,
                'best_match_id': relevant_docs[0]['id'] if relevant_docs else None,
                'total_sources': len(relevant_docs),
                'embedding_model': self.current_model_name,
                'index_dimension': self.index_dimension,
                'query_time': query_time,
                'success': True
            }
            
        except Exception as e:
            self.query_stats['failed_queries'] += 1
            query_time = time.time() - start_time
            logger.error(f"Error in RAG query: {str(e)}")
            
            return {
                'answer': f'System Error: An error occurred while processing your query: {str(e)}\n\nPlease try again or contact support if the issue persists.',
                'sources': [],
                'error': str(e),
                'query_time': query_time,
                'success': False
            }
    
    def get_system_stats(self) -> Dict[str, Any]:
        """Get comprehensive system statistics"""
        return {
            'index_info': {
                'name': self.index_name,
                'dimension': self.index_dimension,
            },
            'embedding_model': {
                'current': self.current_model_name,
                'performance_cache': getattr(self.model_manager, 'performance_cache', {}),
                'model_cache_size': len(getattr(self.model_manager, 'model_cache', {}))
            },
            'query_statistics': self.query_stats.copy(),
            'system_status': {
                'pinecone_connected': self.index is not None,
                'groq_connected': self.groq_client is not None,
                'embedding_model_loaded': self.embedding_model is not None
            }
        }
    
    def diagnose_system(self) -> Dict[str, Any]:
        """Comprehensive system diagnosis"""
        diagnosis = {
            'timestamp': datetime.now().isoformat(),
            'system_stats': self.get_system_stats(),
            'health_checks': {},
            'recommendations': []
        }
        
        try:
            # Test basic connectivity
            stats = self.index.describe_index_stats()
            diagnosis['health_checks']['pinecone_connection'] = 'Connected'
            diagnosis['index_stats'] = stats
            
            # Test embedding model
            try:
                test_embedding = self.generate_embedding("test query")
                diagnosis['health_checks']['embedding_generation'] = 'Working'
            except Exception as e:
                diagnosis['health_checks']['embedding_generation'] = f'Failed: {e}'
            
            # Test Groq connection
            try:
                test_response = self.generate_answer_with_groq("test", "test context", 1)
                diagnosis['health_checks']['groq_connection'] = 'Working'
            except Exception as e:
                diagnosis['health_checks']['groq_connection'] = f'Failed: {e}'
            
            # Test retrieval
            try:
                test_docs = self.retrieve_relevant_documents("test query", top_k=3, min_score=0.0)
                diagnosis['health_checks']['document_retrieval'] = f'Working - Found {len(test_docs)} documents'
            except Exception as e:
                diagnosis['health_checks']['document_retrieval'] = f'Failed: {e}'
            
            # Performance analysis
            perf_cache = getattr(self.model_manager, 'performance_cache', {})
            if perf_cache:
                best_model = max(perf_cache.items(), key=lambda x: x[1])
                diagnosis['best_performing_model'] = {
                    'name': best_model[0],
                    'score': best_model[1]
                }
                
                if best_model[1] < 0.2:
                    diagnosis['recommendations'].append(
                        "Critical: Very low similarity scores detected. Strong indication of embedding model mismatch. Consider re-indexing."
                    )
                elif best_model[1] < 0.4:
                    diagnosis['recommendations'].append(
                        "Warning: Low similarity scores. Consider testing additional models or re-indexing with current model."
                    )
                elif best_model[1] > 0.7:
                    diagnosis['recommendations'].append(
                        "Excellent: High similarity scores indicate good embedding model match."
                    )
                else:
                    diagnosis['recommendations'].append(
                        "Good: Moderate similarity scores. System should work adequately."
                    )
            
            # Query performance analysis
            if self.query_stats['total_queries'] > 0:
                success_rate = (self.query_stats['successful_queries'] / self.query_stats['total_queries']) * 100
                diagnosis['query_performance'] = {
                    'success_rate': f"{success_rate:.1f}%",
                    'avg_response_time': f"{self.query_stats['avg_response_time']:.2f}s",
                    'total_queries': self.query_stats['total_queries']
                }
                
                if success_rate < 70:
                    diagnosis['recommendations'].append(
                        f"Low query success rate ({success_rate:.1f}%). Check embedding model and document indexing."
                    )
            
        except Exception as e:
            diagnosis['health_checks']['system_error'] = f"System error: {str(e)}"
            diagnosis['recommendations'].append(f"System error detected: {str(e)}")
        
        return diagnosis
    
    def switch_embedding_model(self, model_name: str, test_performance: bool = True):
        """Switch to a different embedding model with optional performance testing"""
        try:
            logger.info(f"Switching to embedding model: {model_name}")
            
            # Load the new model
            new_model = self.model_manager.load_model(model_name)
            
            # Test performance if requested
            if test_performance:
                logger.info("Testing performance of new model...")
                test_queries = ["software engineering", "testing", "databases"]
                score = self.model_manager.test_model_performance(model_name, test_queries, self.index)
                logger.info(f"New model performance score: {score:.4f}")
            
            # Switch to new model
            self.embedding_model = new_model
            self.current_model_name = model_name
            logger.info(f"Successfully switched to: {model_name}")
            
        except Exception as e:
            logger.error(f"Error switching to model {model_name}: {e}")
            raise

def run_comprehensive_diagnosis(index_name: str = None, force_model: str = None):
    """Run comprehensive diagnosis of the RAG pipeline"""
    print("COMPREHENSIVE RAG PIPELINE DIAGNOSIS")
    print("=" * 80)
    
    try:
        # Initialize pipeline
        if force_model:
            rag = EnhancedRAGPipeline(index_name=index_name, force_model=force_model)
            print(f"Using forced model: {force_model}")
        else:
            rag = EnhancedRAGPipeline(index_name=index_name, auto_detect_model=True)
            print("Auto-detecting best model...")
        
        # Run system diagnosis
        diagnosis = rag.diagnose_system()
        
        # Display results
        print(f"\nSYSTEM INFORMATION")
        print("-" * 40)
        sys_stats = diagnosis['system_stats']
        print(f"Index: {sys_stats['index_info']['name']}")
        print(f"Dimension: {sys_stats['index_info']['dimension']}")
        print(f"Current Model: {sys_stats['embedding_model']['current']}")
        
        if 'index_stats' in diagnosis:
            stats = diagnosis['index_stats']
            total_vectors = stats.get('total_vector_count', 0)
            namespaces = len(stats.get('namespaces', {}))
            print(f"Vector Count: {total_vectors:,}")
            print(f"Namespaces: {namespaces}")
        
        print(f"\nHEALTH CHECKS")
        print("-" * 40)
        for check, status in diagnosis['health_checks'].items():
            print(f"{check.replace('_', ' ').title()}: {status}")
        
        if 'best_performing_model' in diagnosis:
            best = diagnosis['best_performing_model']
            print(f"\nBEST MODEL PERFORMANCE")
            print("-" * 40)
            print(f"Model: {best['name']}")
            print(f"Score: {best['score']:.4f}")
            
            # Performance interpretation
            if best['score'] > 0.7:
                print("Status: Excellent")
            elif best['score'] > 0.4:
                print("Status: Good")
            elif best['score'] > 0.2:
                print("Status: Fair")
            else:
                print("Status: Poor")
        
        if 'query_performance' in diagnosis:
            perf = diagnosis['query_performance']
            print(f"\nQUERY PERFORMANCE")
            print("-" * 40)
            print(f"Success Rate: {perf['success_rate']}")
            print(f"Avg Response Time: {perf['avg_response_time']}")
            print(f"Total Queries: {perf['total_queries']}")
        
        print(f"\nRECOMMENDATIONS")
        print("-" * 40)
        for i, rec in enumerate(diagnosis['recommendations'], 1):
            print(f"{i}. {rec}")
        
        # Run test queries
        print(f"\nRUNNING TEST QUERIES")
        print("-" * 40)
        
        test_cases = [
            ("What is software engineering?", 5),
            ("Explain software testing methodologies", 8),
            ("Define software quality assurance", 3),
            ("What are design patterns?", 10)
        ]
        
        test_results = []
        for query, marks in test_cases:
            print(f"\nTesting: {query} ({marks} marks)")
            result = rag.query_rag(query, marks=marks, min_score=0.1)
            
            score = result.get('relevance_score', 0)
            sources = result.get('total_sources', 0)
            success = result.get('success', False)
            query_time = result.get('query_time', 0)
            
            status = "PASS" if success and score > 0.3 else "WARN" if success else "FAIL"
            print(f"   {status} - Score: {score:.4f} | Sources: {sources} | Time: {query_time:.2f}s")
            
            test_results.append({
                'query': query,
                'score': score,
                'sources': sources,
                'success': success,
                'time': query_time
            })
        
        # Test summary
        successful_tests = sum(1 for r in test_results if r['success'])
        avg_score = sum(r['score'] for r in test_results) / len(test_results)
        avg_time = sum(r['time'] for r in test_results) / len(test_results)
        
        print(f"\nTEST SUMMARY")
        print("-" * 40)
        print(f"Successful Tests: {successful_tests}/{len(test_cases)}")
        print(f"Average Score: {avg_score:.4f}")
        print(f"Average Response Time: {avg_time:.2f}s")
        
        # Overall assessment
        print(f"\nOVERALL ASSESSMENT")
        print("-" * 40)
        
        if successful_tests == len(test_cases) and avg_score > 0.6:
            print("EXCELLENT: System is working optimally")
        elif successful_tests >= len(test_cases) * 0.75 and avg_score > 0.4:
            print("GOOD: System is working well with minor issues")
        elif successful_tests >= len(test_cases) * 0.5:
            print("FAIR: System has moderate issues, consider improvements")
        else:
            print("POOR: System has significant issues, requires attention")
        
        # Save detailed report
        report = {
            'diagnosis': diagnosis,
            'test_results': test_results,
            'summary': {
                'successful_tests': successful_tests,
                'total_tests': len(test_cases),
                'avg_score': avg_score,
                'avg_time': avg_time
            }
        }
        
        report_file = f"rag_diagnosis_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        try:
            with open(report_file, 'w', encoding='utf-8') as f:
                json.dump(report, f, indent=2, ensure_ascii=False)
            print(f"\nDetailed report saved to: {report_file}")
        except Exception as e:
            print(f"\nCould not save report: {e}")
        
        print(f"\nDiagnosis completed successfully!")
        return rag, diagnosis
        
    except Exception as e:
        print(f"Diagnosis failed: {e}")
        logger.error(f"Comprehensive diagnosis failed: {e}", exc_info=True)
        return None, None

def quick_test(index_name: str = None, model_name: str = None):
    """Quick test function for rapid validation"""
    print("QUICK RAG PIPELINE TEST")
    print("=" * 50)
    
    try:
        # Initialize with specific model or auto-detect
        if model_name:
            rag = EnhancedRAGPipeline(index_name=index_name, force_model=model_name)
            print(f"Using model: {model_name}")
        else:
            rag = EnhancedRAGPipeline(index_name=index_name, auto_detect_model=True)
            print(f"Auto-detected model: {rag.current_model_name}")
        
        # Quick test query
        result = rag.query_rag("What is software quality?", marks=5, min_score=0.1)
        
        print(f"\nTest Query: 'What is software quality?'")
        print(f"Score: {result.get('relevance_score', 0):.4f}")
        print(f"Sources: {result.get('total_sources', 0)}")
        print(f"Success: {'PASS' if result.get('success', False) else 'FAIL'}")
        print(f"Response Time: {result.get('query_time', 0):.2f}s")
        
        if result.get('success', False):
            print(f"\nAnswer Preview:")
            answer = result.get('answer', '')
            preview = answer[:300] + "..." if len(answer) > 300 else answer
            print(preview)
        
        return rag
        
    except Exception as e:
        print(f"Quick test failed: {e}")
        return None

# Backward compatibility alias
RAGPipeline = EnhancedRAGPipeline

def create_rag_pipeline(index_name: str = None, embedding_model_name: str = None) -> EnhancedRAGPipeline:
    """
    Factory function to create RAG pipeline with backward compatibility
    
    Args:
        index_name: Pinecone index name
        embedding_model_name: Specific embedding model to use (optional)
    
    Returns:
        EnhancedRAGPipeline instance
    """
    if embedding_model_name:
        return EnhancedRAGPipeline(index_name=index_name, force_model=embedding_model_name)
    else:
        return EnhancedRAGPipeline(index_name=index_name, auto_detect_model=True)

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Enhanced RAG Pipeline Diagnosis")
    parser.add_argument("--index", default=None, help="Pinecone index name")
    parser.add_argument("--model", default=None, help="Force specific embedding model")
    parser.add_argument("--quick", action="store_true", help="Run quick test instead of full diagnosis")
    
    args = parser.parse_args()
    
    if args.quick:
        quick_test(index_name=args.index, model_name=args.model)
    else:
        run_comprehensive_diagnosis(index_name=args.index, force_model=args.model)