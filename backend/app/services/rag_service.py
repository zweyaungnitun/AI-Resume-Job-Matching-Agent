"""RAG service for job matching using Pinecone and LangChain"""

import numpy as np
from pinecone import Pinecone
from langchain_openai import OpenAIEmbeddings

from app.config import settings


class RAGService:
    """Retrieval-Augmented Generation service for job matching"""

    def __init__(self):
        self.pinecone_api_key = settings.PINECONE_API_KEY
        self.pinecone_env = settings.PINECONE_ENVIRONMENT
        self.index_name = settings.PINECONE_INDEX

        self.pc = None
        self.index = None

        # Initialize embeddings
        self.embeddings = OpenAIEmbeddings(
            api_key=settings.OPENAI_API_KEY,
            model="text-embedding-3-small"
        )

    def _ensure_pinecone(self):
        """Lazy initialize Pinecone connection"""
        if self.pc is None:
            self.pc = Pinecone(api_key=self.pinecone_api_key)
            self.index = self.pc.Index(self.index_name)

    def retrieve_jobs(self, query: str, top_k: int = 5) -> list[dict]:
        """Search for jobs similar to the resume using semantic search"""
        self._ensure_pinecone()

        # Embed the query
        query_embedding = self.embeddings.embed_query(query)

        # Query Pinecone
        results = self.index.query(
            vector=query_embedding,
            top_k=top_k,
            include_metadata=True
        )

        # Parse results
        matches = []
        for match in results.get("matches", []):
            if match.get("metadata"):
                matches.append({
                    "job_title": match["metadata"].get("job_title", ""),
                    "company": match["metadata"].get("company", ""),
                    "description": match["metadata"].get("description", ""),
                    "score": float(match.get("score", 0)),
                    "id": match.get("id", "")
                })

        return matches

    def index_job_descriptions(self, jobs: list[dict]) -> None:
        """Index job descriptions in Pinecone"""
        self._ensure_pinecone()

        vectors = []

        for idx, job in enumerate(jobs):
            # Combine job title and description for embedding
            job_text = f"{job.get('job_title', '')} {job.get('description', '')}"

            # Embed the job description
            embedding = self.embeddings.embed_query(job_text)

            # Prepare metadata
            metadata = {
                "job_title": job.get("job_title", ""),
                "company": job.get("company", ""),
                "description": job.get("description", ""),
                "requirements": job.get("requirements", [])
            }

            # Add to vectors list
            vectors.append({
                "id": f"job_{idx}_{job.get('job_title', '').replace(' ', '_')}",
                "values": embedding,
                "metadata": metadata
            })

        # Upsert to Pinecone
        if vectors:
            self.index.upsert(vectors=vectors)

    def score_match(self, resume: str, job: dict) -> float:
        """Score how well a resume matches a job (0.0-1.0)"""
        # Embed resume and job
        resume_embedding = self.embeddings.embed_query(resume)
        job_text = f"{job.get('job_title', '')} {job.get('description', '')}"
        job_embedding = self.embeddings.embed_query(job_text)

        # Compute cosine similarity
        resume_vec = np.array(resume_embedding)
        job_vec = np.array(job_embedding)

        dot_product = np.dot(resume_vec, job_vec)
        norm_resume = np.linalg.norm(resume_vec)
        norm_job = np.linalg.norm(job_vec)

        if norm_resume == 0 or norm_job == 0:
            return 0.0

        similarity = dot_product / (norm_resume * norm_job)
        # Normalize to 0-1 range (cosine similarity is -1 to 1, we want 0 to 1)
        return max(0.0, min(1.0, (similarity + 1) / 2))
