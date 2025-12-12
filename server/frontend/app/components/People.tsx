"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { ApiNode, Person, ApiEdge, ProcessedFamily, MarriageConnection, FamilyNode } from "../types";
import { PlayfulGridCard } from "./PlayfulGridCard";
import { Icons } from "../utility";
import { CoupleNode } from "./CoupleNode";
import { PersonAvatar } from "./PersonAvatar";
import { ViewToggle } from "./ViewToggle";
import { AddPersonCard } from "./AddPersonCard";
import { CombinedFamilyView } from "./CombinedFamilyView";
import { CompactListRow } from "./CompactListRow";
import { SeparateFamilyView } from "./SeparateFamilyView";


// --- 3. DATA PROCESSING ---

const formatPerson = (node: ApiNode, relation: string = "Family Member", generation?: number): Person => ({
    id: node.id,
    name: `${node.data.firstName} ${node.data.lastName}`.trim(),
    firstName: node.data.firstName,
    lastName: node.data.lastName,
    relation: relation,
    birthYear: node.data.birthDate ? node.data.birthDate.split('-')[0] : "????",
    deathYear: node.data.deathDate && node.data.deathDate !== "0001-01-01"
        ? node.data.deathDate.split('-')[0]
        : "Living",
    location: node.data.birthPlace || "Unknown",
    photoUrl: node.data.photoUrl || "",
    occupation: node.data.occupation || "",
    tags: node.data.occupation ? [node.data.occupation] : [],
    gender: node.data.gender,
    generation
});


