import { Person } from "../types";
import { PersonAvatar } from "./PersonAvatar";

export const TreePersonCard = ({
    person,
    isSpouse,
    isRoot,
    showGeneration
}: {
    person: Person;
    isSpouse?: boolean;
    isRoot?: boolean;
    showGeneration?: boolean;
}) => (
    <div className={`relative flex items-center gap-2.5 bg-white px-3 py-2.5 rounded-xl border-2 transition-all duration-200 hover:shadow-lg ${isSpouse
        ? "border-pink-200 bg-linear-to-r from-pink-50/50 to-white"
        : isRoot
            ? "border-amber-300 bg-linear-to-r from-amber-50 to-white shadow-lg shadow-amber-100"
            : "border-stone-200 shadow-md hover:border-amber-300"
        }`}
        style={{ minWidth: '160px', maxWidth: '180px' }}
    >
        {/* Generation badge */}
        {showGeneration && person.generation !== undefined && (
            <div className="absolute -top-2 -left-2 w-5 h-5 rounded-full bg-stone-700 text-white text-[10px] font-bold flex items-center justify-center shadow">
                G{person.generation + 1}
            </div>
        )}

        {/* Root indicator */}
        {isRoot && (
            <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-amber-500 text-white text-[9px] px-2 py-0.5 rounded-full font-bold shadow">
                ANCESTOR
            </div>
        )}

        <PersonAvatar person={person} size="sm" />
        <div className="min-w-0 flex-1">
            <h4 className="font-serif text-sm font-bold text-stone-900 truncate leading-tight">
                {person.firstName}
            </h4>
            <p className="text-[10px] font-mono text-stone-400 truncate">
                {person.birthYear}
                {person.deathYear !== "Living" && `–${person.deathYear}`}
            </p>
        </div>

        {/* Living indicator */}
        {person.deathYear === "Living" && (
            <div className="absolute -bottom-1.5 right-2 flex items-center gap-1 bg-emerald-100 px-1.5 py-0.5 rounded-full border border-emerald-200">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-[8px] font-bold text-emerald-700">LIVING</span>
            </div>
        )}
    </div>
);
