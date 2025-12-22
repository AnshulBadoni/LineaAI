# services/conversation_memory.py
from typing import Dict, List, Optional
from datetime import datetime, timedelta
from dataclasses import dataclass, field
import threading
import uuid


@dataclass
class Message:
    role: str
    content: str
    timestamp: datetime = field(default_factory=datetime.now)


@dataclass
class Conversation:
    session_id: str
    messages: List[Message] = field(default_factory=list)
    created_at: datetime = field(default_factory=datetime.now)
    last_activity: datetime = field(default_factory=datetime.now)
    
    # Store context for reference resolution
    last_mentioned_people: List[str] = field(default_factory=list)
    current_topic: Optional[str] = None


class ConversationMemory:
    """Manages conversation history for stateful RAG"""
    
    def __init__(self, max_history: int = 10, session_timeout_minutes: int = 60):
        self.conversations: Dict[str, Conversation] = {}
        self.max_history = max_history
        self.session_timeout = timedelta(minutes=session_timeout_minutes)
        self._lock = threading.Lock()
    
    def create_session(self) -> str:
        """Create a new conversation session"""
        session_id = str(uuid.uuid4())
        with self._lock:
            self.conversations[session_id] = Conversation(session_id=session_id)
        return session_id
    
    def get_or_create_session(self, session_id: Optional[str] = None) -> str:
        """Get existing session or create new one"""
        if session_id and session_id in self.conversations:
            # Check if session is still valid
            conv = self.conversations[session_id]
            if datetime.now() - conv.last_activity < self.session_timeout:
                conv.last_activity = datetime.now()
                return session_id
        
        # Create new session
        return self.create_session()
    
    def add_message(self, session_id: str, role: str, content: str, 
                    mentioned_people: List[str] = None):
        """Add a message to the conversation"""
        with self._lock:
            if session_id not in self.conversations:
                self.conversations[session_id] = Conversation(session_id=session_id)
            
            conv = self.conversations[session_id]
            conv.messages.append(Message(role=role, content=content))
            conv.last_activity = datetime.now()
            
            # Update mentioned people for reference resolution
            if mentioned_people:
                conv.last_mentioned_people = mentioned_people
            
            # Trim history if too long
            if len(conv.messages) > self.max_history * 2:
                conv.messages = conv.messages[-self.max_history * 2:]
    
    def get_history(self, session_id: str, limit: Optional[int] = None) -> List[Message]:
        """Get conversation history"""
        if session_id not in self.conversations:
            return []
        
        messages = self.conversations[session_id].messages
        if limit:
            return messages[-limit:]
        return messages
    
    def get_context_string(self, session_id: str, limit: int = 6) -> str:
        """Format conversation history for the AI prompt"""
        messages = self.get_history(session_id, limit)
        
        if not messages:
            return ""
        
        context_parts = ["=== CONVERSATION HISTORY ==="]
        for msg in messages:
            role_label = "User" if msg.role == "user" else "Assistant"
            context_parts.append(f"{role_label}: {msg.content}")
        
        return "\n".join(context_parts)
    
    def get_last_mentioned_people(self, session_id: str) -> List[str]:
        """Get the last mentioned people for reference resolution"""
        if session_id not in self.conversations:
            return []
        return self.conversations[session_id].last_mentioned_people
    
    def clear_session(self, session_id: str):
        """Clear a specific session"""
        with self._lock:
            if session_id in self.conversations:
                del self.conversations[session_id]
    
    def cleanup_expired_sessions(self):
        """Remove expired sessions"""
        now = datetime.now()
        with self._lock:
            expired = [
                sid for sid, conv in self.conversations.items()
                if now - conv.last_activity > self.session_timeout
            ]
            for sid in expired:
                del self.conversations[sid]


# Singleton instance
conversation_memory = ConversationMemory()