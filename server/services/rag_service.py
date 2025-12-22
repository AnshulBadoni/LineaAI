# services/rag_service.py
from database.neo4j_connection import db
from services.pollinations import PollinationsClient
from services.conversation_memory import conversation_memory
from configs.config import settings
from typing import Dict, List, Optional
import json
import re


class RAGService:
    """RAG Service with conversation memory for stateful interactions"""
    
    def __init__(self):
        self.client = PollinationsClient(
            model=settings.ai_model,
            timeout=settings.ai_timeout
        )
        self.memory = conversation_memory
        
        self.system_prompt = """You are a helpful family tree assistant. You have access to information about a family.
Your job is to answer questions about family members, their relationships, and their details.

Guidelines:
- Be accurate and only use the information provided
- If you don't know something, say so
- When describing relationships, be specific (e.g., "grandmother", "uncle", "cousin")
- Explain how people are related through their common ancestors if relevant
- Be friendly and conversational
- Remember context from previous messages in our conversation
- When users say "he", "she", "they", "his wife", "her children", etc., refer to the conversation history to understand who they mean
- If a reference is ambiguous, ask for clarification"""

    def extract_mentioned_people(self, text: str, family_context: str) -> List[str]:
        """Extract names of people mentioned in the text"""
        # Get all names from family context
        query = """
        MATCH (p:Person)
        RETURN p.fullName as name, p.firstName as firstName, p.lastName as lastName
        """
        results = db.execute_query(query)
        
        mentioned = []
        text_lower = text.lower()
        
        for person in results:
            if person['name'] and person['name'].lower() in text_lower:
                mentioned.append(person['name'])
            elif person['firstName'] and person['firstName'].lower() in text_lower:
                mentioned.append(person['name'])
        
        return mentioned

    def resolve_references(self, question: str, session_id: str) -> str:
        """Resolve pronouns and references to actual names"""
        
        # Check if question contains references that need resolution
        reference_patterns = [
            r'\bhis\b', r'\bher\b', r'\btheir\b', r'\bhim\b', r'\bshe\b', r'\bhe\b',
            r'\bthat person\b', r'\bthe same\b', r'\bthis person\b',
            r'\bhis wife\b', r'\bher husband\b', r'\btheir children\b',
            r'\bthe previous\b', r'\bwhat about\b', r'\btell me more\b'
        ]
        
        has_reference = any(re.search(p, question.lower()) for p in reference_patterns)
        
        if not has_reference:
            return question
        
        # Get conversation history and last mentioned people
        history = self.memory.get_context_string(session_id, limit=4)
        last_mentioned = self.memory.get_last_mentioned_people(session_id)
        
        if not history and not last_mentioned:
            return question
        
        # Use AI to resolve references
        resolve_prompt = f"""Given the conversation history and the new question, rewrite the question to be self-contained by replacing pronouns and references with actual names.

{history}

Last mentioned people: {', '.join(last_mentioned) if last_mentioned else 'None'}

New question: "{question}"

Rewrite this question to replace any pronouns (he, she, his, her, they, etc.) or references (that person, the previous one, etc.) with the actual names from the conversation.
If the question is already self-contained, return it unchanged.
Return ONLY the rewritten question, nothing else."""

        try:
            resolved = self.client.generate_sync(
                prompt=resolve_prompt,
                system="You resolve references in questions. Return only the rewritten question."
            )
            return resolved.strip().strip('"')
        except:
            return question

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

    def answer_question(self, question: str, session_id: Optional[str] = None) -> Dict:
        """Answer a question about the family tree using RAG with memory"""
        
        # Get or create session
        session_id = self.memory.get_or_create_session(session_id)
        
        # Resolve references in the question
        resolved_question = self.resolve_references(question, session_id)
        
        # Get family context
        family_context = self.get_family_context()
        
        # Try to get specific data via Cypher
        specific_data = self.execute_cypher_for_question(resolved_question)
        
        # Get conversation history
        conversation_history = self.memory.get_context_string(session_id, limit=6)
        
        # Build the prompt
        user_prompt = f"""Based on the following family information and our conversation, please answer the question.

=== FAMILY MEMBERS ===
{family_context}

=== SPECIFIC QUERY RESULTS ===
{specific_data}

{conversation_history}

=== CURRENT QUESTION ===
Original: {question}
{f"Interpreted as: {resolved_question}" if resolved_question != question else ""}

Please provide a helpful, accurate, and friendly answer based on the family information above.
Remember the context of our conversation when answering."""

        try:
            response = self.client.generate_sync(
                prompt=user_prompt,
                system=self.system_prompt
            )
            
            # Extract mentioned people for future reference resolution
            mentioned_people = self.extract_mentioned_people(response, family_context)
            
            # Store the conversation
            self.memory.add_message(session_id, "user", question, mentioned_people)
            self.memory.add_message(session_id, "assistant", response, mentioned_people)
            
            return {
                "question": question,
                "interpreted_as": resolved_question if resolved_question != question else None,
                "answer": response,
                "session_id": session_id,
                "sources": "Family Tree Database",
                "model": self.client.model
            }
        except Exception as e:
            return {
                "question": question,
                "answer": f"Sorry, I encountered an error: {str(e)}",
                "session_id": session_id,
                "sources": None,
                "model": self.client.model
            }

    async def answer_question_async(self, question: str, session_id: Optional[str] = None) -> Dict:
        """Async version of answer_question"""
        
        # Get or create session
        session_id = self.memory.get_or_create_session(session_id)
        
        # Resolve references
        resolved_question = self.resolve_references(question, session_id)
        
        family_context = self.get_family_context()
        specific_data = self.execute_cypher_for_question(resolved_question)
        conversation_history = self.memory.get_context_string(session_id, limit=6)
        
        user_prompt = f"""Based on the following family information and our conversation, please answer the question.

=== FAMILY MEMBERS ===
{family_context}

=== SPECIFIC QUERY RESULTS ===
{specific_data}

{conversation_history}

=== CURRENT QUESTION ===
Original: {question}
{f"Interpreted as: {resolved_question}" if resolved_question != question else ""}

Please provide a helpful, accurate, and friendly answer."""

        try:
            response = await self.client.generate(
                prompt=user_prompt,
                system=self.system_prompt
            )
            
            # Extract mentioned people
            mentioned_people = self.extract_mentioned_people(response, family_context)
            
            # Store conversation
            self.memory.add_message(session_id, "user", question, mentioned_people)
            self.memory.add_message(session_id, "assistant", response, mentioned_people)
            
            return {
                "question": question,
                "interpreted_as": resolved_question if resolved_question != question else None,
                "answer": response,
                "session_id": session_id,
                "sources": "Family Tree Database",
                "model": self.client.model
            }
        except Exception as e:
            return {
                "question": question,
                "answer": f"Sorry, I encountered an error: {str(e)}",
                "session_id": session_id,
                "sources": None,
                "model": self.client.model
            }

    def get_relationship_explanation(self, person1_name: str, person2_name: str, 
                                      session_id: Optional[str] = None) -> Dict:
        """Explain the relationship between two people"""
        
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
                "error": f"Could not find relationship between '{person1_name}' and '{person2_name}'."
            }
        
        result = results[0]
        
        explain_prompt = f"""Explain the family relationship between {result['person1']} and {result['person2']}.

The path through the family tree is:
- People in path: {' → '.join(result['pathNames'])}
- Relationship types: {' → '.join(result['relationships'])}
- Distance: {result['distance']} step(s)

Provide a clear, natural language explanation of how they are related."""

        try:
            explanation = self.client.generate_sync(
                prompt=explain_prompt,
                system="You are an expert at explaining family relationships clearly and concisely."
            )
            
            # Store in memory if session provided
            if session_id:
                session_id = self.memory.get_or_create_session(session_id)
                self.memory.add_message(
                    session_id, "user", 
                    f"How are {person1_name} and {person2_name} related?",
                    [result['person1'], result['person2']]
                )
                self.memory.add_message(
                    session_id, "assistant", explanation,
                    [result['person1'], result['person2']]
                )
            
            return {
                "person1": result['person1'],
                "person2": result['person2'],
                "path": result['pathNames'],
                "relationships": result['relationships'],
                "distance": result['distance'],
                "explanation": explanation,
                "session_id": session_id,
                "model": self.client.model
            }
        except Exception as e:
            return {
                "person1": result['person1'],
                "person2": result['person2'],
                "explanation": f"Error generating explanation: {str(e)}",
                "model": self.client.model
            }

    def get_conversation_history(self, session_id: str) -> List[Dict]:
        """Get conversation history for a session"""
        messages = self.memory.get_history(session_id)
        return [
            {
                "role": msg.role,
                "content": msg.content,
                "timestamp": msg.timestamp.isoformat()
            }
            for msg in messages
        ]

    def clear_conversation(self, session_id: str):
        """Clear conversation history for a session"""
        self.memory.clear_session(session_id)

    def get_family_summary(self) -> Dict:
        """Get a summary of the entire family tree"""
        # ... (keep existing implementation)
        pass

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