"""
Core configuration settings
"""

import os
from typing import List

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
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:8081",
        "exp://192.168.1.100:8081",  # Expo development
    ]
    
    # Auth via Supabase; no local JWT settings needed

settings = Settings()
