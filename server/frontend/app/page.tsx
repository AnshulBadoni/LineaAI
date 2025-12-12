"use client";

import React from "react";
import Link from "next/link";

// --- Icons (The "Good" Set) ---
const Icons = {
  Leaf: () => <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.4142L17.4144 16.0001H12C12 16.0001 12 16.0001 12 15.9999V13.9999H17.4144C19.6235 13.9999 21.4144 12.2091 21.4144 9.99994V4.58572L16.0002 9.99994V11.9999H10.586C8.37682 11.9999 6.58596 13.7908 6.58596 15.9999V21.4142H12Z" opacity="0.8" /></svg>,
  Arrow: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>,
  Sparkles: () => <svg className="w-4 h-4 text-amber-500" fill="currentColor" viewBox="0 0 24 24"><path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>,
  Check: () => <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>,
  Scan: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>,
  Play: () => <svg className="w-5 h-5 fill-stone-900 ml-1" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>,
  Magic: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
};

// --- HIGH-FIDELITY MOCKUPS (Restoring the style you liked) ---

const ChatMockup = () => (
  <div className="bg-white w-full max-w-sm rounded-[2rem] shadow-2xl shadow-stone-900/10 border border-stone-200 overflow-hidden relative z-10 transform transition-transform hover:-translate-y-2 duration-500 mx-auto rotate-[-2deg] hover:rotate-0">
    <div className="bg-stone-50/80 backdrop-blur border-b border-stone-100 p-4 flex items-center gap-3">
      <div className="w-8 h-8 rounded-full bg-stone-900 flex items-center justify-center text-white font-serif italic text-xs">L</div>
      <div>
        <div className="text-xs font-bold text-stone-900">Linea Historian</div>
        <div className="text-[10px] text-emerald-600 font-bold flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Active</div>
      </div>
    </div>
    <div className="p-4 space-y-4">
      <div className="flex gap-3">
        <div className="bg-stone-100 text-stone-600 text-xs p-3 rounded-2xl rounded-tl-none leading-relaxed max-w-[85%]">
          I found a 1920 Census record for <strong>Arthur Pendelton</strong>. He was a Carpenter living with his wife Eleanor.
        </div>
      </div>
      <div className="flex gap-3 justify-end">
        <div className="bg-stone-900 text-white text-xs p-3 rounded-2xl rounded-tr-none leading-relaxed max-w-[85%] shadow-md">
          That's him! Who else was listed?
        </div>
      </div>
      <div className="flex gap-3">
        <div className="bg-stone-100 text-stone-600 text-xs p-3 rounded-2xl rounded-tl-none leading-relaxed max-w-[85%]">
          Their daughter <strong>Margaret</strong> (Age 2). I've added them both to your tree.
        </div>
      </div>
    </div>
  </div>
);

const TreeMockup = () => (
  <div className="relative flex flex-col items-center justify-center h-full py-10 scale-90 sm:scale-100">
    {/* Connector Lines (CSS Only) */}
    <div className="absolute top-20 w-px h-16 bg-stone-300"></div>
    <div className="absolute top-[9rem] w-32 h-px bg-stone-300"></div>
    <div className="absolute top-[9rem] left-1/2 -translate-x-[4rem] w-px h-8 bg-stone-300"></div>
    <div className="absolute top-[9rem] right-1/2 translate-x-[4rem] w-px h-8 bg-stone-300"></div>

    {/* Parent Node */}
    <div className="relative z-10 flex items-center gap-2 bg-white p-2 pr-4 rounded-2xl border border-stone-200 shadow-lg mb-12 animate-fade-in-up">
      <div className="w-10 h-10 rounded-xl bg-stone-200 overflow-hidden">
        <img src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=100" className="w-full h-full object-cover sepia-[0.3]" />
      </div>
      <div><div className="text-xs font-bold text-stone-900 font-serif">Eleanor Vance</div><div className="text-[9px] text-stone-500 font-mono">1892—1968</div></div>
    </div>

    {/* Children Nodes */}
    <div className="flex gap-8">
      <div className="flex items-center gap-2 bg-white p-1.5 pr-3 rounded-xl border border-stone-200 shadow-md animate-fade-in-up delay-100">
        <div className="w-8 h-8 rounded-lg bg-stone-200 overflow-hidden"><img src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=100" className="w-full h-full object-cover sepia-[0.3]" /></div>
        <div><div className="text-[10px] font-bold text-stone-900">Margaret</div></div>
      </div>
      <div className="flex items-center gap-2 bg-white p-1.5 pr-3 rounded-xl border border-stone-200 shadow-md animate-fade-in-up delay-200">
        <div className="w-8 h-8 rounded-lg bg-stone-200 overflow-hidden"><img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100" className="w-full h-full object-cover sepia-[0.3]" /></div>
        <div><div className="text-[10px] font-bold text-stone-900">Silas</div></div>
      </div>
    </div>
  </div>
);

