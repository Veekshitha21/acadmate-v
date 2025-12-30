from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
from rag_pipeline import EnhancedRAGPipeline

app = FastAPI(title="RAG Answer API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000",
                   "http://localhost:5173",
                   "http://localhost:5173",
                   ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

rag = EnhancedRAGPipeline(auto_detect_model=True)

class QueryRequest(BaseModel):
    query: str
    marks: Optional[int] = 5
    temperature: Optional[float] = 0.3

class AnswerResponse(BaseModel):
    answer: str

@app.post("/query", response_model=AnswerResponse)
def query_rag(request: QueryRequest):
    if not request.query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty")

    try:
        result = rag.query_rag(
            user_query=request.query,
            marks=request.marks,
            temperature=request.temperature
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    return AnswerResponse(
        answer=result.get("answer", "No answer generated")
    )
