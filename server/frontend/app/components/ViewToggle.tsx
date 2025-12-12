import { Icons } from "../utility";

export const ViewToggle = ({ viewMode, onViewChange }: { viewMode: string; onViewChange: (v: string) => void }) => (
    <div className="flex bg-white rounded-xl p-1 border border-stone-200 shadow-sm">
        {[
            { id: 'combined', icon: Icons.Combined, label: 'Combined' },
            { id: 'tree', icon: Icons.Tree, label: 'Separate' },
            { id: 'grid', icon: Icons.Grid, label: 'Grid' },
            { id: 'list', icon: Icons.List, label: 'List' },
        ].map(item => (
            <button
                key={item.id}
                onClick={() => onViewChange(item.id)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${viewMode === item.id
                    ? "bg-stone-900 text-white shadow-sm"
                    : "text-stone-500 hover:text-stone-800 hover:bg-stone-50"
                    }`}
            >
                <item.icon />
                <span className="hidden sm:inline">{item.label}</span>
            </button>
        ))}
    </div>
);