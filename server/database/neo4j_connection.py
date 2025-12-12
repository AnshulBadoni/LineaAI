from neo4j import GraphDatabase
from contextlib import contextmanager
from configs.config import settings

class Neo4jConnection:
    def __init__(self):
        self.driver = GraphDatabase.driver(
            settings.neo4j_uri,
            auth=(settings.neo4j_user, settings.neo4j_password)
        )
    
    def close(self):
        self.driver.close()

    # WRITE
    def execute_write(self, query: str, parameters: dict = None):
        with self.driver.session() as session:
            def run_tx(tx):
                result = tx.run(query, parameters or {})
                return [record.data() for record in result]
            return session.execute_write(run_tx)

    # READ
    def execute_query(self, query: str, parameters: dict = None):
        with self.driver.session() as session:
            def run_tx(tx):
                result = tx.run(query, parameters or {})
                return [record.data() for record in result]
            return session.execute_read(run_tx)


# Singleton instance
db = Neo4jConnection()
