"use client";

import React, { useState } from "react";

// --- Types ---
interface Person {
    id: string;
    name: string;
    relation: string;
    birthYear: string;
    deathYear: string | "Living";
    location: string;
    photoUrl: string;
    tags: string[];
}

// --- Mock Data ---
const PEOPLE_DATA: Person[] = [
    {
        id: "1",
        name: "Eleanor Vance",
        relation: "Great Grandmother",
        birthYear: "1892",
        deathYear: "1968",
        location: "Suffolk, UK",
        tags: ["Direct Ancestors", "Paternal Side"],
        photoUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=400&h=400",
    },
    {
        id: "2",
        name: "Arthur Pendelton",
        relation: "Grandfather",
        birthYear: "1921",
        deathYear: "1995",
        location: "Chicago, IL",
        tags: ["Direct Ancestors", "Veteran"],
        photoUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=400&h=400",
    },
    {
        id: "3",
        name: "Margaret Pendelton",
        relation: "Grandmother",
        birthYear: "1924",
        deathYear: "2005",
        location: "Chicago, IL",
        tags: ["Direct Ancestors", "Maternal Side"],
        photoUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400&h=400",
    },
    {
        id: "4",
        name: "Silas Vance",
        relation: "Great Uncle",
        birthYear: "1895",
        deathYear: "1918",
        location: "France (WWI)",
        tags: ["Paternal Side", "No Issue"],
        photoUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400&h=400",
    },
    {
        id: "5",
        name: "Clara Oswald",
        relation: "Cousin (2nd)",
        birthYear: "1988",
        deathYear: "Living",
        location: "London, UK",
        tags: ["Maternal Side", "Living"],
        photoUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=400&h=400",
    },
];

// --- Icons ---
const Icons = {
    Search: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>,
    Filter: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>,
    Plus: () => <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" /></svg>,
    Dots: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" /></svg>,
    Grid: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>,
    List: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" /></svg>,
    ChevronRight: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" /></svg>,
    MapPin: () => <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
};

// --- Components ---

const Header = () => (
    <header className="sticky top-0 z-50 bg-stone-50/80 backdrop-blur-xl border-b border-stone-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3 group cursor-pointer">
                <div className="w-8 h-8 bg-stone-900 rounded-full flex items-center justify-center text-stone-50 shadow-lg transition-transform group-hover:scale-105">
                    <span className="font-serif italic text-lg pr-0.5">L</span>
                </div>
                <span className="text-xl font-serif text-stone-900 tracking-tight">Linea<span className="text-stone-400">.ai</span></span>
            </div>
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-stone-200 to-stone-100 p-0.5 shadow-inner cursor-pointer hover:ring-2 hover:ring-stone-200 transition-all">
                <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="user" className="w-full h-full rounded-full bg-stone-50 object-cover" />
            </div>
        </div>
    </header>
);

const FilterPill = ({ label, active, onClick }: { label: string; active?: boolean; onClick: () => void }) => (
    <button
        onClick={onClick}
        className={`px-4 py-1.5 rounded-full text-xs font-medium border transition-all duration-200 whitespace-nowrap snap-start ${active
                ? "bg-stone-900 text-white border-stone-900 shadow-md transform scale-105"
                : "bg-white text-stone-600 border-stone-200 hover:border-stone-400 hover:bg-stone-100"
            }`}
    >
        {label}
    </button>
);

