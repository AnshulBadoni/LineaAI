import { useState, useEffect } from "react";
import { ProcessedFamily, MarriageConnection } from "../types";
import { Icons } from "../utility";
import { TreeBranch } from "./TreeBranch";

export const SeparateFamilyView = ({
    families,
    marriageConnections
}: {
    families: ProcessedFamily[];
    marriageConnections: MarriageConnection[];
}) => {
    const [selectedFamilyId, setSelectedFamilyId] = useState<string>(families[0]?.id || '');
    const [scale, setScale] = useState(0.85);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [startPos, setStartPos] = useState({ x: 0, y: 0 });
    const [showConnections, setShowConnections] = useState(false);

    const selectedFamily = families.find(f => f.id === selectedFamilyId);

    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true);
        setStartPos({ x: e.clientX - position.x, y: e.clientY - position.y });
    };
    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging) return;
        setPosition({ x: e.clientX - startPos.x, y: e.clientY - startPos.y });
    };
    const handleMouseUp = () => setIsDragging(false);

    useEffect(() => {
        setPosition({ x: 0, y: 0 });
        setScale(0.85);
    }, [selectedFamilyId]);

    if (families.length === 0) {
        return (
            <div className="py-16 text-center flex flex-col items-center gap-4 animate-fade-in">
                <div className="w-16 h-16 bg-gradient-to-br from-amber-100 to-orange-50 rounded-full flex items-center justify-center shadow-inner border border-white">
                    <span className="font-serif text-3xl text-amber-700">?</span>
                </div>
                <div>
                    <p className="font-serif text-xl text-stone-700 mb-2">No family trees found</p>
                    <p className="text-stone-500 text-sm">Start building your ancestry by adding the first person.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4 animate-fade-in">
            {/* Family Tabs */}
            <div className="flex items-center gap-3">
                <div className="flex-1 overflow-x-auto no-scrollbar">
                    <div className="flex bg-white rounded-xl p-1.5 border border-stone-200 shadow-sm gap-1 w-fit min-w-full sm:min-w-0">
                        {families.map((family) => (
                            <button
                                key={family.id}
                                onClick={() => setSelectedFamilyId(family.id)}
                                className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 whitespace-nowrap ${selectedFamilyId === family.id
                                    ? "bg-amber-500 text-white shadow-md shadow-amber-500/20"
                                    : "text-stone-600 hover:text-stone-900 hover:bg-stone-50"
                                    }`}
                            >
                                <span className="font-semibold">{family.name}</span>
                                <span className={`text-xs px-1.5 py-0.5 rounded-full ${selectedFamilyId === family.id
                                    ? "bg-amber-600/30 text-white"
                                    : "bg-stone-100 text-stone-500"
                                    }`}>
                                    {family.memberCount}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

                {marriageConnections.length > 0 && (
                    <button
                        onClick={() => setShowConnections(true)}
                        className="relative p-3 rounded-xl bg-white border border-stone-200 text-stone-500 hover:text-pink-500 hover:border-pink-200 hover:bg-pink-50 transition-all shadow-sm flex-shrink-0"
                        title="View family connections"
                    >
                        <Icons.Info />
                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-pink-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-sm">
                            {marriageConnections.length}
                        </span>
                    </button>
                )}
            </div>

            {/* Selected Family Tree */}
            {selectedFamily && (
                <div className="relative group">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-stone-200 via-amber-200/50 to-stone-200 rounded-2xl opacity-40 blur" />

                    <div className="relative bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xl">
                        <div className="bg-gradient-to-r from-stone-50 via-amber-50/50 to-stone-50 px-5 py-4 border-b border-stone-100">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-100 to-orange-50 flex items-center justify-center text-amber-700 shadow-inner border border-amber-200/50">
                                        <span className="font-serif text-lg font-bold">{selectedFamily.name.charAt(0)}</span>
                                    </div>
                                    <div>
                                        <h3 className="font-serif text-lg font-bold text-stone-900">{selectedFamily.name}</h3>
                                        <p className="text-xs text-stone-500 flex items-center gap-2">
                                            <span className="flex items-center gap-1">
                                                <Icons.Users />
                                                {selectedFamily.memberCount} members
                                            </span>
                                            <span className="text-stone-300">•</span>
                                            <span>{selectedFamily.generations} generation{selectedFamily.generations > 1 ? 's' : ''}</span>
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div
                            className="relative h-[60vh] bg-gradient-to-b from-stone-50/50 to-stone-100/50 cursor-grab active:cursor-grabbing select-none overflow-hidden"
                            onMouseDown={handleMouseDown}
                            onMouseMove={handleMouseMove}
                            onMouseUp={handleMouseUp}
                            onMouseLeave={handleMouseUp}
                        >
                            <div
                                className="absolute min-w-max p-12 transition-transform duration-75 ease-out"
                                style={{
                                    transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                                    transformOrigin: 'top left'
                                }}
                            >
                                <TreeBranch node={selectedFamily.root} isRoot showGeneration />
                            </div>

                            <div className="absolute bottom-4 right-4 flex bg-white rounded-xl shadow-lg border border-stone-200 p-1 gap-0.5">
                                <button
                                    onClick={() => setScale(s => Math.max(0.4, s - 0.1))}
                                    className="p-2 hover:bg-stone-50 rounded-lg text-stone-500"
                                >
                                    <Icons.Minus />
                                </button>
                                <div className="flex items-center px-2 text-xs font-mono text-stone-400 border-x border-stone-100">
                                    {Math.round(scale * 100)}%
                                </div>
                                <button
                                    onClick={() => setScale(s => Math.min(2, s + 0.1))}
                                    className="p-2 hover:bg-stone-50 rounded-lg text-stone-500"
                                >
                                    <Icons.Plus />
                                </button>
                            </div>

                            <button
                                onClick={() => { setPosition({ x: 0, y: 0 }); setScale(0.85); }}
                                className="absolute bottom-4 left-4 bg-white/90 rounded-lg px-3 py-2 text-xs text-stone-500 border border-stone-200 shadow-sm hover:shadow-md font-medium"
                            >
                                Reset View
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Connections Modal */}
            {showConnections && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm" onClick={() => setShowConnections(false)} />
                    <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[80vh] overflow-hidden">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 bg-gradient-to-r from-pink-50 to-amber-50">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-100 to-amber-100 flex items-center justify-center text-pink-500">
                                    <Icons.Heart />
                                </div>
                                <div>
                                    <h2 className="font-serif text-lg font-bold text-stone-900">Family Connections</h2>
                                    <p className="text-xs text-stone-500">Marriages linking families</p>
                                </div>
                            </div>
                            <button onClick={() => setShowConnections(false)} className="p-2 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-lg">
                                <Icons.X />
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto max-h-[60vh]">
                            <div className="space-y-3">
                                {marriageConnections.map((conn, i) => (
                                    <div key={i} className="flex items-center gap-3 bg-gradient-to-r from-pink-50/50 to-amber-50/50 p-4 rounded-xl border border-pink-100/50">
                                        <div className="flex-1 text-right">
                                            <p className="font-semibold text-stone-800 text-sm">{conn.person1.name}</p>
                                            <p className="text-[10px] text-stone-400 font-medium uppercase">{conn.family1}</p>
                                        </div>
                                        <div className="w-10 h-10 rounded-full bg-white border-2 border-pink-200 flex items-center justify-center text-pink-400 shadow-sm">
                                            <Icons.Heart />
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-semibold text-stone-800 text-sm">{conn.person2.name}</p>
                                            <p className="text-[10px] text-stone-400 font-medium uppercase">{conn.family2}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
