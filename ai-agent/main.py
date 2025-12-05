# main.py

import os
import sys
from dotenv import load_dotenv
from typing import Dict, Any, List

# --- FastAPI Imports ---
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# --- AI System Imports ---

# 1. CROW: For quick, direct answers
from crow import run_crow_chain

# 2. FALCON: Original RAG with local ChromaDB
# ✅ FIX: Import from new packages to resolve deprecation warnings
from langchain_chroma import Chroma
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_groq import ChatGroq
from langchain_core.runnables import RunnablePassthrough
from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import PromptTemplate
from langchain_core.documents import Document

# 3. RAG PIPELINE: Advanced RAG with Pinecone
from rag_pipeline import EnhancedRAGPipeline

# --- Initialization & Configuration ---
print("--- 🚀 Initializing Unified AI Server ---")
load_dotenv()

# Check for essential environment variables
if not os.getenv("GROQ_API_KEY"):
    print("❌ FATAL: GROQ_API_KEY not found in .env file. Exiting.")
    sys.exit(1)

# Initialize FastAPI app
app = FastAPI(
    title="Unified AI Suite API",
    description="Provides access to Crow (Quick Answers), Falcon (Local RAG), and an advanced RAG Pipeline (Pinecone).",
    version="4.0.0"
)

# Configure CORS (Cross-Origin Resource Sharing)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Load AI Resources on Startup ---

# 1. CROW is a simple function call, so no global object is needed.

# 2. FALCON (ChromaDB RAG) Initialization
falcon_rag_chain = None
falcon_vectorstore = None
try:
    print("⏳ Initializing Falcon (ChromaDB RAG)...")
    FALCON_VECTOR_STORE_PATH = "vector_store"
    FALCON_EMBEDDING_MODEL = "sentence-transformers/all-MiniLM-L6-v2"
    FALCON_LLM_MODEL = "llama-3.1-8b-instant"

    if not os.path.isdir(FALCON_VECTOR_STORE_PATH):
        raise FileNotFoundError(f"Falcon vector store not found at '{FALCON_VECTOR_STORE_PATH}'. Please run the falcon.py ingestion script.")

    embeddings = HuggingFaceEmbeddings(model_name=FALCON_EMBEDDING_MODEL)
    falcon_vectorstore = Chroma(persist_directory=FALCON_VECTOR_STORE_PATH, embedding_function=embeddings)
    retriever = falcon_vectorstore.as_retriever(search_kwargs={"k": 4})
    falcon_llm = ChatGroq(model_name=FALCON_LLM_MODEL)

    falcon_template = "You are an expert AI teaching assistant. Use the following context from a textbook to answer the student's question.\n\nContext: {context}\n\nQuestion: {question}\n\nHelpful Answer:"
    falcon_prompt = PromptTemplate.from_template(falcon_template)
    
    def format_docs(docs: List[Document]) -> str:
        return "\n\n---\n\n".join(doc.page_content for doc in docs)

    falcon_rag_chain = (
        {"context": retriever | format_docs, "question": RunnablePassthrough()}
        | falcon_prompt
        | falcon_llm
        | StrOutputParser()
    )
    print("✅ Falcon (ChromaDB RAG) initialized successfully.")
except Exception as e:
    print(f"⚠️ WARNING: Could not initialize Falcon (ChromaDB RAG): {e}")

# 3. ADVANCED RAG (Pinecone) Initialization
pinecone_rag_pipeline = None
try:
    print("⏳ Initializing Advanced RAG Pipeline (Pinecone)...")
    # ✅ FIX: Simplified initialization to match the new rag_pipeline.py
    pinecone_rag_pipeline = EnhancedRAGPipeline()
    # ✅ FIX: Updated print statement to show the correct model name
    print(f"✅ Advanced RAG Pipeline initialized successfully with model: {pinecone_rag_pipeline.embedding_model_name}")
except Exception as e:
    print(f"⚠️ WARNING: Could not initialize Advanced RAG Pipeline (Pinecone): {e}")

# --- API Data Models (Request and Response Schemas) ---

class Query(BaseModel):
    query: str = Field(..., description="The user's question or prompt.")

# Unified response model for both Falcon and RAG for consistency
class RAGResponse(BaseModel):
    answer: str
    source_documents: List[Dict[str, Any]]

class RAGQuery(BaseModel):
    question: str
    marks: int = Field(default=5, description="The desired marks for the answer, influencing its depth.")
    top_k: int = Field(default=5, description="Number of documents to retrieve.")
    temperature: float = Field(default=0.3, description="Creativity of the response (0.0 to 1.0).")

# --- API ENDPOINTS ---

@app.get("/", summary="Root health check")
def read_root():
    return {
        "message": "Welcome to the Unified AI Suite.",
        "status": "OK",
        "services": {
            "crow": "Available",
            "falcon": "Available" if falcon_rag_chain else "Unavailable",
            "rag_pipeline": "Available" if pinecone_rag_pipeline else "Unavailable"
        }
    }

@app.post("/crow", summary="Get a quick, direct answer")
async def crow_endpoint(request: Query) -> Dict[str, Any]:
    try:
        # The crow.py file now returns a dict with {"response": "..."}
        # To make the API consistent, we rename the key to "answer"
        result = run_crow_chain(request.query)
        return {"answer": result.get("response", "No answer found."), "source_documents": []}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred in the Crow chain: {e}")

@app.post("/falcon", response_model=RAGResponse, summary="Get a source-based answer from local ChromaDB")
async def falcon_endpoint(request: Query):
    if not falcon_rag_chain or not falcon_vectorstore:
        raise HTTPException(status_code=503, detail="Falcon (ChromaDB RAG) is not available. Check server logs.")
    try:
        answer = falcon_rag_chain.invoke(request.query)
        source_docs = falcon_vectorstore.similarity_search(request.query, k=4)
        formatted_sources = [{"source": doc.metadata.get("source", "unknown"), "content": doc.page_content} for doc in source_docs]
        
        return {"answer": answer, "source_documents": formatted_sources}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/rag", response_model=RAGResponse, summary="Get an advanced answer from Pinecone")
async def rag_endpoint(request: RAGQuery):
    if not pinecone_rag_pipeline:
        raise HTTPException(status_code=503, detail="Advanced RAG Pipeline (Pinecone) is not available. Check server logs.")
    try:
        # The new query_rag function takes the user query and other parameters
        result = pinecone_rag_pipeline.query_rag(
            user_query=request.question,
            marks=request.marks
            # Other parameters like top_k and temperature are handled inside the class now
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/ask", response_model=RAGResponse, summary="Unified ask endpoint (routes to RAG)")
async def ask_endpoint(request: RAGQuery):
    """
    Unified endpoint that routes to the appropriate AI system.
    Currently routes to the advanced RAG Pipeline (Pinecone).
    """
    if not pinecone_rag_pipeline:
        raise HTTPException(status_code=503, detail="Advanced RAG Pipeline (Pinecone) is not available. Check server logs.")
    try:
        result = pinecone_rag_pipeline.query_rag(
            user_query=request.question,
            marks=request.marks
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

print("--- ✅ Server is ready. Access endpoints at /crow, /falcon, /rag, /ask ---")