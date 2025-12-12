import { Icons } from "../utility";

export const AddPersonCard = () => (
    <a href="/admin/create" className="group flex flex-col items-center justify-center min-h-[280px] rounded-2xl border-2 border-dashed border-stone-300 hover:border-amber-400 hover:bg-amber-50/30 transition-all duration-300 h-full cursor-pointer">
        <div className="w-14 h-14 rounded-full bg-stone-100 text-stone-400 flex items-center justify-center mb-3 group-hover:bg-amber-100 group-hover:text-amber-600 transition-colors shadow-inner">
            <Icons.Plus />
        </div>
        <span className="text-sm font-bold text-stone-500 group-hover:text-stone-700">Add Person</span>
        <span className="text-xs text-stone-400 mt-1">Expand your tree</span>
    </a>
);