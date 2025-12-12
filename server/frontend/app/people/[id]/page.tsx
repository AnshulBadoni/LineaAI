"use client";

import React, { useState } from "react";

// --- Mock Data ---
const PERSON = {
    id: "1",
    name: "Eleanor Vance",
    relation: "Great Grandmother",
    dates: "1892 — 1968",
    age: "76",
    location: "Suffolk, UK → Chicago, US",
    bio: "Eleanor was a woman of remarkable resilience. Born in the rolling hills of Suffolk, she served as a VAD nurse during the Great War. In 1920, seeking new horizons, she boarded the RMS Mauretania bound for New York. She was known for her prize-winning rose garden and the 12 journals she left behind detailing daily life in the mid-20th century.",
    photoUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=800&h=800",
    tags: ["Direct Ancestor", "Paternal Side", "Immigrant"],

    // Vitals
    vitals: [
        { label: "Born", value: "Jan 12, 1892", icon: "🎂" },
        { label: "Died", value: "Mar 04, 1968", icon: "🕊️" },
        { label: "Burial", value: "Oak Ridge Cem.", icon: "⚰️" },
        { label: "Marriage", value: "June 1921", icon: "💍" },
    ],

    // Timeline
    timeline: [
        { year: "1892", title: "Born in Suffolk", type: "birth" },
        { year: "1911", title: "Census: Student", type: "doc" },
        { year: "1914", title: "Joined Red Cross", type: "work" },
        { year: "1920", title: "Emigrated to US", type: "travel" },
        { year: "1921", title: "Married Arthur", type: "family" },
        { year: "1968", title: "Died in Chicago", type: "death" },
    ],

    // Family
    family: [
        { name: "Arthur Pendelton", rel: "Husband", dates: "1890-1955", img: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200" },
        { name: "Margaret Pendelton", rel: "Daughter", dates: "1924-2005", img: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200" },
        { name: "Silas Pendelton", rel: "Son", dates: "1928-1945", img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200" },
        { name: "Edward Pendelton", rel: "Son", dates: "1930-Living", img: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200" },
    ]
};

// --- Icons (Matched to Home) ---
const Icons = {
    Back: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>,
    Edit: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>,
    ChevronRight: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" /></svg>,
    MapPin: () => <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
    Family: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>,
    Timeline: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    Info: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
};

// --- Sub-Components ---

const Header = () => (
    <header className="sticky top-0 z-50 bg-stone-50/80 backdrop-blur-xl border-b border-stone-200/50">
        <div className="w-full px-4 sm:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center gap-4">
                <button onClick={() => window.history.back()} className="w-9 h-9 bg-white rounded-full border border-stone-200 flex items-center justify-center text-stone-500 hover:bg-stone-100 transition-colors shadow-sm">
                    <Icons.Back />
                </button>
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-stone-900 rounded-full flex items-center justify-center text-stone-50 shadow-lg">
                        <span className="font-serif italic text-lg pr-0.5">L</span>
                    </div>
                    <span className="text-xl font-serif text-stone-900 tracking-tight hidden sm:block">Linea<span className="text-stone-400">.ai</span></span>
                </div>
            </div>
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-stone-200 to-stone-100 p-0.5 shadow-inner">
                <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="user" className="w-full h-full rounded-full bg-stone-50 object-cover" />
            </div>
        </div>
    </header>
);

const TimelineItem = ({ year, title, type }: { year: string, title: string, type: string }) => (
    <div className="flex gap-4 relative pl-2 group">
        <div className="absolute left-[19px] top-8 bottom-[-16px] w-px bg-stone-200 border-l border-dashed border-stone-300 group-last:hidden"></div>
        <div className="w-10 h-10 rounded-full bg-stone-100 border border-stone-200 flex items-center justify-center text-xs font-bold text-stone-600 shrink-0 z-10 shadow-sm group-hover:scale-110 transition-transform">
            {year}
        </div>
        <div className="pb-6 pt-2">
            <h4 className="font-serif text-lg font-bold text-stone-900 leading-none group-hover:text-amber-700 transition-colors">{title}</h4>
            <span className="text-[10px] font-bold uppercase text-stone-400">{type}</span>
        </div>
    </div>
);

const RelativeRow = ({ name, rel, dates, img }: { name: string, rel: string, dates: string, img: string }) => (
    <div className="flex items-center gap-3 p-3 bg-stone-50 rounded-[1.5rem] border border-stone-100 hover:bg-white hover:border-amber-200 hover:shadow-md transition-all cursor-pointer group">
        <div className="w-12 h-12 rounded-2xl bg-stone-200 overflow-hidden shrink-0 border border-stone-200">
            <img src={img} className="w-full h-full object-cover sepia-[0.3] group-hover:sepia-0 transition-all" />
        </div>
        <div className="flex-1 min-w-0">
            <h4 className="font-serif text-sm font-bold text-stone-900 truncate group-hover:text-amber-700 transition-colors">{name}</h4>
            <p className="text-[10px] font-bold text-stone-400 uppercase">{rel}</p>
        </div>
        <div className="pr-2 text-stone-300 group-hover:text-amber-500"><Icons.ChevronRight /></div>
    </div>
);

// --- Main Page ---

export default function PersonProfile() {
    const [activeTab, setActiveTab] = useState("overview");

    return (
        <div className="min-h-screen bg-stone-50 font-sans text-stone-900 pb-24">

            {/* Background Ambience (Matches Home) */}
            <div className="fixed inset-0 pointer-events-none z-0"><div className="absolute top-0 right-0 w-[800px] h-[800px] rounded-full bg-gradient-to-b from-stone-200/20 to-transparent blur-[120px]" /></div>

            <Header />

            {/* --- Full Width Layout with Max Constraints for Large Screens --- */}
            <main className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 pt-6 relative z-10">

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

                    {/* === LEFT COLUMN: IDENTITY CARD (Sticky) === */}
                    <div className="lg:col-span-4 xl:col-span-3 lg:sticky lg:top-24">
                        <div className="bg-white rounded-[2.5rem] p-6 border border-stone-200 shadow-sm flex flex-col items-center text-center">

                            {/* Photo */}
                            <div className="relative w-48 h-48 rounded-[2rem] overflow-hidden shadow-2xl shadow-stone-900/10 border-[6px] border-stone-50 rotate-2 mb-6 group">
                                <img src={PERSON.photoUrl} alt={PERSON.name} className="w-full h-full object-cover sepia-[0.15] group-hover:sepia-0 transition-all duration-700" />
                            </div>

                            {/* Identity */}
                            <span className="px-3 py-1 rounded-full bg-amber-50 border border-amber-100 text-[10px] font-bold uppercase tracking-widest text-amber-700 mb-3">
                                {PERSON.relation}
                            </span>
                            <h1 className="text-3xl font-serif text-stone-900 tracking-tight leading-none mb-2">
                                {PERSON.name}
                            </h1>

                            {/* Tags */}
                            <div className="flex flex-wrap justify-center gap-2 mb-6">
                                {PERSON.tags.map(tag => (
                                    <span key={tag} className="text-[10px] font-bold text-stone-400 border border-stone-200 px-2 py-0.5 rounded-full bg-white">{tag}</span>
                                ))}
                            </div>

                            {/* Quick Stats */}
                            <div className="w-full grid grid-cols-2 gap-2 mb-6">
                                {PERSON.vitals.map((stat, i) => (
                                    <div key={i} className="bg-stone-50 p-2 rounded-xl border border-stone-100 text-left">
                                        <p className="text-[9px] font-bold text-stone-400 uppercase mb-0.5">{stat.label}</p>
                                        <p className="text-xs font-serif font-bold text-stone-800 truncate flex items-center gap-1">
                                            <span>{stat.icon}</span> {stat.value}
                                        </p>
                                    </div>
                                ))}
                            </div>

                            <button className="w-full py-3 bg-stone-900 text-white rounded-2xl font-bold text-sm shadow-lg hover:scale-[1.02] transition-transform flex items-center justify-center gap-2">
                                <Icons.Edit /> Edit Profile
                            </button>
                        </div>
                    </div>

                    {/* === RIGHT COLUMN: CONTENT (Tabs on Mobile, Grid on Desktop) === */}
                    <div className="lg:col-span-8 xl:col-span-9">

                        {/* MOBILE TABS (Hidden on Large Screens) */}
                        <div className="lg:hidden sticky top-20 z-40 bg-stone-50/95 backdrop-blur py-2 mb-4 -mx-4 px-4">
                            <div className="flex bg-white p-1 rounded-full border border-stone-200 shadow-sm">
                                {["Overview", "Family", "Timeline"].map(tab => (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveTab(tab.toLowerCase())}
                                        className={`flex-1 py-2.5 rounded-full text-xs font-bold transition-all ${activeTab === tab.toLowerCase() ? "bg-stone-900 text-white shadow" : "text-stone-500"}`}
                                    >
                                        {tab}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* DESKTOP GRID / MOBILE TAB CONTENT */}
                        <div className="flex flex-col gap-6">

                            {/* 1. BIOGRAPHY (Always visible on Desktop, Tab on Mobile) */}
                            <div className={`${(activeTab === 'overview' || 'lg:block') ? 'block' : 'hidden lg:block'}`}>
                                <div className="bg-white rounded-[2.5rem] p-8 border border-stone-200 shadow-sm h-full">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="font-serif text-xl font-bold text-stone-900 flex items-center gap-2"><Icons.Info /> Biography</h3>
                                        <span className="text-xs font-bold text-stone-400 bg-stone-50 px-2 py-1 rounded-lg border border-stone-100">{PERSON.location}</span>
                                    </div>
                                    <p className="text-stone-600 text-lg leading-relaxed font-serif">{PERSON.bio}</p>
                                </div>
                            </div>

                            {/* 2. SPLIT SECTION (Family + Timeline) */}
                            <div className={`grid grid-cols-1 xl:grid-cols-2 gap-6 ${(activeTab !== 'overview' ? 'block' : 'hidden lg:grid')}`}>

                                {/* FAMILY */}
                                <div className={`${(activeTab === 'family' || 'lg:block') ? 'block' : 'hidden lg:block'}`}>
                                    <div className="bg-white rounded-[2.5rem] p-6 border border-stone-200 shadow-sm h-full">
                                        <div className="flex justify-between items-center mb-6">
                                            <h3 className="font-serif text-xl font-bold flex items-center gap-2"><Icons.Family /> Family</h3>
                                            <button className="text-xs font-bold text-stone-400 hover:text-stone-900 bg-stone-50 px-2 py-1 rounded-lg border border-stone-100">+ Add</button>
                                        </div>
                                        <div className="space-y-2">
                                            {PERSON.family.map((m, i) => <RelativeRow key={i} {...m} />)}
                                        </div>
                                    </div>
                                </div>

                                {/* TIMELINE */}
                                <div className={`${(activeTab === 'timeline' || 'lg:block') ? 'block' : 'hidden lg:block'}`}>
                                    <div className="bg-white rounded-[2.5rem] p-6 border border-stone-200 shadow-sm h-full">
                                        <div className="flex justify-between items-center mb-6">
                                            <h3 className="font-serif text-xl font-bold flex items-center gap-2"><Icons.Timeline /> Timeline</h3>
                                            <button className="text-xs font-bold text-stone-400 hover:text-stone-900 bg-stone-50 px-2 py-1 rounded-lg border border-stone-100">+ Add</button>
                                        </div>
                                        <div className="pl-1">
                                            {PERSON.timeline.map((e, i) => <TimelineItem key={i} {...e} />)}
                                        </div>
                                    </div>
                                </div>

                            </div>
                        </div>

                    </div>
                </div>
            </main>
        </div>
    );
}