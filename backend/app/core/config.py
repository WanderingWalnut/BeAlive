"""
Core configuration settings
"""

import os
from typing import List

# Try to load environment variables from backend/.env for local development.
try:
    from dotenv import load_dotenv
    # Attempt to load from the backend folder's .env if present
    _here = os.path.dirname(os.path.abspath(__file__))
    _backend_root = os.path.abspath(os.path.join(_here, "..", ".."))
    load_dotenv(os.path.join(_backend_root, ".env"))
except Exception:
    # dotenv is optional; ignore if not installed
    pass

class Settings:
    """Application settings"""
    
    # App settings
    DEBUG: bool = True
    SECRET_KEY: str = "your-secret-key-change-in-production"
    
    # Database settings
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
    SUPABASE_KEY: str = os.getenv("SUPABASE_KEY", "")
    SUPABASE_SERVICE_ROLE_KEY: str = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
    
    # CORS settings
    ALLOWED_ORIGINS: List[str] = ["*"]
    
    # Auth via Supabase; no local JWT settings needed

settings = Settings()
