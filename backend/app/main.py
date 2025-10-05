"""
BeAlive Backend - FastAPI + Supabase
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.routes import health, auth, feed, challenges, posts, commitments, network, uploads

app = FastAPI(
    title="BeAlive API",
    description="Backend API for BeAlive application",
    version="1.0.0",
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(health.router, prefix="/api/v1", tags=["health"])
app.include_router(auth.router, prefix="/api/v1", tags=["auth"])
app.include_router(feed.router, prefix="/api/v1", tags=["feed"])
app.include_router(challenges.router, prefix="/api/v1", tags=["challenges"])
app.include_router(posts.router, prefix="/api/v1", tags=["posts"])
app.include_router(commitments.router, prefix="/api/v1", tags=["commitments"])
app.include_router(network.router, prefix="/api/v1", tags=["network"])
app.include_router(uploads.router, prefix="/api/v1", tags=["uploads"])

@app.get("/")
async def root():
    """Root endpoint"""
    return {"message": "BeAlive API is running", "version": "1.0.0"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG
    )