function processGraphData(apiData: { nodes: ApiNode[], edges: ApiEdge[] }): {
    families: ProcessedFamily[];
    allNodes: Map<string, Person>;
    parentToChildren: Map<string, Set<string>>;
    childToParents: Map<string, Set<string>>;
    spouseMap: Map<string, string>;
    marriageConnections: MarriageConnection[];
    generations: Map<string, number>;
} {
    if (!apiData?.nodes?.length) {
        return {
            families: [],
            allNodes: new Map(),
            parentToChildren: new Map(),
            childToParents: new Map(),
            spouseMap: new Map(),
            marriageConnections: [],
            generations: new Map()
        };
    }

    const nodeDataMap = new Map<string, ApiNode>();
    apiData.nodes.forEach(n => nodeDataMap.set(n.id, n));

    const parentToChildren = new Map<string, Set<string>>();
    const childToParents = new Map<string, Set<string>>();
    const spouseMap = new Map<string, string>();

    apiData.nodes.forEach(n => {
        parentToChildren.set(n.id, new Set());
        childToParents.set(n.id, new Set());
    });

    apiData.edges.forEach(edge => {
        if (edge.type === "PARENT_OF") {
            parentToChildren.get(edge.source)?.add(edge.target);
            childToParents.get(edge.target)?.add(edge.source);
        } else if (edge.type === "CHILD_OF") {
            parentToChildren.get(edge.target)?.add(edge.source);
            childToParents.get(edge.source)?.add(edge.target);
        } else if (edge.type === "SPOUSE_OF" || edge.type === "MARRIED_TO") {
            if (!spouseMap.has(edge.source)) {
                spouseMap.set(edge.source, edge.target);
            }
            if (!spouseMap.has(edge.target)) {
                spouseMap.set(edge.target, edge.source);
            }
        }
    });

    // Find initial root nodes
    let rootIds = apiData.nodes
        .filter(n => (childToParents.get(n.id)?.size ?? 0) === 0)
        .map(n => n.id);

    // =====================================================
    // NEW: Merge roots that share common children
    // This fixes the issue where parents without SPOUSE_OF 
    // edge create separate families
    // =====================================================
    function mergeRootsWithCommonChildren(initialRootIds: string[]): string[] {
        const rootToRepresentative = new Map<string, string>();

        // Initially each root represents itself
        initialRootIds.forEach(rootId => {
            rootToRepresentative.set(rootId, rootId);
        });

        // Find roots that are both parents of the same child
        apiData.nodes.forEach(node => {
            const parents = childToParents.get(node.id);
            if (parents && parents.size > 1) {
                const parentArray = [...parents];
                const rootParents = parentArray.filter(p => initialRootIds.includes(p));

                if (rootParents.length > 1) {
                    // These roots share a child - they're likely spouses
                    const representative = rootParents[0];

                    rootParents.slice(1).forEach(p => {
                        rootToRepresentative.set(p, representative);

                        // Add them as spouses if not already
                        if (!spouseMap.has(p)) {
                            spouseMap.set(p, representative);
                        }
                        if (!spouseMap.has(representative)) {
                            spouseMap.set(representative, p);
                        }
                    });
                }
            }
        });

        // Return unique representatives only
        return [...new Set(initialRootIds.map(id => rootToRepresentative.get(id)!))];
    }

    // Apply the merge - THIS IS THE KEY LINE!
    rootIds = mergeRootsWithCommonChildren(rootIds);
    // =====================================================

    // Calculate generations
    const generations = new Map<string, number>();

    function assignGeneration(id: string, gen: number, visited = new Set<string>()) {
        if (visited.has(id)) return;
        visited.add(id);

        const currentGen = generations.get(id);
        if (currentGen === undefined || gen < currentGen) {
            generations.set(id, gen);
        }

        // Spouse gets same generation
        const spouseId = spouseMap.get(id);
        if (spouseId && !visited.has(spouseId)) {
            generations.set(spouseId, gen);
            visited.add(spouseId);
        }

        // Children get next generation
        const children = parentToChildren.get(id);
        if (children) {
            children.forEach(childId => assignGeneration(childId, gen + 1, new Set(visited)));
        }
    }

    rootIds.forEach(rootId => assignGeneration(rootId, 0));

    // Create Person objects with generations
    const allNodes = new Map<string, Person>();
    apiData.nodes.forEach(node => {
        const gen = generations.get(node.id) ?? 0;
        allNodes.set(node.id, formatPerson(node, "Family Member", gen));
    });

    // Build family structures
    const personToFamily = new Map<string, string>();

    function getFamilyName(id: string): string {
        const node = nodeDataMap.get(id);
        return node?.data.lastName || "Unknown";
    }

    function getTreeDepth(id: string, visited = new Set<string>()): number {
        if (visited.has(id)) return 0;
        visited.add(id);
        const children = parentToChildren.get(id);
        if (!children || children.size === 0) return 1;
        let maxDepth = 0;
        children.forEach(childId => {
            maxDepth = Math.max(maxDepth, getTreeDepth(childId, new Set(visited)));
        });
        return 1 + maxDepth;
    }

    function countMembers(id: string, visited = new Set<string>()): number {
        if (visited.has(id)) return 0;
        visited.add(id);
        let count = 1;
        const children = parentToChildren.get(id);
        if (children) {
            children.forEach(childId => {
                count += countMembers(childId, new Set(visited));
            });
        }
        return count;
    }

    function buildFamilyNode(id: string, visited = new Set<string>()): FamilyNode | null {
        if (visited.has(id)) return null;
        visited.add(id);

        const person = allNodes.get(id);
        if (!person) return null;

        const node: FamilyNode = {
            person,
            children: [],
            parents: [...(childToParents.get(id) || [])]
        };

        // Add spouse
        const spouseId = spouseMap.get(id);
        if (spouseId && !visited.has(spouseId)) {
            const spouse = allNodes.get(spouseId);
            if (spouse) {
                node.spouse = spouse;
                visited.add(spouseId);
            }
        }

        // Add children sorted by birth year
        const childIds = parentToChildren.get(id) || new Set();
        const sortedChildren = [...childIds].sort((a, b) => {
            const nodeA = nodeDataMap.get(a);
            const nodeB = nodeDataMap.get(b);
            const yearA = nodeA?.data.birthDate ? parseInt(nodeA.data.birthDate.split('-')[0]) : 9999;
            const yearB = nodeB?.data.birthDate ? parseInt(nodeB.data.birthDate.split('-')[0]) : 9999;
            return yearA - yearB;
        });

        sortedChildren.forEach(childId => {
            if (!visited.has(childId)) {
                const childNode = buildFamilyNode(childId, new Set(visited));
                if (childNode) {
                    node.children.push(childNode);
                }
            }
        });

        return node;
    }

    const families: ProcessedFamily[] = [];

    rootIds.forEach(rootId => {
        const familyName = getFamilyName(rootId);
        const root = buildFamilyNode(rootId);

        if (root) {
            families.push({
                id: rootId,
                name: `${familyName} Family`,
                root,
                memberCount: countMembers(rootId),
                generations: getTreeDepth(rootId)
            });
        }
    });

    families.sort((a, b) => b.memberCount - a.memberCount);

    // Find marriage connections between families
    const marriageConnections: MarriageConnection[] = [];

    rootIds.forEach(rootId => {
        const familyName = getFamilyName(rootId);
        function markFamily(id: string, visited = new Set<string>()) {
            if (visited.has(id)) return;
            visited.add(id);
            personToFamily.set(id, familyName);
            const children = parentToChildren.get(id);
            if (children) {
                children.forEach(childId => markFamily(childId, visited));
            }
        }
        markFamily(rootId);
    });

    spouseMap.forEach((spouse2Id, spouse1Id) => {
        const family1 = personToFamily.get(spouse1Id);
        const family2 = personToFamily.get(spouse2Id);

        if (family1 && family2 && family1 !== family2) {
            const person1 = allNodes.get(spouse1Id);
            const person2 = allNodes.get(spouse2Id);

            if (person1 && person2) {
                const exists = marriageConnections.some(
                    c => (c.person1.id === spouse1Id && c.person2.id === spouse2Id) ||
                        (c.person1.id === spouse2Id && c.person2.id === spouse1Id)
                );

                if (!exists) {
                    marriageConnections.push({
                        person1,
                        person2,
                        family1,
                        family2
                    });
                }
            }
        }
    });

    return {
        families,
        allNodes,
        parentToChildren,
        childToParents,
        spouseMap,
        marriageConnections,
        generations
    };
}

