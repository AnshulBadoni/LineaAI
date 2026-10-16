import signal
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from routers import persons, rag
from database.postgres_connection import db

# load environment variables
from dotenv import load_dotenv
load_dotenv(".env")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # --- Startup ---
    try:
        db.init_db()
        print("Connected to PostgreSQL and verified tables.")
    except Exception as e:
        print(f"Warning: Could not connect to PostgreSQL on startup: {e}")

    yield

    # --- Shutdown ---
    db.close()


app = FastAPI(
    title="Family Tree API",
    description="API for managing family tree with Neo4j and RAG",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(persons.router)
app.include_router(rag.router)


@app.get("/")
async def root():
    return {"message": "Family Tree API is running"}


@app.get("/health")
async def health_check():
    try:
        db.execute_query("SELECT 1")
        return {"status": "healthy", "database": "connected (PostgreSQL)"}
    except Exception as e:
        return {"status": "unhealthy", "error": str(e)}
