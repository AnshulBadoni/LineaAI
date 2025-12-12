const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

export async function fetchRAGResponse(question: string) {
    const response = await fetch(`${BASE_URL}/api/rag/ask`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ question }),
    });

    if (!response.ok) {
        throw new Error("Failed to fetch RAG response");
    }

    return await response.json();
}