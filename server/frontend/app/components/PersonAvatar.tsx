import { Person } from "../types";

export const PersonAvatar = ({ person, size = 'md' }: { person: Person; size?: 'sm' | 'md' | 'lg' }) => {
    const sizeClasses = {
        sm: 'w-8 h-8 text-xs',
        md: 'w-10 h-10 text-sm',
        lg: 'w-14 h-14 text-lg'
    };

    return (
        <div className={`${sizeClasses[size]} rounded-lg overflow-hidden flex items-center justify-center shrink-0 ${person.gender === 'Female'
            ? 'bg-linear-to-br from-pink-200 to-pink-100 text-pink-700'
            : 'bg-linear-to-br from-blue-200 to-blue-100 text-blue-700'
            } shadow-inner border-2 border-white`}>
            {person.photoUrl ? (
                <img src={person.photoUrl} className="w-full h-full object-cover" alt={person.name} />
            ) : (
                <span className="font-serif font-bold">{person.firstName.charAt(0)}</span>
            )}
        </div>
    );
};