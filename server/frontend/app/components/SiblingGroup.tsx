import { FamilyNode } from "../types";
import { TreeBranch } from "./TreeBranch";

export const SiblingGroup = ({
    siblings,
    showGeneration
}: {
    siblings: FamilyNode[];
    showGeneration?: boolean;
}) => {
    if (siblings.length === 0) return null;

    return (
        <div className="relative flex flex-col items-center">
            {/* Vertical line from parent */}
            <div className="w-0.5 h-8 bg-linear-to-b from-stone-400 to-stone-300" />

            {/* Horizontal connector bar for siblings */}
            {siblings.length > 1 && (
                <div className="relative h-0.5 bg-stone-300" style={{
                    width: `calc(${siblings.length - 1} * 220px + 180px)`
                }}>
                    {/* Vertical drops for each sibling */}
                    {siblings.map((_, index) => (
                        <div
                            key={index}
                            className="absolute top-0 w-0.5 h-6 bg-stone-300"
                            style={{
                                left: index === 0 ? '0' :
                                    index === siblings.length - 1 ? '100%' :
                                        `${(index / (siblings.length - 1)) * 100}%`,
                                transform: 'translateX(-50%)'
                            }}
                        />
                    ))}
                </div>
            )}

            {/* Single child vertical drop */}
            {siblings.length === 1 && (
                <div className="w-0.5 h-6 bg-stone-300" />
            )}

            {/* Sibling label */}
            {siblings.length > 1 && (
                <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-stone-100 text-stone-500 text-[9px] px-2 py-0.5 rounded-full font-bold border border-stone-200 shadow-sm">
                    {siblings.length} SIBLINGS
                </div>
            )}

            {/* Siblings row */}
            <div className="flex gap-10 mt-6">
                {siblings.map((sibling) => (
                    <TreeBranch key={sibling.person.id} node={sibling} showGeneration={showGeneration} />
                ))}
            </div>
        </div>
    );
};