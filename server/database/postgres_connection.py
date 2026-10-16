import re
from contextlib import contextmanager
from typing import List, Dict, Any, Optional
import psycopg2
from psycopg2 import pool
from psycopg2.extras import RealDictCursor
from configs.config import settings

def clean_database_url(url: str) -> str:
    """Strip invalid psycopg2 query parameters like pgbouncer=true"""
    cleaned = re.sub(r'([?&])pgbouncer=[^&]*', '', url)
    cleaned = cleaned.rstrip('?&')
    return cleaned

class PostgresConnection:
    def __init__(self):
        self._pool: Optional[pool.ThreadedConnectionPool] = None
        self._url = clean_database_url(settings.database_url)

    def _get_pool(self) -> pool.ThreadedConnectionPool:
        if self._pool is None or self._pool.closed:
            self._pool = pool.ThreadedConnectionPool(
                minconn=1,
                maxconn=10,
                dsn=self._url
            )
        return self._pool

    @contextmanager
    def get_connection(self):
        connection_pool = self._get_pool()
        conn = connection_pool.getconn()
        try:
            yield conn
        finally:
            connection_pool.putconn(conn)

    def execute_query(self, query: str, parameters: Any = None) -> List[Dict[str, Any]]:
        """Run a SELECT query and return rows as list of dicts"""
        with self.get_connection() as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(query, parameters or ())
                rows = cur.fetchall()
                return [dict(row) for row in rows]

    def execute_write(self, query: str, parameters: Any = None) -> List[Dict[str, Any]]:
        """Run an INSERT/UPDATE/DELETE query and commit transaction"""
        with self.get_connection() as conn:
            try:
                with conn.cursor(cursor_factory=RealDictCursor) as cur:
                    cur.execute(query, parameters or ())
                    results = []
                    if cur.description:
                        rows = cur.fetchall()
                        results = [dict(row) for row in rows]
                    conn.commit()
                    return results
            except Exception:
                conn.rollback()
                raise

    def init_db(self):
        """Create tables and indexes if they do not exist"""
        create_tables_sql = """
        CREATE TABLE IF NOT EXISTS persons (
            id VARCHAR(64) PRIMARY KEY,
            first_name VARCHAR(255) NOT NULL,
            last_name VARCHAR(255) NOT NULL,
            full_name VARCHAR(512) NOT NULL,
            gender VARCHAR(50) NOT NULL,
            birth_date DATE,
            death_date DATE,
            birth_place VARCHAR(255),
            occupation VARCHAR(255),
            bio TEXT,
            photo_url TEXT,
            created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS relationships (
            id VARCHAR(64) PRIMARY KEY,
            from_person_id VARCHAR(64) NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
            to_person_id VARCHAR(64) NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
            relationship_type VARCHAR(50) NOT NULL,
            start_date DATE,
            end_date DATE,
            marriage_date DATE,
            created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT unique_relationship UNIQUE (from_person_id, to_person_id, relationship_type)
        );

        CREATE INDEX IF NOT EXISTS idx_persons_full_name ON persons (full_name);
        CREATE INDEX IF NOT EXISTS idx_rel_from_person ON relationships (from_person_id);
        CREATE INDEX IF NOT EXISTS idx_rel_to_person ON relationships (to_person_id);
        CREATE INDEX IF NOT EXISTS idx_rel_type ON relationships (relationship_type);
        """
        with self.get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(create_tables_sql)
                conn.commit()
        print("PostgreSQL tables and indexes verified successfully.")

    def close(self):
        if self._pool and not self._pool.closed:
            self._pool.closeall()

db = PostgresConnection()
