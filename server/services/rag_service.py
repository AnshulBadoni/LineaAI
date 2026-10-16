# services/rag_service.py
from database.postgres_connection import db
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
        query = """
        SELECT full_name AS name, first_name AS "firstName", last_name AS "lastName"
        FROM persons
        """
        results = db.execute_query(query)
        
        mentioned = []
        text_lower = text.lower()
        
        for person in results:
            if person.get('name') and person['name'].lower() in text_lower:
                mentioned.append(person['name'])
            elif person.get('firstName') and person['firstName'].lower() in text_lower:
                mentioned.append(person['name'])
        
        return list(dict.fromkeys(mentioned))

    def resolve_references(self, question: str, session_id: str) -> str:
        """Resolve pronouns and references to actual names"""
        reference_patterns = [
            r'\bhis\b', r'\bher\b', r'\btheir\b', r'\bhim\b', r'\bshe\b', r'\bhe\b',
            r'\bthat person\b', r'\bthe same\b', r'\bthis person\b',
            r'\bhis wife\b', r'\bher husband\b', r'\btheir children\b',
            r'\bthe previous\b', r'\bwhat about\b', r'\btell me more\b'
        ]
        
        has_reference = any(re.search(p, question.lower()) for p in reference_patterns)
        if not has_reference:
            return question
        
        history = self.memory.get_context_string(session_id, limit=4)
        last_mentioned = self.memory.get_last_mentioned_people(session_id)
        
        if not history and not last_mentioned:
            return question
        
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
        SELECT 
            p.id,
            p.full_name as name,
            p.birth_date as "birthDate",
            p.death_date as "deathDate",
            p.occupation as occupation,
            p.bio as bio,
            p.birth_place as "birthPlace",
            p.gender as gender,
            COALESCE(ARRAY_AGG(DISTINCT parent.full_name) FILTER (WHERE parent.full_name IS NOT NULL), '{}') as parents,
            COALESCE(ARRAY_AGG(DISTINCT child.full_name) FILTER (WHERE child.full_name IS NOT NULL), '{}') as children,
            COALESCE(ARRAY_AGG(DISTINCT spouse.full_name) FILTER (WHERE spouse.full_name IS NOT NULL), '{}') as spouses
        FROM persons p
        LEFT JOIN relationships r_p ON p.id = r_p.from_person_id AND r_p.relationship_type = 'CHILD_OF'
        LEFT JOIN persons parent ON r_p.to_person_id = parent.id
        LEFT JOIN relationships r_c ON p.id = r_c.from_person_id AND r_c.relationship_type = 'PARENT_OF'
        LEFT JOIN persons child ON r_c.to_person_id = child.id
        LEFT JOIN relationships r_s ON p.id = r_s.from_person_id AND r_s.relationship_type = 'SPOUSE_OF'
        LEFT JOIN persons spouse ON r_s.to_person_id = spouse.id
        GROUP BY p.id;
        """
        
        results = db.execute_query(query)
        
        context_parts = []
        for person in results:
            info = f"**{person['name']}**"
            
            if person.get('gender'):
                info += f" ({person['gender']})"
            info += "\n"
            
            if person.get('birthDate'):
                info += f"  - Born: {person['birthDate']}"
                if person.get('birthPlace'):
                    info += f" in {person['birthPlace']}"
                info += "\n"
            
            if person.get('deathDate'):
                info += f"  - Died: {person['deathDate']}\n"
            
            if person.get('occupation'):
                info += f"  - Occupation: {person['occupation']}\n"
            
            if person.get('bio'):
                info += f"  - Bio: {person['bio']}\n"
            
            parents = [p for p in (person.get('parents') or []) if p]
            if parents:
                info += f"  - Parents: {', '.join(parents)}\n"
            
            spouses = [s for s in (person.get('spouses') or []) if s]
            if spouses:
                info += f"  - Spouse(s): {', '.join(spouses)}\n"
            
            children = [c for c in (person.get('children') or []) if c]
            if children:
                info += f"  - Children: {', '.join(children)}\n"
            
            context_parts.append(info)
        
        return "\n".join(context_parts)

    def generate_sql_query(self, question: str) -> Optional[str]:
        """Use AI to generate a PostgreSQL query for the question"""
        sql_prompt = f"""You are a PostgreSQL expert. Generate a SQL SELECT query to answer the following question about a family tree database.

Database Schema:
Table: persons
Columns: id, first_name, last_name, full_name, gender, birth_date, death_date, birth_place, occupation, bio

