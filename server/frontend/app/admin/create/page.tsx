"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Person, RelationshipItem } from "@/app/types";

const REL_TYPES = [
    { label: "Parent of", value: "PARENT_OF" },
    { label: "Child of", value: "CHILD_OF" },
    { label: "Married to", value: "MARRIED_TO" },
    { label: "Divorced from", value: "DIVORCED_FROM" },
    { label: "Adoptive Parent of", value: "ADOPTED_PARENT_OF" },
    { label: "Step-Parent of", value: "STEP_PARENT_OF" },
];

// --- ICONS ---
const Icons = {
    Back: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>,
    Upload: () => <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
    Check: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>,
    Search: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>,
    Link: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>,
    X: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" /></svg>,
    Loading: () => <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>,
    User: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>,
    Calendar: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
};

// --- NAV PILL ---
const NavigationPill = ({ onBack, onSave, saving, canSave }: {
    onBack: () => void;
    onSave: () => void;
    saving: boolean;
    canSave: boolean;
}) => (
    <div className="fixed sm:sticky top-6 sm:top-8 z-40 left-0 right-0 flex justify-center pointer-events-none">
        <div className="pointer-events-auto bg-stone-900/90 backdrop-blur-md text-stone-400 p-1.5 rounded-full shadow-2xl shadow-stone-900/20 flex items-center gap-1 border border-stone-700/50 transform transition-all hover:scale-[1.02]">
            <button
                onClick={onBack}
                className="px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 flex items-center gap-2 hover:text-stone-200"
            >
                <Icons.Back />
                <span>Cancel</span>
            </button>
            <button
                onClick={onSave}
                disabled={saving || !canSave}
                className="px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 flex items-center gap-2 bg-stone-100 text-stone-900 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {saving ? <Icons.Loading /> : <Icons.Check />}
                <span>{saving ? "Saving..." : "Save Record"}</span>
            </button>
        </div>
    </div>
);

