from qdrant_client import QdrantClient
from qdrant_client.http import models
import os

QDRANT_URL = os.getenv("QDRANT_URL", "http://localhost:6333")
QDRANT_API_KEY = os.getenv("QDRANT_API_KEY")

client = QdrantClient(url=QDRANT_URL, api_key=QDRANT_API_KEY)

def ensure_collection(collection_name: str, vector_size: int = 1536):
    try:
        client.get_collection(collection_name)
    except Exception:
        try:
            client.create_collection(
                collection_name=collection_name,
                vectors_config=models.VectorParams(size=vector_size, distance=models.Distance.COSINE),
            )
        except Exception as e:
            # Ignore if already exists (handling race conditions or spurious get failures)
            if "already exists" not in str(e) and "Conflict" not in str(e):
                raise e
        
        # Ensure index for isActive
        try:
            client.create_payload_index(
                collection_name=collection_name,
                field_name="isActive",
                field_schema=models.PayloadSchemaType.BOOL,
            )
        except Exception:
            pass # Ignore if already exists

        # Ensure index for docId (required for filtering/updates)
        try:
            client.create_payload_index(
                collection_name=collection_name,
                field_name="docId",
                field_schema=models.PayloadSchemaType.KEYWORD,
            )
        except Exception:
            pass # Ignore if already exists

def upsert_vectors(collection_name: str, points: list[models.PointStruct]):
    ensure_collection(collection_name)
    client.upsert(
        collection_name=collection_name,
        points=points
    )

def search_vectors(collection_name: str, vector: list[float], limit: int = 5):
    ensure_collection(collection_name)
    return client.search(
        collection_name=collection_name,
        query_vector=vector,
        query_filter=models.Filter(
            must_not=[
                models.FieldCondition(
                    key="isActive",
                    match=models.MatchValue(value=False),
                )
            ]
        ),
        limit=limit
    )

def delete_collection(collection_name: str):
    client.delete_collection(collection_name)

def delete_vectors(collection_name: str, key: str, value: str):
    """
    Delete vectors from a collection where payload[key] == value.
    """
    ensure_collection(collection_name)
    client.delete(
        collection_name=collection_name,
        points_selector=models.FilterSelector(
            filter=models.Filter(
                must=[
                    models.FieldCondition(
                        key=key,
                        match=models.MatchValue(value=value),
                    )
                ]
            )
        ),
    )

def update_payload(collection_name: str, key: str, value: str, payload: dict):
    """
    Update payload for points where payload[key] == value.
    """
    ensure_collection(collection_name)
    client.set_payload(
        collection_name=collection_name,
        payload=payload,
        points=models.Filter(
            must=[
                models.FieldCondition(
                    key=key,
                    match=models.MatchValue(value=value),
                )
            ]
        )
    )
