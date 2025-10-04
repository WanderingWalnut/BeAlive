"""
Authentication endpoints
"""

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel

router = APIRouter()

class LoginRequest(BaseModel):
    email: str
    password: str

class RegisterRequest(BaseModel):
    email: str
    password: str
    first_name: str
    last_name: str

@router.post("/auth/login")
async def login(request: LoginRequest):
    """Login endpoint"""
    # TODO: Implement Supabase auth
    return {
        "message": "Login endpoint - Supabase integration needed",
        "email": request.email
    }

@router.post("/auth/register")
async def register(request: RegisterRequest):
    """Register endpoint"""
    # TODO: Implement Supabase auth
    return {
        "message": "Register endpoint - Supabase integration needed",
        "email": request.email,
        "name": f"{request.first_name} {request.last_name}"
    }

@router.get("/auth/me")
async def get_current_user():
    """Get current user info"""
    # TODO: Implement JWT token validation
    return {
        "message": "Get current user - JWT validation needed"
    }
