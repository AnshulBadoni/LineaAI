"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import PeopleDirectory from "../components/People";
import { fetchRAGResponse, clearSession, createSession } from "../api/rag";
import Link from "next/link";
import { create } from "domain";

// --- Types ---
type Role = "user" | "ai";

interface ExtractionData {
    title: string;
    items: string[];
    type: "person" | "relationship";
}

interface Message {
    id: string;
    role: Role;
    text?: string;
    images?: string[];
    extraction?: ExtractionData;
    timestamp: Date;
    interpretedAs?: string | null; // NEW: Show how AI interpreted the question
}

// --- Session Storage Helper ---
const SESSION_STORAGE_KEY = "linea_session_id";

const getStoredSessionId = (): string | null => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(SESSION_STORAGE_KEY);
};

const storeSessionId = (sessionId: string): void => {
    if (typeof window !== "undefined") {
        localStorage.setItem(SESSION_STORAGE_KEY, sessionId);
    }
};

const clearStoredSessionId = (): void => {
    if (typeof window !== "undefined") {
        localStorage.removeItem(SESSION_STORAGE_KEY);
    }
};

// --- Generic Query Detection ---

const genericPatterns = [
    { patterns: ['hi', 'hello', 'hey', 'hola', 'howdy', 'greetings', 'hi there', 'hello there', 'hey there'], response: "Hello! I'm Linea, your ancestry assistant. How can I help you explore your family history today?" },
    { patterns: ['how are you', 'how r u', "how's it going", 'whats up', "what's up", 'sup', 'how is it going', 'hows it going'], response: "I'm doing great, thank you for asking! I'm ready to help you discover your ancestry. What would you like to know about your family history?" },
    { patterns: ['thank', 'thanks', 'thx', 'ty', 'thank you', 'thanks a lot', 'thank you so much'], response: "You're welcome! Is there anything else about your family history I can help you with?" },
    { patterns: ['bye', 'goodbye', 'see you', 'later', 'cya', 'see ya', 'take care'], response: "Goodbye! Feel free to return anytime you want to explore more of your family history. Take care!" },
    { patterns: ['good morning'], response: "Good morning! Ready to dive into some family history research today?" },
    { patterns: ['good afternoon'], response: "Good afternoon! How can I assist with your genealogy research?" },
    { patterns: ['good evening', 'good night'], response: "Good evening! Would you like to explore your ancestry before the day ends?" },
    { patterns: ['who are you', 'what are you', 'what can you do', 'what do you do'], response: "I'm Linea, an AI assistant specialized in genealogy and ancestry research. I can help you:\n\n• Analyze old documents and certificates\n• Find information about ancestors\n• Understand family relationships\n• Build your family tree\n\nWhat would you like to explore?" },
    { patterns: ['help', 'what can i ask', 'how does this work', 'how do i use this'], response: "I can help you with:\n\n• **Analyzing documents** - Upload old certificates, photos, or records\n• **Finding ancestors** - Ask about specific family members\n• **Understanding relationships** - \"How is X related to Y?\"\n• **Building your tree** - I'll help organize your family history\n\nJust ask me anything about your family!" },
    { patterns: ['ok', 'okay', 'cool', 'nice', 'great', 'awesome', 'alright', 'got it', 'i see', 'understood'], response: "Great! Let me know if you'd like to explore any aspect of your family history." },
    { patterns: ['yes', 'yep', 'yeah', 'yup', 'sure', 'of course'], response: "Perfect! What would you like to know about your ancestry?" },
    { patterns: ['no', 'nope', 'not really', 'nothing', 'nevermind', 'never mind'], response: "No problem! I'm here whenever you're ready to explore your family history." },
];

