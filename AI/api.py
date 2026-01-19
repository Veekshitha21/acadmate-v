import logging
from typing import Optional, Dict, Any, List
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Query, Request
from fastapi.responses import JSONResponse, Response
from pydantic import BaseModel, Field

from config import config
from rag_pipeline import RAGPipeline
from embedding_service import EmbeddingService
from retrieval_service import RetrievalService
from llm_service import LLMService

from dotenv import load_dotenv
load_dotenv()

from fastapi.middleware.cors import CORSMiddleware



logger = logging.getLogger(__name__)

# Global services (initialized once at startup)
embedding_service: Optional[EmbeddingService] = None
retrieval_service: Optional[RetrievalService] = None
llm_service: Optional[LLMService] = None
rag_pipeline: Optional[RAGPipeline] = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan manager.
    Loads models once at startup, cleans up at shutdown.
    """
    global embedding_service, retrieval_service, llm_service, rag_pipeline
    
    logger.info("Starting application...")
    
    # Initialize services once
    embedding_service = EmbeddingService()
    retrieval_service = RetrievalService()
    llm_service = LLMService()
    rag_pipeline = RAGPipeline(
        embedding_service=embedding_service,
        retrieval_service=retrieval_service,
        llm_service=llm_service
    )
    
    logger.info("Application started successfully")
    
    yield
    
    logger.info("Shutting down application...")


# Initialize FastAPI app
app = FastAPI(
    title="RAG API",
    description="Production-ready RAG pipeline with caching and batch processing",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    # Explicit origins for dev + a regex to allow any localhost port.
    # This avoids common CORS/preflight issues (especially when credentials are introduced later).
    allow_origins=config.CORS_ORIGINS,
    allow_origin_regex=config.CORS_ORIGIN_REGEX,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Preflight safety-net (ngrok/proxies sometimes surface 405/404 on OPTIONS before middleware kicks in)
@app.options("/{full_path:path}")
async def preflight_handler(full_path: str, request: Request):
    return Response(status_code=200)

# Request/Response models
class QueryRequest(BaseModel):
    query: str = Field(..., description="Search query", min_length=1)
    top_k: Optional[int] = Field(None, description="Number of results", ge=1, le=20)
    namespace: Optional[str] = Field(None, description="Pinecone namespace")
    filter_metadata: Optional[Dict[str, Any]] = Field(None, description="Metadata filters")
    include_context: bool = Field(True, description="Include formatted context")
    include_scores: bool = Field(False, description="Include similarity scores in context")


class BatchQueryRequest(BaseModel):
    queries: List[str] = Field(..., description="List of search queries", min_items=1)
    top_k: Optional[int] = Field(None, description="Number of results per query", ge=1, le=20)
    namespace: Optional[str] = Field(None, description="Pinecone namespace")
    filter_metadata: Optional[Dict[str, Any]] = Field(None, description="Metadata filters")


class GenerateRequest(BaseModel):
    query: str = Field(..., description="User's question", min_length=1)
    marks: int = Field(5, description="Mark allocation (1, 2, 3, 5, 7, 10, 15)", ge=1, le=20)
    top_k: Optional[int] = Field(None, description="Number of documents to retrieve", ge=1, le=20)
    namespace: Optional[str] = Field(None, description="Pinecone namespace")
    filter_metadata: Optional[Dict[str, Any]] = Field(None, description="Metadata filters")
    custom_system_prompt: Optional[str] = Field(None, description="Override schema-based prompt")
    temperature: Optional[float] = Field(None, description="LLM temperature", ge=0, le=2)
    max_tokens: Optional[int] = Field(None, description="Maximum tokens for response", ge=1)
    include_sources: bool = Field(True, description="Include source documents")


class GenerateResponse(BaseModel):
    query: str
    answer: str
    marks: int
    schema: Dict[str, Any]
    context: str
    model: Dict[str, str]
    sources: Optional[List[Dict[str, Any]]] = None


class QueryResponse(BaseModel):
    query: str
    documents: List[Dict[str, Any]]
    num_results: int
    model: str
    context: Optional[str] = None


# API Endpoints
@app.get("/")
async def root():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "RAG API",
        "version": "1.0.0"
    }


@app.post("/query", response_model=QueryResponse)
async def query_documents(request: QueryRequest):
    """
    Retrieve relevant documents for a single query.
    
    Returns the most similar documents from the vector database.
    """
    try:
        result = rag_pipeline.run(
            query=request.query,
            top_k=request.top_k,
            namespace=request.namespace,
            filter_metadata=request.filter_metadata,
            include_context=request.include_context,
            include_scores=request.include_scores
        )
        
        return QueryResponse(**result)
    
    except Exception as e:
        logger.error(f"Error processing query: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/query/batch")
async def batch_query_documents(request: BatchQueryRequest):
    """
    Retrieve relevant documents for multiple queries in batch.
    
    More efficient than making individual requests.
    """
    try:
        results = rag_pipeline.retrieve_batch(
            queries=request.queries,
            top_k=request.top_k,
            namespace=request.namespace,
            filter_metadata=request.filter_metadata
        )
        
        return {
            "queries": request.queries,
            "results": results,
            "num_queries": len(request.queries)
        }
    
    except Exception as e:
        logger.error(f"Error processing batch query: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/embed")
async def embed_text(
    text: str = Query(..., description="Text to embed"),
    use_cache: bool = Query(True, description="Use cache if available")
):
    """
    Generate embedding for given text.
    
    Useful for debugging or custom vector operations.
    """
    try:
        if use_cache:
            embedding = embedding_service.embed_single(text)
        else:
            # Bypass cache
            embedding = embedding_service.model.encode(
                text,
                normalize_embeddings=config.NORMALIZE_EMBEDDINGS,
                show_progress_bar=False
            ).tolist()
        
        return {
            "text": text,
            "embedding": embedding,
            "dimension": len(embedding),
            "model": embedding_service.model_name
        }
    
    except Exception as e:
        logger.error(f"Error generating embedding: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/stats")
async def get_stats():
    """
    Get pipeline statistics including cache performance and index info.
    """
    try:
        stats = rag_pipeline.get_stats()
        return stats
    
    except Exception as e:
        logger.error(f"Error getting stats: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/cache/clear")
async def clear_cache():
    """
    Clear the embedding cache.
    
    Useful for testing or memory management.
    """
    try:
        embedding_service.clear_cache()
        return {"status": "success", "message": "Cache cleared"}
    
    except Exception as e:
        logger.error(f"Error clearing cache: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/generate", response_model=GenerateResponse)
async def generate_answer(request: GenerateRequest):
    """
    Generate an exam-style answer using RAG pipeline with schema-based formatting.
    
    Automatically structures answers based on mark allocation:
    - 1 mark: Definition only
    - 2 marks: Definition + Example
    - 3 marks: Definition + Explanation + Example
    - 5 marks: Definition + Explanation + Multiple Examples
    - 7-10 marks: Comprehensive coverage
    - 15 marks: Essay-style with in-depth analysis
    """
    try:
        result = rag_pipeline.generate_answer(
            query=request.query,
            marks=request.marks,
            top_k=request.top_k,
            namespace=request.namespace,
            filter_metadata=request.filter_metadata,
            custom_system_prompt=request.custom_system_prompt,
            temperature=request.temperature,
            max_tokens=request.max_tokens,
            include_sources=request.include_sources
        )
        
        return GenerateResponse(**result)
    
    except Exception as e:
        logger.error(f"Error generating answer: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/generate/stream")
async def generate_answer_stream(request: GenerateRequest):
    """
    Generate a streaming exam-style answer using RAG pipeline.
    
    Returns answer token-by-token for better UX.
    Follows mark-based schema just like /generate endpoint.
    """
    from fastapi.responses import StreamingResponse
    from schema_service import SchemaService
    
    try:
        # Validate marks
        marks = SchemaService.validate_marks(request.marks)
        
        # Get schema configuration
        temperature = request.temperature or SchemaService.get_temperature(marks)
        max_tokens = request.max_tokens or SchemaService.get_max_tokens(marks)
        
        # Retrieve documents
        documents = rag_pipeline.retrieve(
            query=request.query,
            top_k=request.top_k,
            namespace=request.namespace,
            filter_metadata=request.filter_metadata
        )
        
        # Build context
        context = rag_pipeline.build_context(documents=documents)
        
        # Build prompts
        if request.custom_system_prompt:
            system_prompt = request.custom_system_prompt
            user_prompt = f"Context: {context}\n\nQuestion: {request.query}"
        else:
            system_prompt = SchemaService.build_system_prompt(marks)
            user_prompt = SchemaService.build_user_prompt(request.query, context, marks)
        
        # Stream generation
        def generate():
            for chunk in llm_service.generate_stream(
                prompt=user_prompt,
                system_prompt=system_prompt,
                temperature=temperature,
                max_tokens=max_tokens
            ):
                yield chunk
        
        return StreamingResponse(generate(), media_type="text/plain")
    
    except Exception as e:
        logger.error(f"Error in streaming generation: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# Error handlers
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    logger.error(f"Unhandled exception: {str(exc)}")
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"}
    )