Table: relationships
Columns: id, from_person_id, to_person_id, relationship_type, marriage_date
Valid relationship_types: 'PARENT_OF', 'CHILD_OF', 'SPOUSE_OF', 'SIBLING_OF', 'ADOPTED_PARENT_OF', 'ADOPTED_CHILD_OF', 'STEP_PARENT_OF', 'STEP_CHILD_OF', 'DIVORCED_FROM'

Question: {question}

Return ONLY the raw SQL SELECT query, nothing else. No markdown, no explanations, no semicolon at the end."""

        try:
            response = self.client.generate_sync(
                prompt=sql_prompt,
                system="You are a SQL query generator. Return only valid PostgreSQL SELECT queries.",
            )
            query = response.strip()
            query = query.replace("```sql", "").replace("```", "").strip()
            # Only allow SELECT queries
            if not query.lower().startswith("select") and not query.lower().startswith("with"):
                return None
            return query
        except Exception as e:
            print(f"Error generating SQL: {e}")
            return None

    def execute_sql_for_question(self, question: str) -> str:
        """Generate and execute SQL query based on question"""
        sql_query = self.generate_sql_query(question)
        if not sql_query:
            return "Could not generate query"
        
        try:
            results = db.execute_query(sql_query)
            return json.dumps(results, default=str, indent=2)
        except Exception as e:
            return f"Query error: {str(e)}"

    def answer_question(self, question: str, session_id: Optional[str] = None) -> Dict:
        """Answer a question about the family tree using RAG with memory"""
        session_id = self.memory.get_or_create_session(session_id)
        resolved_question = self.resolve_references(question, session_id)
        family_context = self.get_family_context()
        specific_data = self.execute_sql_for_question(resolved_question)
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

Please provide a helpful, accurate, and friendly answer based on the family information above.
Remember the context of our conversation when answering."""

        try:
            response = self.client.generate_sync(
                prompt=user_prompt,
                system=self.system_prompt
            )
            
            mentioned_people = self.extract_mentioned_people(response, family_context)
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
        session_id = self.memory.get_or_create_session(session_id)
        resolved_question = self.resolve_references(question, session_id)
        family_context = self.get_family_context()
        specific_data = self.execute_sql_for_question(resolved_question)
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
            
            mentioned_people = self.extract_mentioned_people(response, family_context)
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
        from services.family_services import family_service
        
        p1_list = db.execute_query(
            "SELECT id, full_name FROM persons WHERE LOWER(full_name) LIKE %(name)s LIMIT 1",
            {"name": f"%{person1_name.lower()}%"}
        )
        p2_list = db.execute_query(
            "SELECT id, full_name FROM persons WHERE LOWER(full_name) LIKE %(name)s LIMIT 1",
            {"name": f"%{person2_name.lower()}%"}
        )
        
        if not p1_list or not p2_list:
            return {
                "error": f"Could not find one or both persons ('{person1_name}', '{person2_name}') in the database."
            }
        
        p1 = p1_list[0]
        p2 = p2_list[0]
        
        path_info = family_service.find_relationship(p1["id"], p2["id"])
        if not path_info:
            return {
                "error": f"Could not find a relationship between '{p1['full_name']}' and '{p2['full_name']}'."
            }
        
        distance = len(path_info["relationships"])
        explain_prompt = f"""Explain the family relationship between {p1['full_name']} and {p2['full_name']}.

The path through the family tree is:
- People in path: {' → '.join(path_info['names'])}
- Relationship types: {' → '.join(path_info['relationships'])}
- Distance: {distance} step(s)

Provide a clear, natural language explanation of how they are related."""

        try:
            explanation = self.client.generate_sync(
                prompt=explain_prompt,
                system="You are an expert at explaining family relationships clearly and concisely."
            )
            
            if session_id:
                session_id = self.memory.get_or_create_session(session_id)
                self.memory.add_message(
                    session_id, "user", 
                    f"How are {person1_name} and {person2_name} related?",
                    [p1['full_name'], p2['full_name']]
                )
                self.memory.add_message(
                    session_id, "assistant", explanation,
                    [p1['full_name'], p2['full_name']]
                )
            
            return {
                "person1": p1['full_name'],
                "person2": p2['full_name'],
                "path": path_info['names'],
                "relationships": path_info['relationships'],
                "distance": distance,
                "explanation": explanation,
                "session_id": session_id,
                "model": self.client.model
            }
        except Exception as e:
            return {
                "person1": p1['full_name'],
                "person2": p2['full_name'],
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
        count_persons = db.execute_query("SELECT COUNT(*) AS total FROM persons")[0]["total"]
        count_rels = db.execute_query("SELECT COUNT(*) AS total FROM relationships")[0]["total"]
        return {
            "total_persons": count_persons,
            "total_relationships": count_rels,
            "database": "PostgreSQL (Supabase)"
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