// --- Main Page ---

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-stone-50 font-sans text-stone-900 selection:bg-amber-100 overflow-x-hidden">

      {/* Texture Overlay (Crucial for the "Finished" look) */}
      <div className="fixed inset-0 pointer-events-none z-50 opacity-[0.04] mix-blend-multiply" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}></div>

      {/* --- HEADER --- */}
      <header className="fixed top-0 w-full z-40 px-4 py-4 transition-all duration-300">
        <div className="max-w-6xl mx-auto bg-white/80 backdrop-blur-xl border border-white/50 shadow-sm rounded-full px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2 text-stone-900">
            <Icons.Leaf />
            <span className="font-serif font-bold tracking-tight text-lg">Linea</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-xs font-bold uppercase tracking-wider text-stone-500">
            <a href="#features" className="hover:text-stone-900 transition-colors">How it works</a>
            <a href="#pricing" className="hover:text-stone-900 transition-colors">Pricing</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/people" className="hidden sm:block text-xs font-bold text-stone-900 hover:text-amber-700">Sign In</Link>
            <Link href="/people" className="bg-stone-900 text-white text-xs font-bold px-5 py-2.5 rounded-full hover:bg-stone-800 transition-transform hover:scale-105">Get Started</Link>
          </div>
        </div>
      </header>

      {/* --- HERO SECTION --- */}
      <section className="relative pt-44 pb-28 px-4 overflow-hidden">
        {/* Ambient Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-gradient-to-b from-amber-100/40 via-white/0 to-transparent rounded-[100%] blur-3xl -z-10"></div>

        <div className="max-w-4xl mx-auto text-center space-y-8 relative z-10">

          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-white border border-stone-200 px-3 py-1 rounded-full shadow-sm animate-fade-in-up">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wide">AI Historian 2.0 Live</span>
          </div>

          {/* Headline */}
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-serif text-stone-900 leading-[0.95] tracking-tight">
            Your history, <br />
            <span className="italic text-stone-400">uncovered.</span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg md:text-xl text-stone-500 max-w-2xl mx-auto leading-relaxed font-medium">
            Stop wrestling with complex genealogy forms. Just chat with Linea to turn your scattered photos and stories into a living family tree.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link href="/people" className="h-14 px-8 bg-stone-900 text-white rounded-full font-bold text-base flex items-center gap-3 shadow-xl shadow-stone-900/20 hover:shadow-stone-900/30 hover:-translate-y-1 transition-all">
              Start Your Tree Free <Icons.Arrow />
            </Link>
            <div className="flex items-center gap-3 text-sm font-bold text-stone-600 hover:text-stone-900 cursor-pointer group px-6 h-14 rounded-full border border-transparent hover:border-stone-200 hover:bg-white transition-all">
              <div className="w-8 h-8 rounded-full bg-stone-200 flex items-center justify-center group-hover:bg-amber-100 group-hover:text-amber-700 transition-colors"><Icons.Play /></div>
              Watch how it works
            </div>
          </div>
        </div>
      </section>

      {/* --- CLARITY SECTION: What exactly is this? --- */}
      {/* Uses the nice "FeatureSection" layout but explains the core mechanic: Input -> AI -> Output */}
      <section id="features" className="px-4 pb-20">
        <div className="max-w-6xl mx-auto space-y-24">

          {/* Step 1: The Input (Chat) */}
          <div className="flex flex-col md:flex-row items-center gap-12 md:gap-20">
            <div className="flex-1 space-y-6 text-center md:text-left">
              <span className="inline-block px-3 py-1 rounded-full bg-stone-100 border border-stone-200 text-stone-600 text-xs font-bold uppercase tracking-widest">Step 01</span>
              <h2 className="text-4xl font-serif font-bold text-stone-900">It starts with a conversation.</h2>
              <p className="text-lg text-stone-600 leading-relaxed">
                Don't know dates? No problem. Tell Linea stories like "Grandma lived in Ohio during the war," or upload a photo of an old letter. We extract the facts for you.
              </p>
              <ul className="space-y-2 text-stone-500 font-medium text-sm">
                <li className="flex items-center gap-2 justify-center md:justify-start"><Icons.Check /> Natural language understanding</li>
                <li className="flex items-center gap-2 justify-center md:justify-start"><Icons.Check /> Upload handwriting & docs</li>
              </ul>
            </div>
            <div className="flex-1 w-full flex justify-center md:justify-end relative">
              {/* Use the Nice Chat Mockup */}
              <div className="relative z-10">
                <ChatMockup />
                {/* Decorative elements */}
                <div className="absolute -top-6 -right-6 w-20 h-20 bg-amber-100 rounded-full blur-xl -z-10"></div>
              </div>
            </div>
          </div>

          {/* Step 2: The Output (Tree) */}
          <div className="flex flex-col md:flex-row-reverse items-center gap-12 md:gap-20">
            <div className="flex-1 space-y-6 text-center md:text-left">
              <span className="inline-block px-3 py-1 rounded-full bg-stone-100 border border-stone-200 text-stone-600 text-xs font-bold uppercase tracking-widest">Step 02</span>
              <h2 className="text-4xl font-serif font-bold text-stone-900">Your history, visualized.</h2>
              <p className="text-lg text-stone-600 leading-relaxed">
                The AI instantly connects the dots, building an interactive family graph. Zoom out to see centuries, or zoom in to see the smile on your great-grandmother's face.
              </p>
              <ul className="space-y-2 text-stone-500 font-medium text-sm">
                <li className="flex items-center gap-2 justify-center md:justify-start"><Icons.Check /> Automatic relationship mapping</li>
                <li className="flex items-center gap-2 justify-center md:justify-start"><Icons.Check /> Infinite canvas zoom</li>
              </ul>
            </div>
            <div className="flex-1 w-full">
              {/* Use the Nice Tree Mockup inside a container */}
              <div className="bg-stone-900 rounded-[3rem] p-8 md:p-12 relative overflow-hidden shadow-2xl transform rotate-1 hover:rotate-0 transition-all duration-500 min-h-[400px] flex items-center justify-center">
                <div className="absolute inset-0 opacity-20" style={{ backgroundImage: `radial-gradient(#fff 1px, transparent 1px)`, backgroundSize: '20px 20px' }}></div>
                <div className="scale-110"><TreeMockup /></div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* --- FEATURE SHOWCASE: Bento Grid --- */}
      <section className="py-24 px-4">
        <div className="max-w-5xl mx-auto bg-stone-900 rounded-[3rem] p-12 md:p-20 text-center relative overflow-hidden">

          {/* Decorative circles */}
          <div className="absolute top-0 left-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2"></div>

          <div className="relative z-10 space-y-8">
            <h2 className="text-4xl md:text-6xl font-serif text-white leading-tight">
              Your ancestors are waiting.
            </h2>
            <p className="text-stone-400 text-lg max-w-xl mx-auto">
              Join 10,000+ families preserving their legacy with Linea.
              Start building your tree today—free forever for your first 50 relatives.
            </p>
            <button className="px-10 py-5 bg-white text-stone-900 rounded-full font-bold text-xl shadow-2xl hover:bg-amber-50 transition-colors">
              Create Free Account
            </button>
            <p className="text-stone-500 text-xs font-medium">No credit card required.</p>
          </div>
        </div>
      </section>
   
      {/* --- FOOTER --- */}
      <footer className="bg-stone-50 pt-20 pb-10 px-4 border-t border-stone-200">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2 opacity-50 hover:opacity-100 transition-opacity cursor-pointer">
            <Icons.Leaf />
            <span className="font-serif font-bold text-lg">Linea</span>
          </div>
          <div className="flex gap-8 text-sm font-bold text-stone-400">
            <a href="#" className="hover:text-stone-900 transition-colors">Manifesto</a>
            <a href="#" className="hover:text-stone-900 transition-colors">Privacy</a>
            <a href="#" className="hover:text-stone-900 transition-colors">Contact</a>
          </div>
          <p className="text-xs text-stone-300 font-medium">© 2024 Linea Gen.</p>
        </div>
      </footer>

    </div>
  );
}