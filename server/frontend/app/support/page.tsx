"use client";

import React, { useState } from "react";
import Link from "next/link";

// --- Icons ---
const Icons = {
    Back: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>,
    Heart: () => <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" /></svg>,
    Card: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>,
    Bolt: () => <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" /></svg>,
    Check: () => <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>,
};

// --- Compact Plan Component ---
const PlanOption = ({ title, price, emoji, selected, onClick }: { title: string, price: string, emoji: string, selected: boolean, onClick: () => void }) => (
    <button
        onClick={onClick}
        className={`flex-1 flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all duration-200 ${selected
                ? "bg-white border-stone-900 shadow-lg scale-105 z-10"
                : "bg-stone-50 border-transparent hover:bg-white hover:border-stone-200"
            }`}
    >
        <span className="text-2xl mb-2">{emoji}</span>
        <span className="text-xs font-bold text-stone-500 uppercase tracking-wide">{title}</span>
        <span className="text-xl font-serif font-bold text-stone-900">${price}</span>
    </button>
);

// --- Main Page ---

export default function SupportPage() {
    const [cycle, setCycle] = useState<"once" | "monthly">("once");
    const [plan, setPlan] = useState("coffee");
    const [method, setMethod] = useState("stripe");

    return (
        <div className="h-screen w-screen bg-stone-50 font-sans text-stone-900 flex flex-col overflow-hidden">

            {/* Background Texture */}
            <div className="fixed inset-0 pointer-events-none z-0 opacity-[0.03]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}></div>

            {/* --- Header --- */}
            <header className="flex-none w-full px-6 py-4 flex justify-between items-center z-20">
                <Link href="/" className="flex items-center gap-2 text-stone-500 hover:text-stone-900 font-bold text-sm transition-colors">
                    <Icons.Back /> <span>Back</span>
                </Link>
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-stone-900 rounded-full flex items-center justify-center text-white font-serif font-bold">L</div>
                    <span className="font-serif font-bold text-lg">Linea</span>
                </div>
            </header>

            {/* --- Split Layout --- */}
            <main className="flex-1 w-full max-w-7xl mx-auto px-6 pb-6 grid grid-cols-1 lg:grid-cols-2 gap-8 h-full items-center z-10">

                {/* LEFT: The Pitch & Social Proof */}
                <div className="flex flex-col justify-center h-full space-y-8 pr-8">
                    <div>
                        <span className="inline-block px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold uppercase tracking-widest mb-4">Support Independent Code</span>
                        <h1 className="text-5xl md:text-6xl font-serif text-stone-900 leading-[0.95] tracking-tight mb-6">
                            Keep history <br /><span className="italic text-stone-400">free</span> & alive.
                        </h1>
                        <p className="text-lg text-stone-500 max-w-md leading-relaxed">
                            Linea is built by a team of two. We don't sell data or run ads. Your support pays for the AI servers and keeps the records accessible to everyone.
                        </p>
                    </div>

                    {/* Recent Supporters (Compact List) */}
                    <div className="bg-white/50 backdrop-blur-sm rounded-[2rem] p-6 border border-stone-200/50 max-w-md">
                        <h3 className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-4">Recent Patrons</h3>
                        <div className="space-y-3">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-stone-200 overflow-hidden">
                                        <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i * 12}`} alt="user" />
                                    </div>
                                    <div className="flex-1 text-sm">
                                        <span className="font-bold text-stone-800">Anonymous</span> bought <span className="font-bold text-amber-600">3 Coffees</span>
                                    </div>
                                    <span className="text-[10px] text-stone-400 font-medium">{i * 5}m ago</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* RIGHT: The Payment Card (Fixed Height Container) */}
                <div className="h-full max-h-[600px] w-full flex items-center justify-center">
                    <div className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl shadow-stone-900/10 border border-stone-200 p-8 flex flex-col h-auto relative overflow-hidden">

                        {/* Decor */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>

                        {/* Toggle */}
                        <div className="flex justify-center mb-8 relative z-10">
                            <div className="bg-stone-100 p-1 rounded-full flex text-xs font-bold relative">
                                <button onClick={() => setCycle("once")} className={`px-6 py-2 rounded-full transition-all ${cycle === "once" ? "bg-white text-stone-900 shadow-sm" : "text-stone-500"}`}>One-time</button>
                                <button onClick={() => setCycle("monthly")} className={`px-6 py-2 rounded-full transition-all ${cycle === "monthly" ? "bg-white text-stone-900 shadow-sm" : "text-stone-500"}`}>Monthly</button>
                            </div>
                        </div>

                        {/* Plan Grid */}
                        <div className="flex gap-3 mb-8 relative z-10">
                            <PlanOption title="Coffee" price="5" emoji="☕️" selected={plan === "coffee"} onClick={() => setPlan("coffee")} />
                            <PlanOption title="Lunch" price="15" emoji="🍔" selected={plan === "lunch"} onClick={() => setPlan("lunch")} />
                            <PlanOption title="Patron" price="50" emoji="🏛️" selected={plan === "patron"} onClick={() => setPlan("patron")} />
                        </div>

                        {/* Payment Method */}
                        <div className="space-y-3 mb-8 relative z-10">
                            <p className="text-xs font-bold text-stone-400 uppercase tracking-widest text-center">Payment Method</p>
                            <div className="grid grid-cols-2 gap-3">
                                <button onClick={() => setMethod("stripe")} className={`flex items-center justify-center gap-2 py-3 rounded-xl border transition-all ${method === 'stripe' ? 'border-stone-900 bg-stone-50' : 'border-stone-200 hover:bg-stone-50'}`}>
                                    <Icons.Card /> <span className="text-sm font-bold">Card</span>
                                </button>
                                <button onClick={() => setMethod("razorpay")} className={`flex items-center justify-center gap-2 py-3 rounded-xl border transition-all ${method === 'razorpay' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-stone-200 hover:bg-stone-50'}`}>
                                    <Icons.Bolt /> <span className="text-sm font-bold">Razorpay</span>
                                </button>
                            </div>
                        </div>

                        {/* Action Button */}
                        <button
                            onClick={() => alert("Integrate Stripe/Razorpay SDK here")}
                            className="w-full py-4 bg-stone-900 text-white rounded-2xl font-bold text-lg shadow-lg hover:scale-[1.02] hover:bg-amber-600 transition-all flex items-center justify-center gap-2 mt-auto relative z-10"
                        >
                            <Icons.Heart /> Support with ${plan === 'coffee' ? '5' : plan === 'lunch' ? '15' : '50'}
                        </button>

                    </div>
                </div>

            </main>
        </div>
    );
}