export default function PeopleDirectory() {
    const [viewMode, setViewMode] = useState<"combined" | "tree" | "grid" | "list">("combined");
    const [search, setSearch] = useState("");
    const [people, setPeople] = useState<Person[]>([]);
    const [families, setFamilies] = useState<ProcessedFamily[]>([]);
    const [marriageConnections, setMarriageConnections] = useState<MarriageConnection[]>([]);
    const [loading, setLoading] = useState(true);

    const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL + '/api/persons' || "http://localhost:8000/api/persons";

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const [peopleRes, treeRes] = await Promise.all([
                    fetch(`${API_BASE}/`),
                    fetch(`${API_BASE}/tree`)
                ]);

                let processedData: ReturnType<typeof processGraphData> | null = null;

                if (treeRes.ok) {
                    const rawTree = await treeRes.json();
                    processedData = processGraphData(rawTree);
                    setFamilies(processedData.families);
                    setMarriageConnections(processedData.marriageConnections);
                }

                if (peopleRes.ok) {
                    const rawPeople: ApiNode['data'] & { id: string }[] = await peopleRes.json();
                    const formatted: Person[] = rawPeople.map((p: any) => ({
                        id: p.id,
                        name: `${p.firstName} ${p.lastName}`.trim(),
                        firstName: p.firstName,
                        lastName: p.lastName,
                        relation: "Family Member",
                        birthYear: p.birthDate ? p.birthDate.split('-')[0] : "????",
                        deathYear: p.deathDate && p.deathDate !== "0001-01-01" ? p.deathDate.split('-')[0] : "Living",
                        location: p.birthPlace || "Unknown",
                        photoUrl: p.photoUrl || "",
                        occupation: p.occupation || "",
                        tags: p.occupation ? [p.occupation] : ["Family"],
                        gender: p.gender,
                        generation: processedData?.generations.get(p.id)
                    }));
                    setPeople(formatted);
                }
            } catch (err) {
                console.error("Fetch error:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const filteredPeople = people.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase())
    );

    // Sort by generation for list/grid views
    const sortedPeople = [...filteredPeople].sort((a, b) => {
        const genA = a.generation ?? 999;
        const genB = b.generation ?? 999;
        if (genA !== genB) return genA - genB;
        return a.name.localeCompare(b.name);
    });

    return (
        <div className="w-screen min-h-screen pb-24 pt-6 px-2 sm:px-6">
            {/* Controls */}
            <div className="mb-6 space-y-4 mx-auto">
                <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between">
                    {/* Search */}
                    <div className="relative flex-1 max-w-md group">
                        <div className="absolute -inset-0.5 bg-linear-to-r from-stone-200 via-amber-200/50 to-stone-200 rounded-xl opacity-50 blur transition duration-500 group-hover:opacity-75" />
                        <div className="relative flex items-center bg-white border border-stone-200 rounded-xl overflow-hidden shadow-sm">
                            <div className="pl-4 text-stone-400">
                                <Icons.Search />
                            </div>
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search relatives..."
                                className="flex-1 bg-transparent border-none outline-none text-stone-800 placeholder:text-stone-400 px-3 py-3.5 font-medium"
                            />
                        </div>
                    </div>

                    {/* View Toggle */}
                    <ViewToggle viewMode={viewMode} onViewChange={(v) => setViewMode(v as any)} />
                </div>
            </div>

            {/* Content */}
            <div className="mx-auto">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-24 gap-4 animate-fade-in">
                        <Icons.Loading />
                        <p className="text-stone-500 font-medium">Loading your ancestry...</p>
                    </div>
                ) : (
                    <>
                        {/* Combined View - All families in one */}
                        {viewMode === "combined" && (
                            <CombinedFamilyView
                                families={families}
                                marriageConnections={marriageConnections}
                            />
                        )}

                        {/* Separate Tree View - With tabs */}
                        {viewMode === "tree" && (
                            <SeparateFamilyView
                                families={families}
                                marriageConnections={marriageConnections}
                            />
                        )}

                        {/* Grid View */}
                        {viewMode === "grid" && (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 animate-fade-in">
                                <AddPersonCard />
                                {sortedPeople.map((person) => (
                                    <PlayfulGridCard key={person.id} person={person} />
                                ))}
                            </div>
                        )}

                        {/* List View */}
                        {viewMode === "list" && (
                            <div className="flex flex-col gap-3 animate-fade-in">
                                <a href="/admin/create" className="flex items-center gap-4 p-4 rounded-2xl border-2 border-dashed border-stone-300 hover:border-amber-400 hover:bg-amber-50/20 transition-all text-stone-500 justify-center cursor-pointer group">
                                    <div className="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center text-stone-400 group-hover:bg-amber-100 group-hover:text-amber-600 transition-colors">
                                        <Icons.Plus />
                                    </div>
                                    <span className="text-sm font-bold group-hover:text-stone-700">Add New Person</span>
                                </a>
                                {sortedPeople.map((person) => (
                                    <CompactListRow key={person.id} person={person} />
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* CSS */}
            <style jsx global>{`
                @keyframes fade-in {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                
                .animate-fade-in {
                    animation: fade-in 0.3s ease-out;
                }
                
                .no-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                
                .no-scrollbar {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>
        </div>
    );
}