export default function CreatePersonPage() {
    const router = useRouter();
    const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL + '/api/persons' || "http://localhost:8000/api/persons";

    // --- STATE ---
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLiving, setIsLiving] = useState(true);
    const [formData, setFormData] = useState({
        firstName: "", lastName: "", gender: "Male", birthDate: "", deathDate: "", birthPlace: "", occupation: "", bio: "", photoUrl: ""
    });

    const [relationType, setRelationType] = useState("PARENT_OF");
    const [marriageDate, setMarriageDate] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<Person[]>([]);
    const [relationships, setRelationships] = useState<RelationshipItem[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    const canSave = formData.firstName.trim() && formData.lastName.trim();

    // --- SEARCH ---
    useEffect(() => {
        handleSearch();
    }, [searchQuery]);


    const handleSearch = async () => {
        try {
            if (searchQuery.length > 1) {
                const res = await fetch(`${API_BASE}/search?q=${searchQuery}`);
                if (res.ok) setSearchResults(await res.json());
            }
        } catch (err) {
            console.error(err);
        }
    }

    // --- HANDLERS ---
    const addRelationship = (person: Person) => {
        if (relationships.some(r => r.person.id === person.id)) return;
        const relLabel = REL_TYPES.find(t => t.value === relationType)?.label || relationType;
        setRelationships(prev => [...prev, {
            person, type: relationType, label: relLabel,
            marriageDate: relationType === "MARRIED_TO" ? marriageDate : undefined
        }]);
        setSearchQuery("");
        setIsSearching(false);
        setMarriageDate("");
    };

    const removeRelationship = (id: string) => {
        setRelationships(prev => prev.filter(r => r.person.id !== id));
    };

    const handleSubmit = async () => {
        if (!canSave) return;
        setIsSubmitting(true);

        try {
            const personRes = await fetch(`${API_BASE}/`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...formData,
                    deathDate: isLiving ? null : formData.deathDate,
                })
            });

            if (!personRes.ok) throw new Error("Failed to create person");
            const newPerson = await personRes.json();

            for (const rel of relationships) {
                let fromId = newPerson.id, toId = rel.person.id, type = rel.type;
                if (rel.type === "CHILD_OF") { fromId = rel.person.id; toId = newPerson.id; type = "PARENT_OF"; }

                await fetch(`${API_BASE}/relationships`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ fromPersonId: fromId, toPersonId: toId, relationshipType: type, marriageDate: rel.marriageDate || null })
                });
            }

            router.push("/home");
        } catch (err) {
            console.error(err);
            alert("Error creating record.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    return (
        // CHANGED: Removed h-dvh and overflow-hidden on mobile. Added lg:h-dvh lg:overflow-hidden to restore desktop app feel.
        <div className="min-h-dvh lg:h-dvh bg-stone-50 font-sans text-stone-900 lg:overflow-hidden relative flex flex-col selection:bg-amber-100">

            {/* Background Ambience - CHANGED: absolute -> fixed so it covers scrollable mobile area */}
            <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
                <div className="absolute -top-[20%] -right-[10%] w-[600px] h-[600px] rounded-full bg-gradient-to-b from-amber-100/40 to-transparent blur-[100px]" />
                <div className="absolute top-[40%] -left-[10%] w-[400px] h-[400px] rounded-full bg-gradient-to-b from-stone-200/40 to-transparent blur-[80px]" />
            </div>

            {/* Navigation Pill */}
            <NavigationPill
                onBack={() => router.push("/home")}
                onSave={handleSubmit}
                saving={isSubmitting}
                canSave={!!canSave}
            />

            {/* Main Content - CHANGED: Overflow handling is now conditional for desktop */}
            <main className="flex-1 relative z-10 pt-24 pb-6 px-4 sm:px-6 lg:px-8 lg:overflow-hidden">
                <div className="max-w-6xl mx-auto h-auto lg:h-full">

                    {/* Form Layout - CHANGED: h-full is now lg:h-full */}
                    <form className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:h-full">

                        {/* --- LEFT: IDENTITY CARD --- */}
                        <div className="lg:col-span-4 flex flex-col lg:h-full">
                            {/* CHANGED: h-full -> lg:h-full */}
                            <div className="bg-white border border-stone-200 rounded-2xl shadow-sm flex flex-col lg:h-full overflow-hidden">

                                <div className="px-5 py-4 border-b border-stone-100 flex items-center gap-3 shrink-0">
                                    <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center border border-amber-200/50 shadow-sm">
                                        <Icons.User />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-stone-900 text-sm">Identity</h3>
                                        <p className="text-[11px] text-stone-400">Basic information</p>
                                    </div>
                                </div>

                                {/* Card Content - CHANGED: overflow-y-auto is now lg:overflow-y-auto */}
                                <div className="flex-1 p-5 flex flex-col gap-4 lg:overflow-y-auto">

                                    {/* Name Fields */}
                                    <div className="space-y-3">
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="text-[10px] font-semibold text-stone-500 uppercase tracking-wide mb-1.5 block">First Name *</label>
                                                <input
                                                    name="firstName"
                                                    value={formData.firstName}
                                                    onChange={handleChange}
                                                    placeholder="Arthur"
                                                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-2.5 text-sm font-medium placeholder:text-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-200 focus:border-amber-300 transition-all"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-semibold text-stone-500 uppercase tracking-wide mb-1.5 block">Last Name *</label>
                                                <input
                                                    name="lastName"
                                                    value={formData.lastName}
                                                    onChange={handleChange}
                                                    placeholder="Pendleton"
                                                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-2.5 text-sm font-medium placeholder:text-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-200 focus:border-amber-300 transition-all"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Gender & Occupation */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-[10px] font-semibold text-stone-500 uppercase tracking-wide mb-1.5 block">Gender</label>
                                            <select
                                                name="gender"
                                                value={formData.gender}
                                                onChange={handleChange}
                                                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-200 cursor-pointer appearance-none"
                                            >
                                                <option>Male</option>
                                                <option>Female</option>
                                                <option>Other</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-semibold text-stone-500 uppercase tracking-wide mb-1.5 block">Occupation</label>
                                            <input
                                                name="occupation"
                                                value={formData.occupation}
                                                onChange={handleChange}
                                                placeholder="Engineer"
                                                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2.5 text-sm font-medium placeholder:text-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-200 transition-all"
                                            />
                                        </div>
                                    </div>

                                    {/* Dates */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-[10px] font-semibold text-stone-500 uppercase tracking-wide mb-1.5 block">Birth Date</label>
                                            <input
                                                type="date"
                                                name="birthDate"
                                                value={formData.birthDate}
                                                onChange={handleChange}
                                                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-200 transition-all"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-semibold text-stone-500 uppercase tracking-wide mb-1.5 block">Birth Place</label>
                                            <input
                                                name="birthPlace"
                                                value={formData.birthPlace}
                                                onChange={handleChange}
                                                placeholder="City"
                                                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2.5 text-sm font-medium placeholder:text-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-200 transition-all"
                                            />
                                        </div>
                                    </div>

                                    {/* Living Toggle */}
                                    <div className="flex items-center justify-between py-2 px-3 bg-stone-50 rounded-xl">
                                        <span className="text-sm font-medium text-stone-700">Still living</span>
                                        <button
                                            type="button"
                                            onClick={() => setIsLiving(!isLiving)}
                                            className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${isLiving ? 'bg-emerald-500' : 'bg-stone-300'}`}
                                        >
                                            <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${isLiving ? 'translate-x-5' : ''}`} />
                                        </button>
                                    </div>

                                    {!isLiving && (
                                        <div className="animate-fade-in">
                                            <label className="text-[10px] font-semibold text-stone-500 uppercase tracking-wide mb-1.5 block">Death Date</label>
                                            <input
                                                type="date"
                                                name="deathDate"
                                                value={formData.deathDate}
                                                onChange={handleChange}
                                                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-200 transition-all"
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* --- RIGHT: CONNECTIONS & BIO --- */}
                        <div className="lg:col-span-8 flex flex-col gap-5 lg:h-full lg:min-h-0">

                            {/* FAMILY CONNECTIONS - CHANGED: Flex and overflow handling */}
                            <div className="bg-white border border-stone-200 rounded-2xl shadow-sm flex-1 flex flex-col lg:min-h-0 overflow-hidden">

                                <div className="px-5 py-4 border-b border-stone-100 flex items-center justify-between shrink-0">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center border border-amber-200/50 shadow-sm text-amber-600">
                                            <Icons.Link />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-stone-900 text-sm">Family Connections</h3>
                                            <p className="text-[11px] text-stone-400">Link to existing members</p>
                                        </div>
                                    </div>
                                    {relationships.length > 0 && (
                                        <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2.5 py-1 rounded-full">
                                            {relationships.length}
                                        </span>
                                    )}
                                </div>

                                {/* Search Row */}
                                <div className="px-5 py-4 border-b border-stone-50 bg-stone-50/50 shrink-0">
                                    <div className="flex flex-col sm:flex-row gap-3">
                                        {/* Search Input */}
                                        <div className="flex-1 relative">
                                            <div className="relative group">
                                                <div className="absolute -inset-0.5 bg-gradient-to-r from-stone-200 via-amber-200/50 to-stone-200 rounded-xl opacity-0 group-focus-within:opacity-100 blur transition duration-300"></div>
                                                <div className="relative flex items-center bg-white border border-stone-200 rounded-xl">
                                                    <span className="pl-3 text-stone-400"><Icons.Search /></span>
                                                    <input
                                                        type="text"
                                                        placeholder="Search family members..."
                                                        value={searchQuery}
                                                        onChange={(e) => { setSearchQuery(e.target.value); setIsSearching(true); }}
                                                        className="flex-1 bg-transparent px-3 py-2.5 text-sm font-medium placeholder:text-stone-400 focus:outline-none w-full"
                                                    />
                                                </div>
                                            </div>

                                            {/* Search Results */}
                                            {isSearching && searchQuery && (
                                                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-stone-100 z-30 max-h-40 overflow-y-auto">
                                                    {searchResults.length > 0 ? searchResults.map(p => (
                                                        <div
                                                            key={p.id}
                                                            onClick={() => addRelationship(p)}
                                                            className="px-4 py-2.5 hover:bg-amber-50 cursor-pointer flex justify-between items-center transition-colors"
                                                        >
                                                            <span className="font-medium text-stone-800 text-sm">{p.firstName} {p.lastName}</span>
                                                            <span className="text-[10px] text-stone-400 bg-stone-100 px-2 py-0.5 rounded-md font-mono">{p.birthYear || '—'}</span>
                                                        </div>
                                                    )) : (
                                                        <div className="p-4 text-sm text-stone-400 text-center">No results found</div>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex gap-2">
                                            {/* Relationship Type */}
                                            <select
                                                value={relationType}
                                                onChange={(e) => setRelationType(e.target.value)}
                                                className="bg-white border border-stone-200 rounded-xl px-3 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-200 cursor-pointer flex-1 sm:flex-none"
                                            >
                                                {REL_TYPES.map(type => <option key={type.value} value={type.value}>{type.label}</option>)}
                                            </select>

                                            {relationType === "MARRIED_TO" && (
                                                <input
                                                    type="date"
                                                    value={marriageDate}
                                                    onChange={(e) => setMarriageDate(e.target.value)}
                                                    className="bg-white border border-stone-200 rounded-xl px-3 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-200"
                                                />
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Relationships List - CHANGED: lg:overflow-y-auto */}
                                <div className="flex-1 lg:overflow-y-auto p-4 lg:min-h-0">
                                    {relationships.length > 0 ? (
                                        <div className="space-y-2">
                                            {relationships.map((rel, idx) => (
                                                <div
                                                    key={idx}
                                                    className="flex items-center justify-between bg-stone-50 hover:bg-amber-50/50 p-3 rounded-xl transition-colors group"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <span className="px-2 py-1 bg-white border border-stone-200 rounded-lg text-[10px] font-bold uppercase text-stone-500 tracking-wide shadow-sm hidden sm:inline-block">
                                                            {rel.label}
                                                        </span>
                                                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                                                            <span className="sm:hidden text-[10px] font-bold uppercase text-stone-500">{rel.label}</span>
                                                            <span className="font-medium text-stone-900 text-sm">{rel.person.firstName} {rel.person.lastName}</span>
                                                        </div>
                                                        {rel.marriageDate && (
                                                            <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                                                                <Icons.Calendar />
                                                                <span className="hidden sm:inline">{rel.marriageDate}</span>
                                                            </span>
                                                        )}
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeRelationship(rel.person.id)}
                                                        className="p-1.5 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                                    >
                                                        <Icons.X />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="h-40 lg:h-full flex items-center justify-center">
                                            <div className="text-center">
                                                <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center mx-auto mb-3 text-stone-400">
                                                    <Icons.Link />
                                                </div>
                                                <p className="text-sm text-stone-400">No connections yet</p>
                                                <p className="text-xs text-stone-300 mt-1">Search above to add family members</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* BIO - Compact */}
                            <div className="bg-white border border-stone-200 rounded-2xl shadow-sm shrink-0 overflow-hidden">
                                <div className="px-5 py-3 border-b border-stone-100 flex items-center justify-between">
                                    <span className="font-semibold text-stone-900 text-sm">Notes & Biography</span>
                                    <span className="text-[10px] text-stone-400 font-medium bg-stone-100 px-2 py-0.5 rounded-full">Optional</span>
                                </div>
                                <div className="p-4">
                                    <textarea
                                        name="bio"
                                        value={formData.bio}
                                        onChange={handleChange}
                                        placeholder="Write a short story about this person..."
                                        className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-sm font-medium placeholder:text-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-200 focus:border-amber-300 resize-none leading-relaxed h-20 transition-all"
                                    />
                                </div>
                            </div>

                        </div>
                    </form>
                </div>
            </main>

            {/* Animations */}
            <style jsx global>{`
                @keyframes fade-in {
                    from { opacity: 0; transform: translateY(-4px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in { animation: fade-in 0.2s ease-out; }
            `}</style>
        </div>
    );
}