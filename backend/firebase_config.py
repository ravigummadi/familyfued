"""Firebase configuration and Firestore client initialization."""
import os
import firebase_admin
from firebase_admin import credentials, firestore
from google.cloud.firestore_v1 import Client

# Initialize Firebase Admin SDK
_app = None
_db: Client | None = None


def get_db() -> Client:
    """Get Firestore database client, initializing if necessary."""
    global _app, _db
    
    if _db is not None:
        return _db
    
    if _app is None:
        # In Cloud Run, use default credentials
        # Locally, use application default credentials or service account
        if os.getenv("GOOGLE_CLOUD_PROJECT"):
            # Running in GCP - use default credentials
            _app = firebase_admin.initialize_app()
        else:
            # Local development - use application default credentials
            _app = firebase_admin.initialize_app(options={
                "projectId": "feud-family"
            })
    
    _db = firestore.client()
    return _db
