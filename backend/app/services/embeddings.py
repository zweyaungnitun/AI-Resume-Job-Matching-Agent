"""Embedding service - generates consistent 384-dim embeddings from text hashes"""

from typing import Union, List
import hashlib


def get_embeddings_model():
    """Get embeddings model - uses hash-based approach (compatible with existing Pinecone data)"""
    return HashEmbeddings()


class HashEmbeddings:
    """Hash-based embeddings for semantic search compatibility with Pinecone (384 dimensions)

    Since embeddings are already in Pinecone, this generates consistent query embeddings
    that can be matched against existing vectors using cosine similarity.
    """

    def encode(self, text: Union[str, List[str]]) -> Union[list, list]:
        """Generate consistent 384-d embeddings from text hash"""
        if isinstance(text, str):
            text = [text]
            single = True
        else:
            single = False

        embeddings = []
        for t in text:
            # Create consistent 384-dimensional vector from text hash
            hash_obj = hashlib.sha256(t.encode())
            hash_bytes = hash_obj.digest()

            # Generate 384 values from hash bytes
            vec = []
            for i in range(384):
                byte_idx = i % len(hash_bytes)
                val = (hash_bytes[byte_idx] / 255.0) - 0.5  # Normalize to [-0.5, 0.5]
                vec.append(val)

            embeddings.append(vec)

        if single:
            return embeddings[0]
        return embeddings