// Question indicators that suggest a real query
const questionIndicators = [
    // Question words
    'who', 'what', 'where', 'when', 'why', 'how', 'which', 'whose', 'whom',
    // Question starters
    'can you', 'could you', 'would you', 'will you', 'do you', 'does',
    'is there', 'are there', 'was there', 'were there',
    'tell me', 'show me', 'find', 'search', 'look up', 'lookup',
    'explain', 'describe', 'list',
    // Family-specific
    'my father', 'my mother', 'my sister', 'my brother', 'my parent',
    'my grandpa', 'my grandma', 'my grandfather', 'my grandmother',
    'my uncle', 'my aunt', 'my cousin', 'my family', 'my ancestor',
    'my wife', 'my husband', 'my son', 'my daughter', 'my child',
    'related to', 'relationship', 'married', 'born', 'died', 'lived',
    // Pronouns that suggest follow-up
    'his', 'her', 'their', 'them', 'he', 'she', 'they',
];

// Check if the text contains a real question
const containsQuestion = (text: string): boolean => {
    const lowerText = text.toLowerCase();

    // Check for question mark
    if (text.includes('?')) {
        return true;
    }

    // Check for question indicators
    for (const indicator of questionIndicators) {
        if (lowerText.includes(indicator)) {
            return true;
        }
    }

    return false;
};

// Check if it's a short, simple message (likely just a greeting)
const isShortMessage = (text: string): boolean => {
    const words = text.trim().split(/\s+/);
    return words.length <= 5; // 5 words or less
};

