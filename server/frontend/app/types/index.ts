export interface ApiNode {
    id: string;
    label: string;
    data: {
        firstName: string;
        lastName: string;
        birthDate?: string;
        deathDate?: string;
        birthPlace?: string;
        occupation?: string;
        photoUrl?: string;
        bio?: string;
        gender?: string;
    };
}

export interface ApiEdge {
    source: string;
    target: string;
    type: string;
}

export interface Person {
    id: string;
    name: string;
    firstName: string;
    lastName: string;
    relation: string;
    birthYear: string;
    deathYear: string | "Living";
    location: string;
    photoUrl: string;
    occupation: string;
    tags: string[];
    gender?: string;
    marriedInto?: string;
    generation?: number;
}

export interface FamilyNode {
    person: Person;
    spouse?: Person;
    children: FamilyNode[];
    parents: string[];
}

export interface ProcessedFamily {
    id: string;
    name: string;
    root: FamilyNode;
    memberCount: number;
    generations: number;
}

export interface MarriageConnection {
    person1: Person;
    person2: Person;
    family1: string;
    family2: string;
}
