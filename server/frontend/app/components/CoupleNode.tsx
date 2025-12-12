import { FamilyNode } from "../types";
import { Icons } from "../utility";
import { TreePersonCard } from "./TreePersonCard";

export const CoupleNode = ({
    node,
    isRoot,
    showGeneration
}: {
    node: FamilyNode;
    isRoot?: boolean;
    showGeneration?: boolean;
}) => (
    <div className="flex items-center gap-0">
        <TreePersonCard person={node.person} isRoot={isRoot} showGeneration={showGeneration} />
        {node.spouse && (
            <>
                {/* Marriage connector */}
                <div className="relative flex items-center">
                    <div className="w-6 h-0.5 bg-linear-to-r from-stone-300 via-pink-400 to-stone-300" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-white border-2 border-pink-300 flex items-center justify-center text-pink-500 shadow-sm">
                        <Icons.Heart />
                    </div>
                </div>
                <TreePersonCard person={node.spouse} isSpouse />
            </>
        )}
    </div>
);
