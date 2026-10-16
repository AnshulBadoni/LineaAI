from database.postgres_connection import db
from models.person import PersonCreate, PersonResponse, RelationshipCreate
from typing import List, Optional, Dict, Any
import uuid
from datetime import date, datetime
from collections import deque

class FamilyService:

    def _serialize_person(self, row: dict) -> dict:
        """Convert PostgreSQL row dict to camelCase dictionary matching PersonResponse schema"""
        if not row:
            return None
        
        return {
            "id": row.get("id"),
            "firstName": row.get("first_name"),
            "lastName": row.get("last_name"),
            "fullName": row.get("full_name"),
            "gender": row.get("gender"),
            "birthDate": row.get("birth_date").isoformat() if row.get("birth_date") else None,
            "deathDate": row.get("death_date").isoformat() if row.get("death_date") else None,
            "birthPlace": row.get("birth_place"),
            "occupation": row.get("occupation"),
            "bio": row.get("bio"),
            "photoUrl": row.get("photo_url"),
            "createdAt": row.get("created_at").isoformat() if row.get("created_at") else None,
            "updatedAt": row.get("updated_at").isoformat() if row.get("updated_at") else None
        }

    # CREATE PERSON
    def create_person(self, person: PersonCreate) -> PersonResponse:
        person_id = str(uuid.uuid4())
        full_name = f"{person.firstName} {person.lastName}"

        query = """
        INSERT INTO persons (
            id, first_name, last_name, full_name, gender,
            birth_date, death_date, birth_place, occupation, bio, photo_url,
            created_at, updated_at
        ) VALUES (
            %(id)s, %(firstName)s, %(lastName)s, %(fullName)s, %(gender)s,
            %(birthDate)s, %(deathDate)s, %(birthPlace)s, %(occupation)s, %(bio)s, %(photoUrl)s,
            CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        )
        RETURNING *;
        """

        result = db.execute_write(query, {
            "id": person_id,
            "firstName": person.firstName,
            "lastName": person.lastName,
            "fullName": full_name,
            "gender": person.gender,
            "birthDate": person.birthDate,
            "deathDate": person.deathDate,
            "birthPlace": person.birthPlace,
            "occupation": person.occupation,
            "bio": person.bio,
            "photoUrl": person.photoUrl
        })

        print(f"Created person: {person_id}")
        return PersonResponse(id=person_id, fullName=full_name, **person.dict())

    # UPDATE PERSON
    def update_person(self, person_id: str, person: PersonCreate) -> PersonResponse:
        full_name = f"{person.firstName} {person.lastName}"

        query = """
        UPDATE persons
        SET first_name = %(firstName)s,
            last_name = %(lastName)s,
            full_name = %(fullName)s,
            gender = %(gender)s,
            birth_date = %(birthDate)s,
            death_date = %(deathDate)s,
            birth_place = %(birthPlace)s,
            occupation = %(occupation)s,
            bio = %(bio)s,
            photo_url = %(photoUrl)s,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = %(id)s
        RETURNING *;
        """

        result = db.execute_write(query, {
            "id": person_id,
            "firstName": person.firstName,
            "lastName": person.lastName,
            "fullName": full_name,
            "gender": person.gender,
            "birthDate": person.birthDate,
            "deathDate": person.deathDate,
            "birthPlace": person.birthPlace,
            "occupation": person.occupation,
            "bio": person.bio,
            "photoUrl": person.photoUrl
        })

        if not result:
            raise ValueError(f"Person with id {person_id} not found")

        print(f"Updated person: {person_id}")
        return PersonResponse(id=person_id, fullName=full_name, **person.dict())

    # DELETE PERSON
    def delete_person(self, person_id: str) -> dict:
        check = db.execute_query("SELECT id FROM persons WHERE id = %(id)s", {"id": person_id})
        if not check:
            raise ValueError(f"Person with id {person_id} not found")

        # ON DELETE CASCADE cleans up relationships automatically
        db.execute_write("DELETE FROM persons WHERE id = %(id)s", {"id": person_id})
        print(f"Deleted person: {person_id}")
        return {"status": "success", "message": f"Person {person_id} deleted successfully", "deleted": True}

    # DELETE PERSON (SAFE MODE)
    def delete_person_safe(self, person_id: str) -> dict:
        check = db.execute_query("SELECT id FROM persons WHERE id = %(id)s", {"id": person_id})
        if not check:
            raise ValueError(f"Person with id {person_id} not found")

        audit_query = """
        SELECT r.relationship_type AS type, p.id AS "personId", p.full_name AS name
        FROM relationships r
        JOIN persons p ON r.to_person_id = p.id
        WHERE r.from_person_id = %(id)s
        """
        audit_result = db.execute_query(audit_query, {"id": person_id})

        db.execute_write("DELETE FROM persons WHERE id = %(id)s", {"id": person_id})
        return {
            "status": "success",
            "message": f"Person {person_id} deleted successfully",
            "deleted": True,
            "orphaned_relationships": audit_result
        }

    # DELETE RELATIONSHIP
    def delete_relationship(self, from_person_id: str, to_person_id: str, relationship_type: str) -> dict:
        bidirectional_map = {
            "PARENT_OF": "CHILD_OF",
            "CHILD_OF": "PARENT_OF",
            "MARRIED_TO": "SPOUSE_OF",
            "SPOUSE_OF": "SPOUSE_OF",
            "SIBLING_OF": "SIBLING_OF",
            "DIVORCED_FROM": "DIVORCED_FROM",
            "ADOPTED_PARENT_OF": "ADOPTED_CHILD_OF",
            "ADOPTED_CHILD_OF": "ADOPTED_PARENT_OF",
            "STEP_PARENT_OF": "STEP_CHILD_OF",
            "STEP_CHILD_OF": "STEP_PARENT_OF"
        }

        reverse_type = bidirectional_map.get(relationship_type, relationship_type)

        delete_query = """
        DELETE FROM relationships
        WHERE (from_person_id = %(fromId)s AND to_person_id = %(toId)s AND relationship_type = %(relType)s)
           OR (from_person_id = %(toId)s AND to_person_id = %(fromId)s AND relationship_type = %(revType)s)
        """

        db.execute_write(delete_query, {
            "fromId": from_person_id,
            "toId": to_person_id,
            "relType": relationship_type,
            "revType": reverse_type
        })

        return {
            "status": "success",
            "message": f"Relationship {relationship_type} deleted successfully",
            "deleted": True
        }

    # CREATE RELATIONSHIP
    def create_relationship(self, rel: RelationshipCreate) -> dict:
        rel_type_str = rel.relationshipType.value if hasattr(rel.relationshipType, "value") else str(rel.relationshipType)

        mappings = {
            "PARENT_OF": ("PARENT_OF", "CHILD_OF"),
            "MARRIED_TO": ("SPOUSE_OF", "SPOUSE_OF"),
            "SIBLING_OF": ("SIBLING_OF", "SIBLING_OF"),
            "DIVORCED_FROM": ("DIVORCED_FROM", "DIVORCED_FROM"),
            "ADOPTED_PARENT_OF": ("ADOPTED_PARENT_OF", "ADOPTED_CHILD_OF"),
            "STEP_PARENT_OF": ("STEP_PARENT_OF", "STEP_CHILD_OF")
        }

        if rel_type_str not in mappings:
            raise ValueError(f"Unknown relationship type: '{rel_type_str}'. Valid types are: {list(mappings.keys())}")

        fwd_type, rev_type = mappings[rel_type_str]

        insert_sql = """
        INSERT INTO relationships (id, from_person_id, to_person_id, relationship_type, marriage_date, updated_at)
        VALUES (%(id)s, %(fromId)s, %(toId)s, %(type)s, %(marriageDate)s, CURRENT_TIMESTAMP)
        ON CONFLICT (from_person_id, to_person_id, relationship_type)
        DO UPDATE SET marriage_date = EXCLUDED.marriage_date, updated_at = CURRENT_TIMESTAMP;
        """

        # Forward
        db.execute_write(insert_sql, {
            "id": str(uuid.uuid4()),
            "fromId": rel.fromPersonId,
            "toId": rel.toPersonId,
            "type": fwd_type,
            "marriageDate": rel.marriageDate
        })

        # Reverse
        db.execute_write(insert_sql, {
            "id": str(uuid.uuid4()),
            "fromId": rel.toPersonId,
            "toId": rel.fromPersonId,
            "type": rev_type,
            "marriageDate": rel.marriageDate
        })

        return {"status": "success", "relationship": rel_type_str}

    # GET PERSON WITH FAMILY
    def get_person_with_family(self, person_id: str) -> Optional[dict]:
        person_res = db.execute_query("SELECT * FROM persons WHERE id = %(id)s", {"id": person_id})
        if not person_res:
            return None

        person_data = self._serialize_person(person_res[0])

        rel_query = """
        SELECT r.relationship_type, p.*
        FROM relationships r
        JOIN persons p ON r.to_person_id = p.id
        WHERE r.from_person_id = %(id)s
        """
        related_rows = db.execute_query(rel_query, {"id": person_id})

        parents = []
        children = []
        spouses = []
        siblings = []
        adopted_parents = []
        step_parents = []

        for row in related_rows:
            p_short = {
                "id": row["id"],
                "fullName": row["full_name"],
                "gender": row["gender"],
                "birthDate": row["birth_date"].isoformat() if row.get("birth_date") else None,
                "photoUrl": row.get("photo_url")
            }
            rel_type = row["relationship_type"]
            if rel_type == "CHILD_OF":
                parents.append(p_short)
            elif rel_type == "PARENT_OF":
                children.append(p_short)
            elif rel_type == "SPOUSE_OF":
                spouses.append(p_short)
            elif rel_type == "SIBLING_OF":
                siblings.append(p_short)
            elif rel_type == "ADOPTED_CHILD_OF":
                adopted_parents.append(p_short)
            elif rel_type == "STEP_CHILD_OF":
                step_parents.append(p_short)

        return {
            "person": person_data,
            "parents": parents,
            "children": children,
            "spouses": spouses,
            "siblings": siblings,
            "adoptedParents": adopted_parents,
            "stepParents": step_parents
        }

    # GET ALL PERSONS
    def get_all_persons(self) -> List[dict]:
        rows = db.execute_query("SELECT * FROM persons ORDER BY last_name, first_name")
        return [self._serialize_person(r) for r in rows]

    # SEARCH PERSONS
    def search_persons(self, search_term: str) -> List[dict]:
        query = """
        SELECT * FROM persons
        WHERE LOWER(full_name) LIKE %(search)s
           OR LOWER(COALESCE(bio, '')) LIKE %(search)s
        ORDER BY full_name
        """
        rows = db.execute_query(query, {"search": f"%{search_term.lower()}%"})
        return [self._serialize_person(r) for r in rows]

    # GET FAMILY TREE (for visualization)
    def get_family_tree(self) -> dict:
        persons = db.execute_query("SELECT * FROM persons ORDER BY full_name")
        rels = db.execute_query("SELECT from_person_id, to_person_id, relationship_type FROM relationships")

        nodes = []
        for p in persons:
            serialized = self._serialize_person(p)
            nodes.append({
                "id": serialized["id"],
                "label": serialized["fullName"],
                "data": serialized
            })

        edges = []
        for r in rels:
            edges.append({
                "source": r["from_person_id"],
                "target": r["to_person_id"],
                "type": r["relationship_type"]
            })

        return {"nodes": nodes, "edges": edges}

    # GET ANCESTORS
    def get_ancestors(self, person_id: str, generations: int = 5) -> List[dict]:
        query = """
        WITH RECURSIVE ancestor_tree AS (
            SELECT r.to_person_id AS ancestor_id, 1 AS generation
            FROM relationships r
            WHERE r.from_person_id = %(id)s AND r.relationship_type = 'CHILD_OF'
            
            UNION ALL
            
            SELECT r.to_person_id AS ancestor_id, a.generation + 1
            FROM ancestor_tree a
            JOIN relationships r ON r.from_person_id = a.ancestor_id
            WHERE r.relationship_type = 'CHILD_OF' AND a.generation < %(generations)s
        )
        SELECT p.*, a.generation
        FROM ancestor_tree a
        JOIN persons p ON a.ancestor_id = p.id
        ORDER BY a.generation;
        """
        rows = db.execute_query(query, {"id": person_id, "generations": generations})
        return [{"ancestor": self._serialize_person(r), "generation": r["generation"]} for r in rows]

    # GET DESCENDANTS
    def get_descendants(self, person_id: str, generations: int = 5) -> List[dict]:
        query = """
        WITH RECURSIVE descendant_tree AS (
            SELECT r.to_person_id AS descendant_id, 1 AS generation
            FROM relationships r
            WHERE r.from_person_id = %(id)s AND r.relationship_type = 'PARENT_OF'
            
            UNION ALL
            
            SELECT r.to_person_id AS descendant_id, d.generation + 1
            FROM descendant_tree d
            JOIN relationships r ON r.from_person_id = d.descendant_id
            WHERE r.relationship_type = 'PARENT_OF' AND d.generation < %(generations)s
        )
        SELECT p.*, d.generation
        FROM descendant_tree d
        JOIN persons p ON d.descendant_id = p.id
        ORDER BY d.generation;
        """
        rows = db.execute_query(query, {"id": person_id, "generations": generations})
        return [{"descendant": self._serialize_person(r), "generation": r["generation"]} for r in rows]

    # FIND RELATIONSHIP BETWEEN TWO PEOPLE (BFS Shortest Path)
    def find_relationship(self, person1_id: str, person2_id: str) -> Optional[dict]:
        # Fetch entire graph adjacency for BFS
        persons = {p["id"]: p["full_name"] for p in db.execute_query("SELECT id, full_name FROM persons")}
        if person1_id not in persons or person2_id not in persons:
            return None

        rels = db.execute_query("SELECT from_person_id, to_person_id, relationship_type FROM relationships")
        adj = {}
        for r in rels:
            src, tgt, rtype = r["from_person_id"], r["to_person_id"], r["relationship_type"]
            adj.setdefault(src, []).append((tgt, rtype))

        queue = deque([(person1_id, [person1_id], [])])
        visited = {person1_id}

        while queue:
            curr_id, path_nodes, path_rels = queue.popleft()
            if curr_id == person2_id:
                return {
                    "path": path_nodes,
                    "names": [persons[pid] for pid in path_nodes],
                    "relationships": path_rels
                }

            for neighbor_id, rel_type in adj.get(curr_id, []):
                if neighbor_id not in visited:
                    visited.add(neighbor_id)
                    queue.append((neighbor_id, path_nodes + [neighbor_id], path_rels + [rel_type]))

        return None

family_service = FamilyService()