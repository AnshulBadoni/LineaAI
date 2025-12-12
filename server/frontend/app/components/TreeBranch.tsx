import { FamilyNode } from "../types";
import { CoupleNode } from "./CoupleNode";
import { SiblingGroup } from "./SiblingGroup";

export const TreeBranch = ({
    node,
    isRoot,
    showGeneration
}: {
    node: FamilyNode;
    isRoot?: boolean;
    showGeneration?: boolean;
}) => {
    const hasChildren = node.children && node.children.length > 0;

    return (
        <div className="flex flex-col items-center">
            {/* Couple/Person */}
            <CoupleNode node={node} isRoot={isRoot} showGeneration={showGeneration} />

            {/* Children */}
            {hasChildren && (
                <SiblingGroup siblings={node.children} showGeneration={showGeneration} />
            )}
        </div>
    );
};