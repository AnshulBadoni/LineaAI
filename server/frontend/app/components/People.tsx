"use client";

import React, { useState, useEffect, useMemo } from "react";
import { ApiNode, Person, ApiEdge, ProcessedFamily, MarriageConnection, FamilyNode } from "../types";
import { PlayfulGridCard } from "./PlayfulGridCard";
import { Icons } from "../utility";
import { ViewToggle } from "./ViewToggle";
import { AddPersonCard } from "./AddPersonCard";
import { CombinedFamilyView } from "./CombinedFamilyView";
import { CompactListRow } from "./CompactListRow";
import { SeparateFamilyView } from "./SeparateFamilyView";


// --- DATA PROCESSING ---

const formatPerson = (node: ApiNode, relation: string = "Family Member", generation?: number): Person => ({
    id: node.id,
    name: `${node.data.firstName} ${node.data.lastName}`.trim(),
    firstName: node.data.firstName,
    lastName: node.data.lastName,
    relation: relation,
    birthYear: node.data.birthDate ? node.data.birthDate.split('-')[0] : "????",
    deathYear: node.data.deathDate
        ? "Passed"
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

    // Initialize maps for all nodes
    apiData.nodes.forEach(n => {
        parentToChildren.set(n.id, new Set());
        childToParents.set(n.id, new Set());
    });

    // Process all edges
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

    // Infer spouse relationships from shared children
    apiData.nodes.forEach(node => {
        const parents = childToParents.get(node.id);
        if (parents && parents.size >= 2) {
            const parentArray = [...parents];
            for (let i = 0; i < parentArray.length; i++) {
                for (let j = i + 1; j < parentArray.length; j++) {
                    const p1 = parentArray[i];
                    const p2 = parentArray[j];
                    if (!spouseMap.has(p1)) {
                        spouseMap.set(p1, p2);
                    }
                    if (!spouseMap.has(p2)) {
                        spouseMap.set(p2, p1);
                    }
                }
            }
        }
    });

    // =====================================================
    // Helper: Get all children for a couple (both spouses)
    // =====================================================
    function getCoupleChildren(personId: string): Set<string> {
        const childIds = new Set<string>(parentToChildren.get(personId) || []);

        const spouseId = spouseMap.get(personId);
        if (spouseId) {
            const spouseChildren = parentToChildren.get(spouseId);
            if (spouseChildren) {
                spouseChildren.forEach(childId => childIds.add(childId));
            }
        }

        return childIds;
    }

    // =====================================================
    // Helper: Collect ALL family members starting from a person
    // (includes descendants AND their spouses)
    // =====================================================
    function collectAllFamilyMembers(startId: string): Set<string> {
        const members = new Set<string>();

        function traverse(personId: string, visited = new Set<string>()) {
            if (visited.has(personId)) return;
            visited.add(personId);
            members.add(personId);

            // Include spouse
            const spouseId = spouseMap.get(personId);
            if (spouseId && !visited.has(spouseId)) {
                members.add(spouseId);
                visited.add(spouseId);
            }

            // Include all children from couple
            const children = getCoupleChildren(personId);
            children.forEach(childId => traverse(childId, visited));
        }

        traverse(startId);
        return members;
    }

    // =====================================================
    // Find and merge roots
    // =====================================================

    // Initial roots: people with no parents
    let initialRootIds = apiData.nodes
        .filter(n => (childToParents.get(n.id)?.size ?? 0) === 0)
        .map(n => n.id);

    console.log("Initial roots (no parents):", initialRootIds.map(id => nodeDataMap.get(id)?.label));

    // Step 1: Merge roots that share common children (spouses at root level)
    const rootToRepresentative = new Map<string, string>();
    initialRootIds.forEach(rootId => {
        rootToRepresentative.set(rootId, rootId);
    });

    apiData.nodes.forEach(node => {
        const parents = childToParents.get(node.id);
        if (parents && parents.size > 1) {
            const parentArray = [...parents];
            const rootParents = parentArray.filter(p => initialRootIds.includes(p));

            if (rootParents.length > 1) {
                // Find best representative (prefer male)
                let representative = rootParents[0];
                const maleParent = rootParents.find(p => {
                    const node = nodeDataMap.get(p);
                    return node?.data.gender === 'Male';
                });
                if (maleParent) {
                    representative = maleParent;
                }

                rootParents.forEach(p => {
                    if (p !== representative) {
                        rootToRepresentative.set(p, representative);
                        if (!spouseMap.has(p)) spouseMap.set(p, representative);
                        if (!spouseMap.has(representative)) spouseMap.set(representative, p);
                    }
                });
            }
        }
    });

    let mergedRoots = [...new Set(initialRootIds.map(id => rootToRepresentative.get(id)!))];
    console.log("After merging spouse-roots:", mergedRoots.map(id => nodeDataMap.get(id)?.label));

    // =====================================================
    // Step 2: Remove roots that are MEMBERS of another root's family
    // (This handles the case where someone married into a family)
    // =====================================================

    // Collect family members for each potential root
    const rootFamilyMembers = new Map<string, Set<string>>();
    mergedRoots.forEach(rootId => {
        rootFamilyMembers.set(rootId, collectAllFamilyMembers(rootId));
    });

    // Debug: Show family members for each root
    rootFamilyMembers.forEach((members, rootId) => {
        console.log(`Family of ${nodeDataMap.get(rootId)?.label}:`,
            [...members].map(id => nodeDataMap.get(id)?.label));
    });

    // Filter: Keep only roots that are NOT members of another root's family
    const finalRoots = mergedRoots.filter(rootId => {
        for (const [otherRootId, members] of rootFamilyMembers) {
            if (otherRootId !== rootId && members.has(rootId)) {
                console.log(`Excluding ${nodeDataMap.get(rootId)?.label} - already in ${nodeDataMap.get(otherRootId)?.label}'s family`);
                return false;
            }
        }
        return true;
    });

    console.log("Final roots:", finalRoots.map(id => nodeDataMap.get(id)?.label));

    // =====================================================
    // Calculate generations
    // =====================================================
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
        const children = getCoupleChildren(id);
        children.forEach(childId => {
            if (!visited.has(childId)) {
                assignGeneration(childId, gen + 1, new Set(visited));
            }
        });
    }

    finalRoots.forEach(rootId => assignGeneration(rootId, 0));

    // Create Person objects with generations
    const allNodes = new Map<string, Person>();
    apiData.nodes.forEach(node => {
        const gen = generations.get(node.id) ?? 0;
        allNodes.set(node.id, formatPerson(node, "Family Member", gen));
    });

    // =====================================================
    // Build family structures
    // =====================================================
    const personToFamily = new Map<string, string>();

    function getFamilyName(id: string): string {
        const node = nodeDataMap.get(id);
        return node?.data.lastName || "Unknown";
    }

    function getTreeDepth(id: string, visited = new Set<string>()): number {
        if (visited.has(id)) return 0;
        visited.add(id);

        const spouseId = spouseMap.get(id);
        if (spouseId) visited.add(spouseId);

        const childIds = getCoupleChildren(id);
        if (childIds.size === 0) return 1;

        let maxDepth = 0;
        childIds.forEach(childId => {
            if (!visited.has(childId)) {
                maxDepth = Math.max(maxDepth, getTreeDepth(childId, new Set(visited)));
            }
        });

        return 1 + maxDepth;
    }

    function countMembers(id: string, visited = new Set<string>()): number {
        if (visited.has(id)) return 0;
        visited.add(id);

        let count = 1;

        const spouseId = spouseMap.get(id);
        if (spouseId && !visited.has(spouseId)) {
            count++;
            visited.add(spouseId);
        }

        const childIds = getCoupleChildren(id);
        childIds.forEach(childId => {
            if (!visited.has(childId)) {
                count += countMembers(childId, new Set(visited));
            }
        });

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

        // Get merged children from both spouses
        const childIds = getCoupleChildren(id);

        // Sort children by birth year
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

    // Build all families
    const families: ProcessedFamily[] = [];

    finalRoots.forEach(rootId => {
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

    // =====================================================
    // Find marriage connections between different families
    // =====================================================
    const marriageConnections: MarriageConnection[] = [];

    finalRoots.forEach(rootId => {
        const familyName = getFamilyName(rootId);

        function markFamily(id: string, visited = new Set<string>()) {
            if (visited.has(id)) return;
            visited.add(id);
            personToFamily.set(id, familyName);

            const children = getCoupleChildren(id);
            children.forEach(childId => markFamily(childId, visited));
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

    // Final debug output
    console.log("=== FINAL TREE STRUCTURE ===");
    families.forEach(f => {
        console.log(`Family: ${f.name}`);
        console.log(`  Members: ${f.memberCount}`);
        console.log(`  Generations: ${f.generations}`);
        console.log(`  Root: ${f.root.person.name}${f.root.spouse ? ` + ${f.root.spouse.name}` : ''}`);
        console.log(`  Children: ${f.root.children.map(c => c.person.name).join(', ')}`);
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


// --- MAIN COMPONENT ---

export default function PeopleDirectory() {
    const [viewMode, setViewMode] = useState<"combined" | "tree" | "grid" | "list">("combined");
    const [search, setSearch] = useState("");
    const [people, setPeople] = useState<Person[]>([]);
    const [families, setFamilies] = useState<ProcessedFamily[]>([]);
    const [marriageConnections, setMarriageConnections] = useState<MarriageConnection[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL
        ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/persons`
        : "http://localhost:8000/api/persons";

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                setError(null);

                const [peopleRes, treeRes] = await Promise.all([
                    fetch(`${API_BASE}/`),
                    fetch(`${API_BASE}/tree`)
                ]);

                let processedData: ReturnType<typeof processGraphData> | null = null;

                if (treeRes.ok) {
                    const rawTree = await treeRes.json();
                    console.log("Raw tree data received:", rawTree);
                    processedData = processGraphData(rawTree);
                    setFamilies(processedData.families);
                    setMarriageConnections(processedData.marriageConnections);
                } else {
                    console.warn("Tree API failed:", treeRes.status);
                }

                if (peopleRes.ok) {
                    const rawPeople: (ApiNode['data'] & { id: string })[] = await peopleRes.json();
                    const formatted: Person[] = rawPeople.map((p: any) => ({
                        id: p.id,
                        name: `${p.firstName} ${p.lastName}`.trim(),
                        firstName: p.firstName,
                        lastName: p.lastName,
                        relation: "Family Member",
                        birthYear: p.birthDate ? p.birthDate.split('-')[0] : "????",
                        deathYear: p.deathDate
                            ? 'Passed'
                            : "Living",
                        location: p.birthPlace || "Unknown",
                        photoUrl: p.photoUrl || "",
                        occupation: p.occupation || "",
                        tags: p.occupation ? [p.occupation] : ["Family"],
                        gender: p.gender,
                        generation: processedData?.generations.get(p.id)
                    }));
                    setPeople(formatted);
                } else {
                    console.warn("People API failed:", peopleRes.status);
                }
            } catch (err) {
                console.error("Fetch error:", err);
                setError(err instanceof Error ? err.message : "Failed to load data");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [API_BASE]);

    const filteredPeople = useMemo(() => {
        return people.filter(p =>
            p.name.toLowerCase().includes(search.toLowerCase()) ||
            p.location.toLowerCase().includes(search.toLowerCase()) ||
            p.occupation.toLowerCase().includes(search.toLowerCase())
        );
    }, [people, search]);

    const sortedPeople = useMemo(() => {
        return [...filteredPeople].sort((a, b) => {
            const genA = a.generation ?? 999;
            const genB = b.generation ?? 999;
            if (genA !== genB) return genA - genB;
            return a.name.localeCompare(b.name);
        });
    }, [filteredPeople]);

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
                            {search && (
                                <button
                                    onClick={() => setSearch("")}
                                    className="pr-4 text-stone-400 hover:text-stone-600"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            )}
                        </div>
                    </div>

                    {/* View Toggle */}
                    <ViewToggle viewMode={viewMode} onViewChange={(v) => setViewMode(v as any)} />
                </div>

                {/* Stats Bar */}
                {!loading && (
                    <div className="flex gap-4 text-sm text-stone-500">
                        <span>{people.length} people</span>
                        <span>•</span>
                        <span>{families.length} {families.length === 1 ? 'family' : 'families'}</span>
                        {families.length > 0 && (
                            <>
                                <span>•</span>
                                <span>{families.reduce((sum, f) => sum + f.generations, 0)} generations total</span>
                            </>
                        )}
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="mx-auto">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-24 gap-4 animate-fade-in">
                        <Icons.Loading />
                        <p className="text-stone-500 font-medium">Loading your ancestry...</p>
                    </div>
                ) : error ? (
                    <div className="flex flex-col items-center justify-center py-24 gap-4 animate-fade-in">
                        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
                            <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <p className="text-stone-700 font-medium">Failed to load data</p>
                        <p className="text-stone-500 text-sm">{error}</p>
                        <button
                            onClick={() => window.location.reload()}
                            className="mt-2 px-4 py-2 bg-stone-900 text-white rounded-lg hover:bg-stone-800 transition-colors"
                        >
                            Retry
                        </button>
                    </div>
                ) : (
                    <>
                        {/* Combined View */}
                        {viewMode === "combined" && (
                            <CombinedFamilyView
                                families={families}
                                marriageConnections={marriageConnections}
                            />
                        )}

                        {/* Separate Tree View */}
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
                                {sortedPeople.length === 0 && search && (
                                    <div className="col-span-full py-12 text-center text-stone-500">
                                        No results found for "{search}"
                                    </div>
                                )}
                            </div>
                        )}

                        {/* List View */}
                        {viewMode === "list" && (
                            <div className="flex flex-col gap-3 animate-fade-in">
                                <a
                                    href="/admin/create"
                                    className="flex items-center gap-4 p-4 rounded-2xl border-2 border-dashed border-stone-300 hover:border-amber-400 hover:bg-amber-50/20 transition-all text-stone-500 justify-center cursor-pointer group"
                                >
                                    <div className="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center text-stone-400 group-hover:bg-amber-100 group-hover:text-amber-600 transition-colors">
                                        <Icons.Plus />
                                    </div>
                                    <span className="text-sm font-bold group-hover:text-stone-700">Add New Person</span>
                                </a>
                                {sortedPeople.map((person) => (
                                    <CompactListRow key={person.id} person={person} />
                                ))}
                                {sortedPeople.length === 0 && search && (
                                    <div className="py-12 text-center text-stone-500">
                                        No results found for "{search}"
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Empty State */}
                        {people.length === 0 && !search && (
                            <div className="flex flex-col items-center justify-center py-24 gap-4">
                                <div className="w-20 h-20 rounded-full bg-stone-100 flex items-center justify-center">
                                    <svg className="w-10 h-10 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-serif font-bold text-stone-700">No family members yet</h3>
                                <p className="text-stone-500 text-sm">Start building your family tree by adding the first person</p>
                                <a
                                    href="/admin/create"
                                    className="mt-2 px-6 py-3 bg-stone-900 text-white rounded-xl hover:bg-stone-800 transition-colors font-medium flex items-center gap-2"
                                >
                                    <Icons.Plus />
                                    Add First Person
                                </a>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Mobile FAB */}
            <a
                href="/admin/create"
                className="md:hidden fixed bottom-6 right-6 w-14 h-14 bg-stone-900 text-white rounded-2xl shadow-2xl shadow-stone-900/30 flex items-center justify-center z-50 hover:scale-105 active:scale-95 transition-transform"
            >
                <Icons.Plus />
            </a>

            {/* CSS */}
            <style jsx global>{`
                @keyframes fade-in {
                    from { opacity: 0; transform: translateY(8px); }
                    to { opacity: 1; transform: translateY(0); }
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