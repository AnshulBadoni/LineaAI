import { useState } from "react";
import { ProcessedFamily, MarriageConnection } from "../types";
import { Icons } from "../utility";
import { TreeBranch } from "./TreeBranch";

export const CombinedFamilyView = ({
    families,
    marriageConnections
}: {
    families: ProcessedFamily[];
    marriageConnections: MarriageConnection[];
}) => {
    const [scale, setScale] = useState(0.7);
    const [position, setPosition] = useState({ x: 50, y: 30 });
    const [isDragging, setIsDragging] = useState(false);
    const [startPos, setStartPos] = useState({ x: 0, y: 0 });
    const [showGeneration, setShowGeneration] = useState(true);

    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true);
        setStartPos({ x: e.clientX - position.x, y: e.clientY - position.y });
    };
    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging) return;
        setPosition({ x: e.clientX - startPos.x, y: e.clientY - startPos.y });
    };
    const handleMouseUp = () => setIsDragging(false);

    const handleTouchStart = (e: React.TouchEvent) => {
        const touch = e.touches[0];
        setIsDragging(true);
        setStartPos({ x: touch.clientX - position.x, y: touch.clientY - position.y });
    };
    const handleTouchMove = (e: React.TouchEvent) => {
        if (!isDragging) return;
        const touch = e.touches[0];
        setPosition({ x: touch.clientX - startPos.x, y: touch.clientY - startPos.y });
    };

    const totalMembers = families.reduce((sum, f) => sum + f.memberCount, 0);
    const maxGenerations = Math.max(...families.map(f => f.generations));

    // Split families for left-right layout
    const leftFamilies = families.filter((_, i) => i % 2 === 0);
    const rightFamilies = families.filter((_, i) => i % 2 === 1);

    return (
        <div className="relative group animate-fade-in">
            <div className="absolute -inset-0.5 bg-linear-to-r from-amber-200 via-pink-200 to-blue-200 rounded-2xl opacity-40 blur transition duration-500 group-hover:opacity-60" />

            <div className="relative bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xl">
                {/* Header */}
                {/* <div className="bg-linear-to-r from-amber-50 via-pink-50/50 to-blue-50 px-5 py-4 border-b border-stone-100">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-200 to-pink-200 flex items-center justify-center shadow-inner border border-white">
                                <span className="text-2xl">🌳</span>
                            </div>
                            <div>

                                <div className="flex items-center gap-3 text-sm text-stone-500">
                                    <span className="flex items-center gap-1">
                                        <Icons.Users />
                                        {totalMembers} members
                                    </span>
                                    <span className="text-stone-300">•</span>
                                    <span>{families.length} family lines</span>
                                    <span className="text-stone-300">•</span>
                                    <span>{maxGenerations} generations</span>
                                    {marriageConnections.length > 0 && (
                                        <>
                                            <span className="text-stone-300">•</span>
                                            <span className="text-pink-500 flex items-center gap-1">
                                                <Icons.Heart />
                                                {marriageConnections.length} marriage links
                                            </span>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setShowGeneration(!showGeneration)}
                                className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${showGeneration
                                    ? "bg-stone-800 text-white"
                                    : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                                    }`}
                            >
                                Gen #
                            </button>
                        </div>
                    </div>
                </div> */}

                {/* Legend */}
                <div className="px-5 py-3 bg-stone-50/50 border-b border-stone-100 flex flex-wrap items-center gap-4 text-xs">
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-linear-to-br from-blue-200 to-blue-100 border border-blue-300" />
                        <span className="text-stone-600">Male</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-linear-to-br from-pink-200 to-pink-100 border border-pink-300" />
                        <span className="text-stone-600">Female</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-0.5 bg-stone-300" />
                        <span className="text-stone-600">Parent-Child</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="flex items-center">
                            <div className="w-2 h-0.5 bg-pink-400" />
                            <span className="text-pink-500 text-[10px]">♥</span>
                            <div className="w-2 h-0.5 bg-pink-400" />
                        </div>
                        <span className="text-stone-600">Marriage</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full bg-amber-100 border-2 border-amber-300 flex items-center justify-center">
                            <span className="text-[6px] font-bold text-amber-700">A</span>
                        </div>
                        <span className="text-stone-600">Ancestor</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-0.5">
                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                        </div>
                        <span className="text-stone-600">Living</span>
                    </div>
                </div>

                {/* Tree Canvas */}
                <div
                    className="relative h-[70vh] bg-linear-to-b from-stone-50/30 to-stone-100/50 cursor-grab active:cursor-grabbing select-none overflow-hidden"
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleMouseUp}
                >
                    {/* Grid background */}
                    <div
                        className="absolute inset-0 opacity-[0.02]"
                        style={{
                            backgroundImage: `
                                linear-gradient(to right, #000 1px, transparent 1px),
                                linear-gradient(to bottom, #000 1px, transparent 1px)
                            `,
                            backgroundSize: '40px 40px'
                        }}
                    />

                    {/* Tree content - Left and Right layout */}
                    <div
                        className="absolute min-w-max p-12 transition-transform duration-75 ease-out"
                        style={{
                            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                            transformOrigin: 'top left'
                        }}
                    >
                        <div className="flex gap-20 items-start">
                            {/* Left side families */}
                            <div className="flex flex-col gap-16">
                                {leftFamilies.map((family) => (
                                    <div key={family.id} className="relative">
                                        {/* Family name label */}
                                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-linear-to-r from-amber-100 to-orange-100 text-amber-800 text-xs px-3 py-1 rounded-full font-bold border border-amber-200 shadow whitespace-nowrap">
                                            {family.name}
                                        </div>
                                        <TreeBranch
                                            node={family.root}
                                            isRoot
                                            showGeneration={showGeneration}
                                        />
                                    </div>
                                ))}
                            </div>

                            {/* Center divider with marriage connections info */}
                            {rightFamilies.length > 0 && marriageConnections.length > 0 && (
                                <div className="flex flex-col items-center justify-center min-h-[300px] px-8">
                                    <div className="w-px h-full bg-linear-to-b from-transparent via-pink-300 to-transparent relative">
                                        {marriageConnections.map((conn, i) => (
                                            <div
                                                key={i}
                                                className="absolute left-1/2 -translate-x-1/2 bg-white border-2 border-pink-200 rounded-xl p-3 shadow-lg whitespace-nowrap"
                                                style={{ top: `${20 + i * 80}px` }}
                                            >
                                                <div className="text-center">
                                                    <div className="flex items-center gap-2 text-xs">
                                                        <span className="font-semibold text-stone-700">{conn.person1.firstName}</span>
                                                        <span className="text-pink-500">♥</span>
                                                        <span className="font-semibold text-stone-700">{conn.person2.firstName}</span>
                                                    </div>
                                                    <div className="text-[9px] text-stone-400 mt-1">
                                                        {conn.family1} ↔ {conn.family2}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Right side families */}
                            <div className="flex flex-col gap-16">
                                {rightFamilies.map((family) => (
                                    <div key={family.id} className="relative">
                                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-linear-to-r from-blue-100 to-purple-100 text-blue-800 text-xs px-3 py-1 rounded-full font-bold border border-blue-200 shadow whitespace-nowrap">
                                            {family.name}
                                        </div>
                                        <TreeBranch
                                            node={family.root}
                                            isRoot
                                            showGeneration={showGeneration}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Zoom controls */}
                    <div className="absolute bottom-4 right-4 flex bg-white rounded-xl shadow-lg border border-stone-200 p-1 gap-0.5">
                        <button
                            onClick={() => setScale(s => Math.max(0.3, s - 0.1))}
                            className="p-2 hover:bg-stone-50 rounded-lg text-stone-500 transition-colors"
                        >
                            <Icons.Minus />
                        </button>
                        <div className="flex items-center px-2 text-xs font-mono text-stone-400 border-x border-stone-100">
                            {Math.round(scale * 100)}%
                        </div>
                        <button
                            onClick={() => setScale(s => Math.min(2, s + 0.1))}
                            className="p-2 hover:bg-stone-50 rounded-lg text-stone-500 transition-colors"
                        >
                            <Icons.Plus />
                        </button>
                    </div>

                    {/* Reset button */}
                    <button
                        onClick={() => { setPosition({ x: 50, y: 30 }); setScale(0.7); }}
                        className="absolute bottom-4 left-4 bg-white/90 backdrop-blur rounded-lg px-3 py-2 text-xs text-stone-500 border border-stone-200 shadow-sm hover:bg-white hover:shadow-md transition-all font-medium"
                    >
                        Reset View
                    </button>

                    {/* Navigation hint */}
                    <div className="absolute top-4 right-4 hidden sm:flex items-center gap-2 text-xs text-stone-400 bg-white/80 backdrop-blur px-3 py-2 rounded-lg border border-stone-200">
                        <Icons.Sparkles />
                        <span>Drag to pan • Scroll to explore</span>
                    </div>
                </div>
            </div>
        </div>
    );
};