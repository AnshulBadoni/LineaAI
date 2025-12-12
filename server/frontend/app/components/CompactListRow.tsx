import { Person } from "../types";
import { Icons } from "../utility";
import { PersonAvatar } from "./PersonAvatar";

export const CompactListRow = ({ person }: { person: Person }) => (
    <div className="group flex items-center p-3 bg-white rounded-2xl border border-stone-200 shadow-sm hover:shadow-lg hover:border-amber-200 transition-all cursor-pointer">
        <PersonAvatar person={person} size="lg" />
        <div className="flex-1 min-w-0 pl-4 pr-2">
            <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3 mb-1">
                <h3 className="font-serif text-lg font-bold text-stone-900 truncate group-hover:text-amber-700 transition-colors">
                    {person.name}
                </h3>
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full w-fit uppercase tracking-wider border border-amber-100">
                        {person.relation}
                    </span>
                    {person.generation !== undefined && (
                        <span className="text-[10px] font-bold text-stone-500 bg-stone-100 px-2 py-1 rounded-full">
                            Gen {person.generation + 1}
                        </span>
                    )}
                </div>
            </div>
            <div className="flex items-center gap-4 text-sm text-stone-500">
                <span className="font-mono bg-stone-50 px-2.5 py-1 rounded-lg border border-stone-100 text-stone-600 text-xs">
                    {person.birthYear}–{person.deathYear}
                </span>
                <span className="flex items-center gap-1.5 truncate text-stone-400">
                    <Icons.MapPin />
                    <span className="truncate">{person.location}</span>
                </span>
            </div>
        </div>
        <div className="pr-3 text-stone-300 group-hover:text-amber-500 group-hover:translate-x-1 transition-all">
            <Icons.ChevronRight />
        </div>
    </div>
);
