import { Person } from "../types";

export const PlayfulGridCard = ({ person }: { person: Person }) => (
    <div className="group relative bg-white rounded-2xl p-3 border border-stone-200 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-amber-200 h-full flex flex-col">
        <div className={`relative aspect-square w-full rounded-xl overflow-hidden mb-3 ${person.gender === 'Female' ? 'bg-linear-to-br from-pink-50 to-pink-100' : 'bg-linear-to-br from-blue-50 to-blue-100'
            }`}>
            {person.photoUrl ? (
                <img src={person.photoUrl} alt={person.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            ) : (
                <div className={`w-full h-full flex items-center justify-center font-serif text-4xl font-bold ${person.gender === 'Female' ? 'text-pink-300' : 'text-blue-300'
                    }`}>
                    {person.firstName.charAt(0)}
                </div>
            )}
            {person.deathYear === "Living" && (
                <div className="absolute top-2 right-2 bg-white/95 backdrop-blur px-2.5 py-1 rounded-full text-[10px] font-bold text-emerald-600 shadow-sm border border-emerald-100 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                    LIVING
                </div>
            )}
            {person.generation !== undefined && (
                <div className="absolute top-2 left-2 bg-stone-800/80 backdrop-blur px-2 py-1 rounded-full text-[10px] font-bold text-white shadow">
                    Gen {person.generation + 1}
                </div>
            )}
        </div>
        <div className="px-1 flex flex-col flex-1">
            <h3 className="font-serif text-lg font-bold text-stone-900 leading-tight group-hover:text-amber-700 transition-colors truncate">
                {person.name}
            </h3>
            <p className="text-[11px] font-bold text-stone-400 uppercase tracking-wider mt-1 truncate">{person.relation}</p>
            <div className="mt-auto pt-3 flex items-center justify-between">
                <span className="text-xs font-mono text-stone-500 bg-stone-50 px-2 py-1 rounded-lg">
                    {person.birthYear}–{person.deathYear}
                </span>
                {person.tags[0] && (
                    <span className="px-2.5 py-1 bg-amber-50 rounded-lg text-[10px] font-bold text-amber-700 border border-amber-100">
                        {person.tags[0]}
                    </span>
                )}
            </div>
        </div>
    </div>
);