// --- GRID CARD ---
const PlayfulGridCard = ({ person }: { person: Person }) => (
    <div className="group relative bg-white rounded-[1.5rem] sm:rounded-[2rem] p-2 sm:p-3 border border-stone-200 transition-all duration-300 hover:shadow-[0_12px_30px_-10px_rgba(0,0,0,0.1)] hover:-translate-y-1 hover:border-stone-300">
        <div className="relative aspect-square w-full rounded-[1rem] sm:rounded-[1.5rem] overflow-hidden bg-stone-100 mb-2 sm:mb-3 shadow-inner group-hover:shadow-none transition-shadow">
            <img src={person.photoUrl} alt={person.name} className="w-full h-full object-cover sepia-[0.25] group-hover:sepia-0 group-hover:scale-105 transition-all duration-500" />
            {person.deathYear === "Living" && (
                <div className="absolute top-2 right-2 sm:top-3 sm:right-3 bg-white/90 backdrop-blur px-1.5 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[8px] sm:text-[10px] font-bold text-emerald-600 shadow-sm border border-emerald-100/50">LIVING</div>
            )}
        </div>
        <div className="px-1 sm:px-2 pb-1 sm:pb-2">
            <div className="flex justify-between items-start">
                <div className="min-w-0 flex-1">
                    <h3 className="font-serif text-sm sm:text-lg font-bold text-stone-900 leading-tight group-hover:text-amber-700 transition-colors truncate">{person.name}</h3>
                    <p className="text-[10px] sm:text-xs font-bold text-stone-400 uppercase tracking-wide mt-1 truncate">{person.relation}</p>
                </div>
                <button className="hidden sm:flex w-8 h-8 rounded-full bg-stone-100 text-stone-600 items-center justify-center opacity-0 scale-75 group-hover:opacity-100 group-hover:scale-100 transition-all duration-300 hover:bg-stone-900 hover:text-white shrink-0">
                    <Icons.Dots />
                </button>
            </div>
            <div className="mt-2 sm:mt-3 flex items-center justify-between border-t border-dashed border-stone-100 pt-2 sm:pt-3 text-[10px] sm:text-xs">
                <div className="flex flex-col">
                    <span className="text-stone-400 font-bold uppercase hidden sm:block">Dates</span>
                    <span className="font-mono text-stone-600">{person.birthYear} — {person.deathYear}</span>
                </div>
                <div className="flex flex-col items-end">
                    <span className="text-stone-400 font-bold uppercase hidden sm:block">Loc</span>
                    <span className="font-medium text-stone-600 truncate max-w-[60px] sm:max-w-[80px]">{person.location}</span>
                </div>
            </div>
            <div className="mt-2 sm:mt-3 flex flex-wrap gap-1">
                {person.tags.slice(0, 2).map((tag, i) => (
                    <span key={tag} className={`px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[9px] sm:text-[10px] font-bold ${i === 0 ? "bg-stone-100 text-stone-600" : "bg-amber-50 text-amber-700"}`}>{tag}</span>
                ))}
            </div>
        </div>
    </div>
);

// --- NEW "GOOGLE-STYLE" LIST ROW ---
const CompactListRow = ({ person }: { person: Person }) => (
    <div className="group flex items-center p-2 bg-white rounded-[2.5rem] border border-stone-200 shadow-sm active:shadow-inner active:scale-[0.99] hover:shadow-md hover:border-amber-200 transition-all cursor-pointer">

        {/* 1. Large Split Image (Squircle) */}
        <div className="relative w-20 h-20 sm:w-24 sm:h-24 shrink-0 rounded-[2rem] overflow-hidden bg-stone-100 shadow-inner group-hover:shadow-none transition-shadow">
            <img src={person.photoUrl} alt={person.name} className="w-full h-full object-cover sepia-[0.25] group-hover:sepia-0 group-hover:scale-110 transition-all duration-500" />
            {person.deathYear === "Living" && (
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-emerald-500/90 backdrop-blur px-2 py-0.5 rounded-full text-[8px] font-bold text-white shadow-sm">ALIVE</div>
            )}
        </div>

        {/* 2. Content (Split Layout) */}
        <div className="flex-1 min-w-0 pl-4 py-1 pr-2">
            <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2 mb-1.5">
                <h3 className="font-serif text-lg font-bold text-stone-900 truncate group-hover:text-amber-700 transition-colors">{person.name}</h3>
                {/* Relationship Chip */}
                <span className="text-[10px] font-bold text-stone-500 bg-stone-100 px-2.5 py-1 rounded-full w-fit uppercase tracking-wide border border-stone-200/50">
                    {person.relation}
                </span>
            </div>

            {/* Data Row */}
            <div className="flex items-center gap-3 text-xs text-stone-500">
                <div className="flex items-center gap-1.5 bg-stone-50 px-2.5 py-1 rounded-lg border border-stone-100">
                    <span className="font-mono text-stone-600 font-medium">{person.birthYear}–{person.deathYear}</span>
                </div>
                <div className="flex items-center gap-1 truncate text-stone-400 max-w-[100px] sm:max-w-none">
                    <Icons.MapPin />
                    <span className="truncate">{person.location}</span>
                </div>
            </div>
        </div>

        {/* 3. Action Icon */}
        <div className="pr-5 text-stone-300 group-hover:text-amber-500 group-hover:translate-x-1 transition-all">
            <Icons.ChevronRight />
        </div>
    </div>
);

// --- Main Page Component ---