const getGenericResponse = (text: string): string | null => {
    const lowerText = text.toLowerCase().trim();
    const cleanText = lowerText.replace(/[.,!?;:'"]/g, '').trim();

    // If the message contains a real question, don't return generic response
    if (containsQuestion(lowerText)) {
        return null;
    }

    // Only check for generic patterns
    for (const item of genericPatterns) {
        for (const pattern of item.patterns) {
            // Exact match
            if (cleanText === pattern) {
                return item.response;
            }

            // Starts with pattern, but only if it's a short message
            if (isShortMessage(cleanText) &&
                (cleanText.startsWith(pattern + ' ') || cleanText.startsWith(pattern + ','))) {
                return item.response;
            }
        }
    }

    return null;
};

// --- Icons ---
const Icons = {
    Mic: () => (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
        </svg>
    ),
    Paperclip: () => (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
        </svg>
    ),
    Send: () => (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
        </svg>
    ),
    X: () => (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
        </svg>
    ),
    Sparkles: () => (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
        </svg>
    ),
    Tree: () => (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
        </svg>
    ),
    Chat: () => (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
    ),
    Copy: () => (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
    ),
    Check: () => (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
    ),
    Regenerate: () => (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
    ),
    NewChat: () => (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
        </svg>
    ),
    Info: () => (
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    ),
};

// --- Sub-Components ---

const NavigationPill = ({
    activeTab,
    onTabChange,
    onNewChat,
    hasMessages
}: {
    activeTab: string;
    onTabChange: (t: string) => void;
    onNewChat: () => void;
    hasMessages: boolean;
}) => {
    return (
        <div className="fixed sm:sticky bottom-6 sm:bottom-auto sm:top-10 z-40 left-0 right-0 flex justify-center pointer-events-none">
            <div className="pointer-events-auto bg-stone-900/90 backdrop-blur-md text-stone-400 p-1.5 rounded-full shadow-2xl shadow-stone-900/20 flex items-center gap-1 border border-stone-700/50 transform transition-all hover:scale-105">
                {/* New Chat Button - Only show when there are messages */}
                {hasMessages && activeTab === "chat" && (
                    <button
                        onClick={onNewChat}
                        className="px-4 py-2.5 rounded-full text-sm font-medium transition-all duration-300 flex items-center gap-2 hover:text-stone-200 hover:bg-stone-800"
                        title="Start new conversation"
                    >
                        <Icons.NewChat />
                        <span className="hidden sm:inline">New</span>
                    </button>
                )}
                <button
                    onClick={() => onTabChange("chat")}
                    className={`px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-300 flex items-center gap-2 ${activeTab === "chat" ? "bg-stone-100 text-stone-900 shadow-sm" : "hover:text-stone-200"}`}
                >
                    <Icons.Chat />
                    <span>Assistant</span>
                </button>
                <button
                    onClick={() => onTabChange("tree")}
                    className={`px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-300 flex items-center gap-2 ${activeTab === "tree" ? "bg-stone-100 text-stone-900 shadow-sm" : "hover:text-stone-200"}`}
                >
                    <Icons.Tree />
                    <span>Ancestry</span>
                </button>
                <Link
                    href={"https://anshulbadoni-portfolio.vercel.app/#contact"}
                    className={`px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-300 flex items-center gap-2 ${activeTab === "feedback" ? "bg-stone-100 text-stone-900 shadow-sm" : "hover:text-stone-200"}`}
                >
                    <Icons.Sparkles />
                    <span>Feedback </span>
                </Link>
            </div>
        </div>
    );
};

const ExtractionCard = ({ data }: { data: ExtractionData }) => (
    <div className="mt-4 mb-2 bg-white rounded-xl border border-stone-200 shadow-[0_4px_20px_-8px_rgba(0,0,0,0.05)] overflow-hidden max-w-sm w-full transition-all hover:shadow-lg">
        <div className="px-5 py-4 flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center text-amber-600 shrink-0 mt-1">
                <Icons.Sparkles />
            </div>
            <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold text-amber-600 uppercase tracking-widest border border-amber-100 px-2 py-0.5 rounded-full bg-amber-50/50">
                        {data.type}
                    </span>
                    <span className="text-[10px] text-stone-400">AI Confidence: 98%</span>
                </div>
                <h3 className="font-serif text-lg text-stone-900 mb-2">{data.title}</h3>
                <ul className="space-y-2 mb-4">
                    {data.items.map((item, i) => (
                        <li key={i} className="text-sm text-stone-600 flex items-center gap-2">
                            <span className="w-1 h-1 bg-stone-300 rounded-full"></span>
                            {item}
                        </li>
                    ))}
                </ul>
                <div className="flex gap-2">
                    <button className="flex-1 bg-stone-900 text-stone-50 text-xs font-medium py-2 rounded hover:bg-stone-800 transition-colors">
                        Add to Lineage
                    </button>
                    <button className="px-4 py-2 border border-stone-200 text-stone-600 text-xs font-medium rounded hover:bg-stone-50 transition-colors">
                        Review
                    </button>
                </div>
            </div>
        </div>
    </div>
);

// Format text with markdown-like styling
const formatMessageText = (text: string) => {
    if (!text) return '';

    // Bold text **text**
    let formatted = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

    // Convert bullet points
    formatted = formatted.replace(/^• /gm, '<span class="inline-block w-1.5 h-1.5 bg-stone-400 rounded-full mr-2 mb-0.5"></span>');

    return formatted;
};

// NEW: Interpretation Badge Component
const InterpretationBadge = ({ original, interpreted }: { original: string; interpreted: string }) => (
    <div className="mb-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-xs">
        <div className="flex items-start gap-2">
            <Icons.Info />
            <div>
                <span className="text-amber-700 font-medium">Understood as: </span>
                <span className="text-amber-600">{interpreted}</span>
            </div>
        </div>
    </div>
);

const MessageBubble = ({ message, onRegenerate }: { message: Message; onRegenerate?: () => void }) => {
    const isUser = message.role === "user";
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        if (message.text) {
            await navigator.clipboard.writeText(message.text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    if (isUser) {
        return (
            <div className="flex justify-end mb-6 animate-fade-in-up">
                <div className="max-w-[85%] sm:max-w-[70%]">
                    {message.images && message.images.length > 0 && (
                        <div className="mb-3 flex flex-wrap gap-2 justify-end">
                            {message.images.map((img, idx) => (
                                <div key={idx} className="p-1 bg-white border border-stone-200 shadow-sm rounded-xl">
                                    <img src={img} alt="attachment" className="max-h-48 rounded-lg object-cover" />
                                </div>
                            ))}
                        </div>
                    )}
                    {message.text && (
                        <div className="bg-stone-900 text-stone-50 px-5 py-3.5 rounded-2xl rounded-tr-md shadow-lg">
                            <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{message.text}</p>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // AI Message
    return (
        <div className="mb-6 animate-fade-in-up">
            <div className="flex items-start gap-4">
                {/* Avatar */}
                <div className="w-9 h-9 rounded-full bg-linear-to-br from-amber-100 to-orange-50 flex items-center justify-center shrink-0 border border-amber-200/50 shadow-sm">
                    <span className="font-serif text-amber-700 text-sm">L</span>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    {/* Header */}
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-semibold text-stone-900">Linea</span>
                        <span className="text-xs text-stone-400">AI Assistant</span>
                    </div>

                    {/* Show interpretation if question was rephrased */}
                    {message.interpretedAs && (
                        <InterpretationBadge
                            original={message.text || ''}
                            interpreted={message.interpretedAs}
                        />
                    )}

                    {/* Message Box */}
                    <div className="bg-white border border-stone-200 rounded-2xl rounded-tl-md shadow-sm overflow-hidden">
                        {message.images && message.images.length > 0 && (
                            <div className="p-4 flex flex-wrap gap-2">
                                {message.images.map((img, idx) => (
                                    <div key={idx} className="p-1 bg-white border border-stone-200 shadow-sm rounded-xl">
                                        <img src={img} alt="attachment" className="max-h-60 rounded-lg object-cover" />
                                    </div>
                                ))}
                            </div>
                        )}

                        {message.text && (
                            <div className="px-5 py-4">
                                <div
                                    className="text-[15px] text-stone-700 leading-relaxed whitespace-pre-wrap"
                                    dangerouslySetInnerHTML={{ __html: formatMessageText(message.text) }}
                                />
                            </div>
                        )}

                        {/* Action Bar */}
                        <div className="px-4 py-2.5 bg-stone-50/80 border-t border-stone-100 flex items-center gap-1">
                            <button
                                onClick={handleCopy}
                                className={`p-2 rounded-lg transition-all flex items-center gap-1.5 text-xs font-medium ${copied
                                    ? 'text-green-600 bg-green-50'
                                    : 'text-stone-400 hover:text-stone-600 hover:bg-stone-100'
                                    }`}
                            >
                                {copied ? <Icons.Check /> : <Icons.Copy />}
                                <span>{copied ? 'Copied!' : 'Copy'}</span>
                            </button>
                            {onRegenerate && (
                                <button
                                    onClick={onRegenerate}
                                    className="p-2 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-lg transition-all flex items-center gap-1.5 text-xs font-medium"
                                >
                                    <Icons.Regenerate />
                                    <span>Regenerate</span>
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Extraction Card */}
                    {message.extraction && <ExtractionCard data={message.extraction} />}
                </div>
            </div>
        </div>
    );
};

const ThinkingIndicator = () => (
    <div className="mb-6 animate-fade-in">
        <div className="flex items-start gap-4">
            <div className="w-9 h-9 rounded-full bg-linear-to-br from-amber-100 to-orange-50 flex items-center justify-center shrink-0 border border-amber-200/50 shadow-sm">
                <span className="font-serif text-amber-700 text-sm">L</span>
            </div>
            <div className="flex-1 pt-2">
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-stone-400 rounded-full animate-pulse" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-2 h-2 bg-stone-400 rounded-full animate-pulse" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-2 h-2 bg-stone-400 rounded-full animate-pulse" style={{ animationDelay: '300ms' }}></div>
                    </div>
                    <span className="text-xs text-stone-400 font-medium">Thinking...</span>
                </div>
            </div>
        </div>
    </div>
);

const EmptyState = ({ onSuggestionClick }: { onSuggestionClick: (text: string) => void }) => (
    <div className="flex flex-col items-center justify-center h-full text-center px-4 animate-fade-in pb-20">
        <div className="w-16 h-16 bg-linear-to-br from-amber-100 to-orange-50 rounded-full flex items-center justify-center mb-6 shadow-inner border border-white">
            <span className="font-serif text-3xl text-amber-700">L</span>
        </div>
        <h1 className="font-serif text-3xl md:text-4xl text-stone-900 mb-3">
            Uncover your origins.
        </h1>
        <p className="text-stone-500 max-w-md text-base leading-relaxed">
            I can analyze family trees, identify relationships, or simply chat about your family history to build your tree.
        </p>

        {/* Conversational hint */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
            <button
                onClick={() => onSuggestionClick("Can you tell me about my grandparents.")}
                className="p-4 bg-white border border-stone-200 rounded-xl text-left hover:border-amber-300 hover:shadow-md transition-all group"
            >
                <span className="block text-xs font-bold text-stone-400 mb-1 group-hover:text-amber-600">SUGGESTION</span>
                <span className="text-sm text-stone-700">&quot;Can you tell me about my grandparents.&quot;</span>
            </button>
            <button
                onClick={() => onSuggestionClick("Who were the parents of John Smith?")}
                className="p-4 bg-white border border-stone-200 rounded-xl text-left hover:border-amber-300 hover:shadow-md transition-all group"
            >
                <span className="block text-xs font-bold text-stone-400 mb-1 group-hover:text-amber-600">SUGGESTION</span>
                <span className="text-sm text-stone-700">&quot;Who were the parents of John Smith?&quot;</span>
            </button>
        </div>
    </div>
);

// NEW: Session indicator component
const SessionIndicator = ({ isActive }: { isActive: boolean }) => (
    <div className="fixed top-4 right-4 z-50">
        <div className={`px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-2 ${isActive
            ? 'bg-green-100 text-green-700 border border-green-200'
            : 'bg-stone-100 text-stone-500 border border-stone-200'
            }`}>
            <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-green-500' : 'bg-stone-400'}`}></span>
            {isActive ? 'Session Active' : 'No Session'}
        </div>
    </div>
);

// --- Main Page ---

export default function Page() {
    const [activeTab, setActiveTab] = useState("chat");
    const [inputValue, setInputValue] = useState("");
    const [attachedImage, setAttachedImage] = useState<string | null>(null);
    const [isThinking, setIsThinking] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [isInitialized, setIsInitialized] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Load session from localStorage on mount
    useEffect(() => {
        const initializeSession = async () => {
            // Check localStorage first
            const storedSession = getStoredSessionId();

            if (storedSession) {
                console.log("📦 Found stored session:", storedSession);
                setSessionId(storedSession);
            } else {
                // Create new session
                try {
                    console.log("🆕 Creating new session...");
                    const newSessionId = await createSession().then(res => res.session_id);
                    setSessionId(newSessionId);
                    storeSessionId(newSessionId);
                    console.log("✅ New session stored:", newSessionId);
                } catch (error) {
                    console.error("❌ Failed to create session:", error);
                }
            }

            setIsInitialized(true);
        };

        initializeSession();
    }, []);

    // Auto-scroll
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
        }
    }, [messages, isThinking]);

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 150) + 'px';
        }
    }, [inputValue]);

    // NEW: Handle starting a new conversation
    const handleNewChat = useCallback(async () => {
        // Clear the old session on the backend if exists
        if (sessionId) {
            try {
                await clearSession(sessionId);
            } catch (error) {
                console.error("Error clearing session:", error);
            }
        }

        // Clear local state
        setMessages([]);
        setSessionId(null);
        clearStoredSessionId();
        setInputValue("");
        setAttachedImage(null);
    }, [sessionId]);

    const handleSend = async () => {
        if (!inputValue.trim() && !attachedImage) return;

        // Wait for session to be initialized
        if (!isInitialized) {
            console.log("⏳ Waiting for session initialization...");
            return;
        }

        const userText = inputValue.trim();
        const userImage = attachedImage;

        // Add user message immediately
        const newUserMsg: Message = {
            id: Date.now().toString(),
            role: "user",
            text: userText,
            images: userImage ? [userImage] : undefined,
            timestamp: new Date(),
        };

        setMessages((prev) => [...prev, newUserMsg]);
        setInputValue("");
        setAttachedImage(null);
        setIsThinking(true);

        // Check for generic query first
        const genericResponse = getGenericResponse(userText);

        if (genericResponse && !userImage) {
            // Handle generic query locally - quick response
            setTimeout(() => {
                setIsThinking(false);
                setMessages((prev) => [...prev, {
                    id: Date.now().toString() + "-ai",
                    role: "ai",
                    text: genericResponse,
                    timestamp: new Date(),
                }]);
            }, 300 + Math.random() * 400);
        } else {
            try {
                let currentSessionId = sessionId;

                if (!currentSessionId) {
                    currentSessionId = await createSession().then(res => res.session_id) as string;
                    setSessionId(currentSessionId);
                    storeSessionId(currentSessionId);
                }

                console.log("📤 Sending with session:", currentSessionId);

                // Make the API call
                const res = await fetchRAGResponse(userText, currentSessionId);
                console.log("📥 RAG Response:", res);

                // Update session if backend returned a different one (shouldn't happen but just in case)
                if (res.session_id && res.session_id !== currentSessionId) {
                    console.log("🔄 Session updated by backend:", res.session_id);
                    setSessionId(res.session_id);
                    storeSessionId(res.session_id);
                }

                setIsThinking(false);
                setMessages((prev) => [...prev, {
                    id: Date.now().toString() + "-ai",
                    role: "ai",
                    text: res.answer,
                    images: res.images,
                    interpretedAs: res.interpreted_as,
                    timestamp: new Date(),
                }]);
            } catch (error) {
                console.error("❌ RAG Error:", error);
                setIsThinking(false);
                setMessages((prev) => [...prev, {
                    id: Date.now().toString() + "-ai",
                    role: "ai",
                    text: "I apologize, but I encountered an issue processing your request. Please try again.",
                    timestamp: new Date(),
                }]);
            }
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleRegenerate = async (messageIndex: number) => {
        // Find the user message before this AI message
        for (let i = messageIndex - 1; i >= 0; i--) {
            if (messages[i].role === "user") {
                const userText = messages[i].text || "";

                // Remove messages from messageIndex onwards
                setMessages(prev => prev.slice(0, messageIndex));
                setIsThinking(true);

                // Call API again with session context
                try {
                    const res = await fetchRAGResponse(userText, sessionId);

                    if (res.session_id) {
                        setSessionId(res.session_id);
                        storeSessionId(res.session_id);
                    }

                    setIsThinking(false);
                    setMessages((prev) => [...prev, {
                        id: Date.now().toString() + "-ai",
                        role: "ai",
                        text: res.answer,
                        images: res.images,
                        interpretedAs: res.interpreted_as,
                        timestamp: new Date(),
                    }]);
                } catch (error) {
                    setIsThinking(false);
                    setMessages((prev) => [...prev, {
                        id: Date.now().toString() + "-ai",
                        role: "ai",
                        text: "I apologize, but I encountered an issue. Please try again.",
                        timestamp: new Date(),
                    }]);
                }
                break;
            }
        }
    };

    const handleSuggestionClick = (text: string) => {
        setInputValue(text);
        textareaRef.current?.focus();
    };

    return (
        <div className="flex flex-col h-dvh bg-stone-50 font-sans text-stone-900 overflow-hidden relative selection:bg-amber-100">

            {/* Background Ambience */}
            <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
                <div className="absolute -top-[20%] -right-[10%] w-[600px] h-[600px] rounded-full bg-linear-to-b from-amber-100/40 to-transparent blur-[100px]" />
                <div className="absolute top-[40%] -left-[10%] w-[400px] h-[400px] rounded-full bg-linear-to-b from-stone-200/40 to-transparent blur-[80px]" />
            </div>

            {/* Session Indicator - Optional, can be removed */}
            {/* <SessionIndicator isActive={!!sessionId} /> */}

            {/* Navigation - Updated with new chat button */}
            <NavigationPill
                activeTab={activeTab}
                onTabChange={setActiveTab}
                onNewChat={handleNewChat}
                hasMessages={messages.length > 0}
            />

            {/* Main Content */}
            <main className={`flex-1 relative flex flex-col w-full ${activeTab == "chat" ? 'max-w-4xl' : 'max-w-screen'} mx-auto z-10 h-screen no-scrollbar`}>

                {activeTab === "chat" ? (
                    <>
                        {/* Messages Area */}
                        <div
                            ref={scrollRef}
                            className="flex-1 overflow-y-auto px-4 sm:px-8 pt-20 pb-44 no-scrollbar"
                        >
                            {messages.length === 0 ? (
                                <EmptyState onSuggestionClick={handleSuggestionClick} />
                            ) : (
                                messages.map((msg, idx) => (
                                    <MessageBubble
                                        key={msg.id}
                                        message={msg}
                                        onRegenerate={msg.role === "ai" ? () => handleRegenerate(idx) : undefined}
                                    />
                                ))
                            )}

                            {/* Thinking Indicator */}
                            {isThinking && <ThinkingIndicator />}
                        </div>

                        {/* Input Bar */}
                        <div className="fixed bottom-0 w-full right-0">
                            <div className="absolute bottom-20 sm:bottom-8 left-4 right-4 sm:left-6 sm:right-6 z-50">
                                <div className="max-w-3xl mx-auto">
                                    {/* Attachment Preview */}
                                    {attachedImage && (
                                        <div className="mb-2 bg-white border border-stone-200 rounded-xl p-3 inline-flex items-center gap-3 shadow-lg animate-fade-in-up">
                                            <img src={attachedImage} className="w-12 h-12 rounded-lg object-cover" alt="attachment" />
                                            <div className="flex-1">
                                                <span className="text-sm font-medium text-stone-700">Image attached</span>
                                                <p className="text-xs text-stone-400">Ready to analyze</p>
                                            </div>
                                            <button
                                                onClick={() => setAttachedImage(null)}
                                                className="p-2 text-stone-400 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-colors"
                                            >
                                                <Icons.X />
                                            </button>
                                        </div>
                                    )}

                                    {/* Input Bar */}
                                    <div className="relative group">
                                        <div className="absolute -inset-0.5 bg-linear-to-r from-stone-200 via-amber-200/50 to-stone-200 rounded-2xl opacity-60 blur transition duration-500 group-hover:opacity-100"></div>
                                        <div className="relative flex items-end bg-white rounded-2xl px-3 py-3 shadow-xl shadow-stone-200/50 border border-stone-100">
                                            <textarea
                                                ref={textareaRef}
                                                value={inputValue}
                                                onChange={(e) => setInputValue(e.target.value)}
                                                onKeyDown={handleKeyDown}
                                                placeholder="Ask Linea about your ancestors..."
                                                rows={1}
                                                className="flex-1 bg-transparent border-none outline-none text-stone-800 placeholder:text-stone-400 px-3 py-2 font-medium resize-none leading-6 max-h-10"
                                            />

                                            <button
                                                onClick={handleSend}
                                                disabled={!inputValue.trim() && !attachedImage}
                                                className={`p-2.5 rounded-xl text-white transition-all shadow-md shrink-0 mb-0.5 ${inputValue.trim() || attachedImage
                                                    ? 'bg-stone-900 hover:bg-stone-800 hover:scale-105 active:scale-95'
                                                    : 'bg-stone-300 cursor-not-allowed'
                                                    }`}
                                            >
                                                <Icons.Send />
                                            </button>
                                        </div>
                                    </div>
                                    <p className="text-center text-xs text-stone-400 mt-2">
                                        Press Enter to send, Shift+Enter for new line
                                        {sessionId && <span className="text-amber-600 ml-2">• Conversation active</span>}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-8 animate-fade-in">
                        <PeopleDirectory />
                    </div>
                )}
            </main>
        </div>
    );
}