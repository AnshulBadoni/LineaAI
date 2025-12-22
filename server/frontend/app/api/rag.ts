const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

export interface RAGResponse {
    question: string;
    interpreted_as?: string | null;
    answer: string;
    session_id: string;
    sources: string | null;
    model: string;
    images?: string[];
}

export interface ConversationHistory {
    session_id: string;
    messages: {
        role: string;
        content: string;
        timestamp: string;
    }[];
}

export async function fetchRAGResponse(
    question: string,
    sessionId?: string | null
): Promise<RAGResponse> {
    const response = await fetch(`${BASE_URL}/api/rag/ask`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            question,
            session_id: sessionId || null
        }),
    });

    if (!response.ok) {
        throw new Error("Failed to fetch RAG response");
    }

    return await response.json();
}

export async function createSession(): Promise<{ session_id: string }> {
    const response = await fetch(`${BASE_URL}/api/rag/session`, {
        method: "POST",
    });

    if (!response.ok) {
        throw new Error("Failed to create session");
    }

    return await response.json();
}

export async function getConversationHistory(
    sessionId: string
): Promise<ConversationHistory> {
    const response = await fetch(`${BASE_URL}/api/rag/history/${sessionId}`);

    if (!response.ok) {
        throw new Error("Failed to fetch history");
    }

    return await response.json();
}

export async function clearSession(sessionId: string): Promise<void> {
    await fetch(`${BASE_URL}/api/rag/session/${sessionId}`, {
        method: "DELETE",
    });
}

export async function getRelationship(
    person1: string,
    person2: string,
    sessionId?: string | null
) {
    const response = await fetch(`${BASE_URL}/api/rag/relationship`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            person1,
            person2,
            session_id: sessionId || null
        }),
    });

    if (!response.ok) {
        throw new Error("Failed to fetch relationship");
    }

    return await response.json();
}