export default function PeopleDirectory() {
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
    const [search, setSearch] = useState("");
    const [activeTab, setActiveTab] = useState("All");

    const filterTabs = ["All", "Direct Ancestors", "Paternal Side", "Maternal Side", "Living"];

    const filteredPeople = PEOPLE_DATA.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
        const matchesTab = activeTab === "All" || p.tags.includes(activeTab);
        return matchesSearch && matchesTab;
    });

    return (
        <div className="min-h-screen bg-stone-50 font-sans text-stone-900 selection:bg-amber-100">

            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-0 right-0 w-[800px] h-[800px] rounded-full bg-gradient-to-b from-stone-200/20 to-transparent blur-[120px]" />
            </div>

            <Header />

            <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-8">

                {/* Title */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-serif text-stone-900 mb-2">Family Directory</h1>
                        <p className="text-stone-500 font-medium">{filteredPeople.length} relatives found</p>
                    </div>

                    <button className="hidden md:flex items-center gap-2 bg-stone-900 text-white px-6 py-3 rounded-full hover:bg-stone-800 hover:shadow-lg hover:shadow-stone-900/20 transition-all active:scale-95 shadow-md">
                        <Icons.Plus />
                        <span className="text-sm font-bold">Add Person</span>
                    </button>
                </div>

                {/* Sticky Toolbar */}
                <div className="sticky top-20 z-30 mb-8 space-y-4">
                    <div className="flex gap-3">
                        <div className="relative flex-1 group shadow-[0_8px_30px_-6px_rgba(0,0,0,0.08)] rounded-[2rem]">
                            <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-stone-400">
                                <Icons.Search />
                            </div>
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search..."
                                className="w-full bg-white border border-stone-200 pl-12 pr-6 py-4 rounded-[2rem] text-base focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                            />
                        </div>

                        <div className="flex bg-white rounded-[1.5rem] p-1.5 border border-stone-200 shadow-sm items-center">
                            <button
                                onClick={() => setViewMode("grid")}
                                className={`p-3 rounded-2xl transition-all ${viewMode === "grid" ? "bg-stone-100 text-stone-900 shadow-sm" : "text-stone-400 hover:text-stone-600"}`}
                            >
                                <Icons.Grid />
                            </button>
                            <button
                                onClick={() => setViewMode("list")}
                                className={`p-3 rounded-2xl transition-all ${viewMode === "list" ? "bg-stone-100 text-stone-900 shadow-sm" : "text-stone-400 hover:text-stone-600"}`}
                            >
                                <Icons.List />
                            </button>
                        </div>
                    </div>

                    <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar mask-fade-right px-1">
                        {filterTabs.map(tab => (
                            <FilterPill
                                key={tab}
                                label={tab}
                                active={activeTab === tab}
                                onClick={() => setActiveTab(tab)}
                            />
                        ))}
                    </div>
                </div>

                {/* Results */}
                {filteredPeople.length > 0 ? (
                    <>
                        {/* GRID VIEW */}
                        <div className={`${viewMode === "grid" ? "grid" : "hidden"} grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6`}>
                            <button className="group flex flex-col items-center justify-center min-h-[220px] sm:min-h-[350px] rounded-[1.5rem] sm:rounded-[2rem] border-2 border-dashed border-stone-300 hover:border-amber-400 hover:bg-amber-50/20 transition-all duration-300 h-full">
                                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-stone-100 text-stone-400 flex items-center justify-center mb-2 sm:mb-3 group-hover:bg-amber-100 group-hover:text-amber-600 transition-colors shadow-sm">
                                    <Icons.Plus />
                                </div>
                                <span className="text-xs sm:text-sm font-bold text-stone-500 group-hover:text-stone-700">Add Person</span>
                            </button>

                            {filteredPeople.map((person) => (
                                <PlayfulGridCard key={person.id} person={person} />
                            ))}
                        </div>

                        {/* LIST VIEW */}
                        <div className={`${viewMode === "list" ? "flex" : "hidden"} flex-col gap-3 pb-20`}>
                            <button className="flex items-center gap-4 p-4 rounded-[2.5rem] border-2 border-dashed border-stone-300 hover:border-amber-400 hover:bg-amber-50/20 transition-all text-stone-500 justify-center">
                                <Icons.Plus />
                                <span className="text-sm font-bold">Add New Person</span>
                            </button>

                            {filteredPeople.map((person) => (
                                <CompactListRow key={person.id} person={person} />
                            ))}
                        </div>
                    </>
                ) : (
                    <div className="py-20 text-center text-stone-400">
                        <p className="font-serif text-lg">No results found.</p>
                        <button onClick={() => { setSearch(""); setActiveTab("All") }} className="text-xs font-bold text-stone-900 underline mt-2">Clear Filters</button>
                    </div>
                )}

            </main>

            {/* Mobile FAB */}
            <button className="md:hidden fixed bottom-6 right-6 w-14 h-14 bg-stone-900 text-white rounded-[20px] shadow-2xl shadow-stone-900/30 flex items-center justify-center z-50 hover:scale-105 active:scale-95 transition-all">
                <Icons.Plus />
            </button>

        </div>
    );
}