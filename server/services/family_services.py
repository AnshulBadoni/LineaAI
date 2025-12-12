from  database.neo4j_connection import db
from  models.person import PersonCreate, PersonResponse, RelationshipCreate
from typing import List, Optional
import uuid
from datetime import datetime
from neo4j.time import DateTime

class FamilyService:
    
    def _serialize_node(self, node: dict) -> dict:
        """Convert Neo4j DateTime objects to ISO strings"""
        if not node:
            return None
        
        serialized = dict(node)
        for key, value in serialized.items():
            if isinstance(value, DateTime):
                serialized[key] = value.isoformat()
            elif isinstance(value, (list, tuple)):
                serialized[key] = [self._serialize_node(item) if isinstance(item, dict) else item for item in value]
        return serialized
    
    def _serialize_result(self, data: any) -> any:
        """Recursively serialize Neo4j objects"""
        if isinstance(data, dict):
            return {k: self._serialize_result(v) for k, v in data.items()}
        elif isinstance(data, (list, tuple)):
            return [self._serialize_result(item) for item in data]
        elif isinstance(data, DateTime):
            return data.isoformat()
        return data
    
    # CREATE PERSON
    def create_person(self, person: PersonCreate) -> PersonResponse:
        person_id = str(uuid.uuid4())
        full_name = f"{person.firstName} {person.lastName}"
        
        query = """
        CREATE (p:Person {
            id: $id,
            firstName: $firstName,
            lastName: $lastName,
            fullName: $fullName,
            gender: $gender,
            birthDate: $birthDate,
            deathDate: $deathDate,
            birthPlace: $birthPlace,
            occupation: $occupation,
            bio: $bio,
            photoUrl: $photoUrl,
            createdAt: datetime(),
            updatedAt: datetime()
        })
        RETURN p
        """
        
        result = db.execute_write(query, {
            "id": person_id,
            "firstName": person.firstName,
            "lastName": person.lastName,
            "fullName": full_name,
            "gender": person.gender,
            "birthDate": str(person.birthDate) if person.birthDate else None,
            "deathDate": str(person.deathDate) if person.deathDate else None,
            "birthPlace": person.birthPlace,
            "occupation": person.occupation,
            "bio": person.bio,
            "photoUrl": person.photoUrl
        })
        
        print(f"Created person: {result}")

        return PersonResponse(id=person_id, fullName=full_name, **person.dict())
    
    # UPDATE PERSON
    def update_person(self, person_id: str, person: PersonCreate) -> PersonResponse:
        """Update a person's information"""
        full_name = f"{person.firstName} {person.lastName}"
        
        query = """
        MATCH (p:Person {id: $id})
        SET p.firstName = $firstName,
            p.lastName = $lastName,
            p.fullName = $fullName,
            p.gender = $gender,
            p.birthDate = $birthDate,
            p.deathDate = $deathDate,
            p.birthPlace = $birthPlace,
            p.occupation = $occupation,
            p.bio = $bio,
            p.photoUrl = $photoUrl,
            p.updatedAt = datetime()
        RETURN p
        """
        
        result = db.execute_write(query, {
            "id": person_id,
            "firstName": person.firstName,
            "lastName": person.lastName,
            "fullName": full_name,
            "gender": person.gender,
            "birthDate": str(person.birthDate) if person.birthDate else None,
            "deathDate": str(person.deathDate) if person.deathDate else None,
            "birthPlace": person.birthPlace,
            "occupation": person.occupation,
            "bio": person.bio,
            "photoUrl": person.photoUrl
        })
        
        if not result:
            raise ValueError(f"Person with id {person_id} not found")
        
        print(f"Updated person: {result}")
        return PersonResponse(id=person_id, fullName=full_name, **person.dict())
    
    # DELETE PERSON
    def delete_person(self, person_id: str) -> dict:
        """Delete a person and all their relationships"""
        check_query = "MATCH (p:Person {id: $id}) RETURN p"
        check_result = db.execute_query(check_query, {"id": person_id})
        
        if not check_result:
            raise ValueError(f"Person with id {person_id} not found")
        
        delete_query = """
        MATCH (p:Person {id: $id})
        DETACH DELETE p
        RETURN true as deleted
        """
        
        result = db.execute_write(delete_query, {"id": person_id})
        
        print(f"Deleted person: {person_id}")
        return {"status": "success", "message": f"Person {person_id} deleted successfully", "deleted": True}
    
    # DELETE PERSON (SAFE MODE)
    def delete_person_safe(self, person_id: str) -> dict:
        """Safe delete - only deletes the person node"""
        check_query = "MATCH (p:Person {id: $id}) RETURN p"
        check_result = db.execute_query(check_query, {"id": person_id})
        
        if not check_result:
            raise ValueError(f"Person with id {person_id} not found")
        
        audit_query = """
        MATCH (p:Person {id: $id})
        OPTIONAL MATCH (p)-[r]->(related:Person)
        RETURN collect({type: type(r), personId: related.id, name: related.fullName}) as relationships
        """
        audit_result = db.execute_query(audit_query, {"id": person_id})
        
        delete_query = """
        MATCH (p:Person {id: $id})
        DELETE p
        RETURN true as deleted
        """
        
        result = db.execute_write(delete_query, {"id": person_id})
        
        deleted_relationships = audit_result[0]['relationships'] if audit_result else []
        
        print(f"Safely deleted person: {person_id}")
        return {
            "status": "success", 
            "message": f"Person {person_id} deleted successfully",
            "deleted": True,
            "orphaned_relationships": deleted_relationships
        }
    
    # DELETE RELATIONSHIP
    def delete_relationship(self, from_person_id: str, to_person_id: str, relationship_type: str) -> dict:
        """Delete a specific relationship between two people"""
        bidirectional_map = {
            "PARENT_OF": "CHILD_OF",
            "CHILD_OF": "PARENT_OF",
            "MARRIED_TO": "MARRIED_TO",
            "SPOUSE_OF": "SPOUSE_OF",
            "SIBLING_OF": "SIBLING_OF",
            "DIVORCED_FROM": "DIVORCED_FROM",
            "ADOPTED_PARENT_OF": "ADOPTED_CHILD_OF",
            "ADOPTED_CHILD_OF": "ADOPTED_PARENT_OF",
            "STEP_PARENT_OF": "STEP_CHILD_OF",
            "STEP_CHILD_OF": "STEP_PARENT_OF"
        }
        
        if relationship_type not in bidirectional_map:
            raise ValueError(f"Unknown relationship type: {relationship_type}")
        
        reverse_type = bidirectional_map[relationship_type]
        
        delete_query_forward = f"""
        MATCH (p1:Person {{id: $fromId}})-[r:{relationship_type}]->(p2:Person {{id: $toId}})
        DELETE r
        RETURN true as deleted
        """
        
        delete_query_reverse = f"""
        MATCH (p1:Person {{id: $fromId}})<-[r:{reverse_type}]-(p2:Person {{id: $toId}})
        DELETE r
        RETURN true as deleted
        """
        
        result_forward = db.execute_write(delete_query_forward, {
            "fromId": from_person_id,
            "toId": to_person_id
        })
        
        result_reverse = db.execute_write(delete_query_reverse, {
            "fromId": from_person_id,
            "toId": to_person_id
        })
        
        print(f"Deleted relationship: {from_person_id} -[{relationship_type}]-> {to_person_id}")
        
        return {
            "status": "success",
            "message": f"Relationship {relationship_type} deleted successfully",
            "deleted": True
        }
    
    # CREATE RELATIONSHIP
    def create_relationship(self, rel: RelationshipCreate) -> dict:
        query_map = {
            "PARENT_OF": """
                MATCH (parent:Person {id: $fromId})
                MATCH (child:Person {id: $toId})
                MERGE (parent)-[:PARENT_OF]->(child)
                MERGE (child)-[:CHILD_OF]->(parent)
                RETURN parent, child
            """,
            "MARRIED_TO": """ 
                MATCH (p1:Person {id: $fromId})
                MATCH (p2:Person {id: $toId})
                MERGE (p1)-[:SPOUSE_OF {marriageDate: $marriageDate}]->(p2)
                MERGE (p2)-[:SPOUSE_OF {marriageDate: $marriageDate}]->(p1)
                RETURN p1, p2
            """,
            "SIBLING_OF": """
                MATCH (p1:Person {id: $fromId})
                MATCH (p2:Person {id: $toId})
                MERGE (p1)-[:SIBLING_OF]->(p2)
                MERGE (p2)-[:SIBLING_OF]->(p1)
                RETURN p1, p2
            """,
            "DIVORCED_FROM": """
                MATCH (p1:Person {id: $fromId})
                MATCH (p2:Person {id: $toId})
                MERGE (p1)-[:DIVORCED_FROM]->(p2)
                MERGE (p2)-[:DIVORCED_FROM]->(p1)
                RETURN p1, p2
            """,
             "ADOPTED_PARENT_OF": """
                MATCH (parent:Person {id: $fromId})
                MATCH (child:Person {id: $toId})
                MERGE (parent)-[:ADOPTED_PARENT_OF]->(child)
                MERGE (child)-[:ADOPTED_CHILD_OF]->(parent)
                RETURN parent, child
            """,
             "STEP_PARENT_OF": """
                MATCH (parent:Person {id: $fromId})
                MATCH (child:Person {id: $toId})
                MERGE (parent)-[:STEP_PARENT_OF]->(child)
                MERGE (child)-[:STEP_CHILD_OF]->(parent)
                RETURN parent, child
            """
        }
        
        rel_type_str = rel.relationshipType.value 
        
        query = query_map.get(rel_type_str)
        
        if not query:
            valid_keys = list(query_map.keys())
            raise ValueError(f"Unknown relationship type: '{rel_type_str}'. Valid types are: {valid_keys}")
        
        db.execute_write(query, {
            "fromId": rel.fromPersonId,
            "toId": rel.toPersonId,
            "marriageDate": str(rel.marriageDate) if rel.marriageDate else None
        })
        
        return {"status": "success", "relationship": rel_type_str}
    
    # GET PERSON WITH FAMILY
    def get_person_with_family(self, person_id: str) -> dict:
        query = """
        MATCH (p:Person {id: $id})
        OPTIONAL MATCH (p)-[:CHILD_OF]->(parent:Person)
        OPTIONAL MATCH (p)-[:PARENT_OF]->(child:Person)
        OPTIONAL MATCH (p)-[:SPOUSE_OF]->(spouse:Person)
        OPTIONAL MATCH (p)-[:SIBLING_OF]->(sibling:Person)
        RETURN p,
               collect(DISTINCT parent) as parents,
               collect(DISTINCT child) as children,
               collect(DISTINCT spouse) as spouses,
               collect(DISTINCT sibling) as siblings
        """
        
        result = db.execute_query(query, {"id": person_id})
        if not result:
            return None
        
        data = result[0]
        return {
            "person": self._serialize_node(data['p']),
            "parents": [self._serialize_node(p) for p in data['parents']],
            "children": [self._serialize_node(c) for c in data['children']],
            "spouses": [self._serialize_node(s) for s in data['spouses']],
            "siblings": [self._serialize_node(s) for s in data['siblings']]
        }
    
    # GET ALL PERSONS
    def get_all_persons(self) -> List[dict]:
        query = "MATCH (p:Person) RETURN p ORDER BY p.lastName, p.firstName"
        result = db.execute_query(query)
        return [self._serialize_node(record['p']) for record in result]
    
    # SEARCH PERSON
    def search_persons(self, search_term: str) -> List[dict]:
        query = """
        MATCH (p:Person)
        WHERE toLower(p.fullName) CONTAINS toLower($search)
           OR toLower(p.bio) CONTAINS toLower($search)
        RETURN p
        """
        result = db.execute_query(query, {"search": search_term})
        return [self._serialize_node(record['p']) for record in result]
    
    # GET FAMILY TREE (for visualization)
    def get_family_tree(self) -> dict:
        query = """
        MATCH (p:Person)
        OPTIONAL MATCH (p)-[r]->(related:Person)
        RETURN p, collect({type: type(r), target: related.id}) as relationships
        """
        
        result = db.execute_query(query)
        
        nodes = []
        edges = []
        
        for record in result:
            person = self._serialize_node(record['p'])
            nodes.append({
                "id": person['id'],
                "label": person['fullName'],
                "data": person
            })
            
            for rel in record['relationships']:
                if rel['target']:
                    edges.append({
                        "source": person['id'],
                        "target": rel['target'],
                        "type": rel['type']
                    })
        
        return {"nodes": nodes, "edges": edges}
    
    # GET ANCESTORS
    def get_ancestors(self, person_id: str, generations: int = 5) -> List[dict]:
        query = """
        MATCH path = (p:Person {id: $id})-[:CHILD_OF*1..$generations]->(ancestor:Person)
        RETURN ancestor, length(path) as generation
        ORDER BY generation
        """
        result = db.execute_query(query, {"id": person_id, "generations": generations})
        return self._serialize_result(result)
    
    # GET DESCENDANTS
    def get_descendants(self, person_id: str, generations: int = 5) -> List[dict]:
        query = """
        MATCH path = (p:Person {id: $id})-[:PARENT_OF*1..$generations]->(descendant:Person)
        RETURN descendant, length(path) as generation
        ORDER BY generation
        """
        result = db.execute_query(query, {"id": person_id, "generations": generations})
        return self._serialize_result(result)
    
    # FIND RELATIONSHIP BETWEEN TWO PEOPLE
    def find_relationship(self, person1_id: str, person2_id: str) -> dict:
        query = """
        MATCH path = shortestPath(
            (p1:Person {id: $id1})-[*]-(p2:Person {id: $id2})
        )
        RETURN path, 
               [node in nodes(path) | node.fullName] as names,
               [rel in relationships(path) | type(rel)] as relationships
        """
        result = db.execute_query(query, {"id1": person1_id, "id2": person2_id})
        return self._serialize_result(result[0]) if result else None

family_service = FamilyService()