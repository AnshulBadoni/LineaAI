from database.neo4j_connection import db
from services.pollinations import PollinationsClient
from configs.config import settings
from typing import Dict, List, Optional
import json

class RAGService:
    """RAG Service using Pollinations AI for family tree queries"""
    
    def __init__(self):
        self.client = PollinationsClient(
            model=settings.ai_model,
            timeout=settings.ai_timeout
        )
        
        self.system_prompt = """You are a helpful family tree assistant. You have access to information about a family.
Your job is to answer questions about family members, their relationships, and their details.

Guidelines:
- Be accurate and only use the information provided
- If you don't know something, say so
- When describing relationships, be specific (e.g., "grandmother", "uncle", "cousin")
- Explain how people are related through their common ancestors if relevant
- Be friendly and conversational"""

    def get_family_context(self) -> str:
        """Retrieve all family data as context"""
        
        query = """
        MATCH (p:Person)
        OPTIONAL MATCH (p)-[:CHILD_OF]->(parent:Person)
        OPTIONAL MATCH (p)-[:PARENT_OF]->(child:Person)
        OPTIONAL MATCH (p)-[:SPOUSE_OF]->(spouse:Person)
        RETURN p.fullName as name,
               p.birthDate as birthDate,
               p.deathDate as deathDate,
               p.occupation as occupation,
               p.bio as bio,
               p.birthPlace as birthPlace,
               p.gender as gender,
               collect(DISTINCT parent.fullName) as parents,
               collect(DISTINCT child.fullName) as children,
               collect(DISTINCT spouse.fullName) as spouses
        """
        
        results = db.execute_query(query)
        
        context_parts = []
        for person in results:
            info = f"**{person['name']}**"
            
            if person['gender']:
                info += f" ({person['gender']})"
            info += "\n"
            
            if person['birthDate']:
                info += f"  - Born: {person['birthDate']}"
                if person['birthPlace']:
                    info += f" in {person['birthPlace']}"
                info += "\n"
            
            if person['deathDate']:
                info += f"  - Died: {person['deathDate']}\n"
            
            if person['occupation']:
                info += f"  - Occupation: {person['occupation']}\n"
            
            if person['bio']:
                info += f"  - Bio: {person['bio']}\n"
            
            parents = [p for p in person['parents'] if p]
            if parents:
                info += f"  - Parents: {', '.join(parents)}\n"
            
            spouses = [s for s in person['spouses'] if s]
            if spouses:
                info += f"  - Spouse(s): {', '.join(spouses)}\n"
            
            children = [c for c in person['children'] if c]
            if children:
                info += f"  - Children: {', '.join(children)}\n"
            
            context_parts.append(info)
        
        return "\n".join(context_parts)
    
    def generate_cypher_query(self, question: str) -> Optional[str]:
        """Use AI to generate a Cypher query for the question"""
        
        cypher_prompt = f"""You are a Neo4j Cypher expert. Generate a Cypher query to answer the following question about a family tree database.

Database Schema:
- Node: Person
  - Properties: id, firstName, lastName, fullName, gender, birthDate, deathDate, birthPlace, occupation, bio
- Relationships:
  - PARENT_OF: parent -> child
  - CHILD_OF: child -> parent  
  - SPOUSE_OF: person <-> person (bidirectional)
  - SIBLING_OF: person <-> person (bidirectional)

Question: {question}

Return ONLY the Cypher query, nothing else. No explanation, no markdown formatting."""

        try:
            response = self.client.generate_sync(
                prompt=cypher_prompt,
                system="You are a Cypher query generator. Return only valid Cypher queries.",
            )
            
            # Clean the response
            query = response.strip()
            query = query.replace("```cypher", "").replace("```", "").strip()
            
            return query
        except Exception as e:
            print(f"Error generating Cypher: {e}")
            return None
    
    def execute_cypher_for_question(self, question: str) -> str:
        """Generate and execute Cypher query based on question"""
        
        cypher_query = self.generate_cypher_query(question)
        
        if not cypher_query:
            return "Could not generate query"
        
        try:
            results = db.execute_query(cypher_query)
            return json.dumps(results, default=str, indent=2)
        except Exception as e:
            return f"Query error: {str(e)}"
    
    def answer_question(self, question: str) -> Dict:
        """Answer a question about the family tree using RAG"""
        
        # Get family context
        family_context = self.get_family_context()
        
        # Try to get specific data via Cypher
        specific_data = self.execute_cypher_for_question(question)
        
        # Build the prompt
        user_prompt = f"""Based on the following family information, please answer the question.

=== FAMILY MEMBERS ===
{family_context}

=== SPECIFIC QUERY RESULTS ===
{specific_data}

=== QUESTION ===
{question}

Please provide a helpful, accurate, and friendly answer based on the family information above."""

        try:
            response = self.client.generate_sync(
                prompt=user_prompt,
                system=self.system_prompt
            )
            
            return {
                "question": question,
                "answer": response,
                "sources": "Family Tree Database",
                "model": self.client.model
            }
        except Exception as e:
            return {
                "question": question,
                "answer": f"Sorry, I encountered an error: {str(e)}",
                "sources": None,
                "model": self.client.model
            }
    
    async def answer_question_async(self, question: str) -> Dict:
        """Async version of answer_question"""
        
        family_context = self.get_family_context()
        specific_data = self.execute_cypher_for_question(question)
        
        user_prompt = f"""Based on the following family information, please answer the question.

=== FAMILY MEMBERS ===
{family_context}

=== SPECIFIC QUERY RESULTS ===
{specific_data}

=== QUESTION ===
{question}

Please provide a helpful, accurate, and friendly answer."""

        try:
            response = await self.client.generate(
                prompt=user_prompt,
                system=self.system_prompt
            )
            
            return {
                "question": question,
                "answer": response,
                "sources": "Family Tree Database",
                "model": self.client.model
            }
        except Exception as e:
            return {
                "question": question,
                "answer": f"Sorry, I encountered an error: {str(e)}",
                "sources": None,
                "model": self.client.model
            }
    
    def get_relationship_explanation(self, person1_name: str, person2_name: str) -> Dict:
        """Explain the relationship between two people"""
        
        # Find the relationship path in the graph
        query = """
        MATCH (p1:Person), (p2:Person)
        WHERE toLower(p1.fullName) CONTAINS toLower($name1)
          AND toLower(p2.fullName) CONTAINS toLower($name2)
        MATCH path = shortestPath((p1)-[*]-(p2))
        RETURN p1.fullName as person1,
               p2.fullName as person2,
               [node in nodes(path) | node.fullName] as pathNames,
               [rel in relationships(path) | type(rel)] as relationships,
               length(path) as distance
        LIMIT 1
        """
        
        try:
            results = db.execute_query(query, {"name1": person1_name, "name2": person2_name})
        except Exception as e:
            return {"error": f"Database error: {str(e)}"}
        
        if not results:
            return {
                "error": f"Could not find relationship between '{person1_name}' and '{person2_name}'. Make sure both names exist in the family tree."
            }
        
        result = results[0]
        
        # Use AI to explain the relationship
        explain_prompt = f"""Explain the family relationship between {result['person1']} and {result['person2']}.

The path through the family tree is:
- People in path: {' → '.join(result['pathNames'])}
- Relationship types: {' → '.join(result['relationships'])}
- Distance: {result['distance']} step(s)

Provide a clear, natural language explanation of how they are related. 
Use common relationship terms like "grandfather", "aunt", "cousin", etc.
Be concise but complete."""

        try:
            explanation = self.client.generate_sync(
                prompt=explain_prompt,
                system="You are an expert at explaining family relationships clearly and concisely."
            )
            
            return {
                "person1": result['person1'],
                "person2": result['person2'],
                "path": result['pathNames'],
                "relationships": result['relationships'],
                "distance": result['distance'],
                "explanation": explanation,
                "model": self.client.model
            }
        except Exception as e:
            return {
                "person1": result['person1'],
                "person2": result['person2'],
                "path": result['pathNames'],
                "relationships": result['relationships'],
                "distance": result['distance'],
                "explanation": f"Error generating explanation: {str(e)}",
                "model": self.client.model
            }
    
    def get_family_summary(self) -> Dict:
        """Get a summary of the entire family tree"""
        
        # Get statistics
        stats_query = """
        MATCH (p:Person)
        OPTIONAL MATCH (p)-[:PARENT_OF]->(child:Person)
        OPTIONAL MATCH (p)-[:SPOUSE_OF]->(spouse:Person)
        WITH p, count(DISTINCT child) as childCount
        RETURN count(p) as totalMembers,
               sum(childCount) as totalParentChildRelations,
               count(CASE WHEN p.gender = 'male' THEN 1 END) as males,
               count(CASE WHEN p.gender = 'female' THEN 1 END) as females,
               count(CASE WHEN p.deathDate IS NOT NULL THEN 1 END) as deceased
        """
        
        stats = db.execute_query(stats_query)
        family_context = self.get_family_context()
        
        summary_prompt = f"""Based on the following family tree information, provide a brief, engaging summary of this family.

=== STATISTICS ===
- Total family members: {stats[0]['totalMembers'] if stats else 0}
- Males: {stats[0]['males'] if stats else 0}
- Females: {stats[0]['females'] if stats else 0}
- Deceased members: {stats[0]['deceased'] if stats else 0}

=== FAMILY MEMBERS ===
{family_context}

Write a 2-3 paragraph summary that:
1. Gives an overview of the family
2. Mentions key family members and their roles
3. Notes any interesting facts or patterns"""

        try:
            summary = self.client.generate_sync(
                prompt=summary_prompt,
                system="You are a family historian writing an engaging summary."
            )
            
            return {
                "statistics": stats[0] if stats else {},
                "summary": summary,
                "model": self.client.model
            }
        except Exception as e:
            return {
                "statistics": stats[0] if stats else {},
                "summary": f"Error generating summary: {str(e)}",
                "model": self.client.model
            }
    
    def suggest_questions(self) -> List[str]:
        """Suggest interesting questions users can ask"""
        
        family_context = self.get_family_context()
        
        prompt = f"""Based on this family tree, suggest 5 interesting questions that someone might want to ask about their family.

=== FAMILY MEMBERS ===
{family_context}

Return only the questions, one per line, without numbering."""

        try:
            response = self.client.generate_sync(
                prompt=prompt,
                system="You suggest interesting family history questions."
            )
            
            questions = [q.strip() for q in response.split('\n') if q.strip()]
            return questions[:5]
        except:
            return [
                "Who are the oldest members of the family?",
                "How many generations are in our family tree?",
                "Who has the most children?",
                "Are there any doctors or teachers in the family?",
                "Who are all the cousins?"
            ]


# Create singleton instance
rag_service = RAGService()