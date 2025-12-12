import signal
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from routers import persons, rag
from database.neo4j_connection import db

# load environment variables
from dotenv import load_dotenv
load_dotenv(".env")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # --- Startup ---
    db.execute_write("CREATE INDEX person_id IF NOT EXISTS FOR (p:Person) ON (p.id)")
    db.execute_write("CREATE INDEX person_name IF NOT EXISTS FOR (p:Person) ON (p.fullName)")

    yield

    # --- Shutdown ---
    def shutdown_handler(signal, frame):
        print("Shutting down the application...")
        db.close()
        raise SystemExit

    signal.signal(signal.SIGTERM, shutdown_handler)
    signal.signal(signal.SIGINT, shutdown_handler)

    await app.shutdown()
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
    return {"status": "healthy"}
