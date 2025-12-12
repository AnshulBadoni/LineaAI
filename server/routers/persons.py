from fastapi import APIRouter, HTTPException, status
from models.person import PersonCreate, RelationshipCreate
from services.family_services import family_service

router = APIRouter(prefix="/api/persons", tags=["Persons"])

# ==================== CREATE ====================

@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_person(person: PersonCreate):
    """Create a new person in the family tree"""
    try:
        return family_service.create_person(person)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

# ==================== READ ====================

@router.get("/")
async def get_all_persons():
    """Get all persons in the family tree"""
    try:
        return family_service.get_all_persons()
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.get("/search")
async def search_persons(q: str):
    """Search for persons by name or bio"""
    if not q or len(q.strip()) < 2:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Search query must be at least 2 characters")
    try:
        return family_service.search_persons(q)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.get("/tree")
async def get_family_tree():
    """Get the entire family tree for visualization"""
    try:
        return family_service.get_family_tree()
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.get("/{person_id}")
async def get_person(person_id: str):
    """Get a person with their family relationships"""
    try:
        result = family_service.get_person_with_family(person_id)
        if not result:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Person not found")
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.get("/{person_id}/ancestors")
async def get_ancestors(person_id: str, generations: int = 5):
    """Get ancestors of a person"""
    if generations < 1 or generations > 20:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Generations must be between 1 and 20")
    try:
        result = family_service.get_ancestors(person_id, generations)
        if not result:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Person not found or has no ancestors")
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.get("/{person_id}/descendants")
async def get_descendants(person_id: str, generations: int = 5):
    """Get descendants of a person"""
    if generations < 1 or generations > 20:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Generations must be between 1 and 20")
    try:
        result = family_service.get_descendants(person_id, generations)
        if not result:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Person not found or has no descendants")
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

# ==================== RELATIONSHIPS ====================

@router.post("/relationships", status_code=status.HTTP_201_CREATED)
async def create_relationship(relationship: RelationshipCreate):
    """Create a relationship between two persons"""
    try:
        person1 = family_service.get_person_with_family(relationship.fromPersonId)
        person2 = family_service.get_person_with_family(relationship.toPersonId)
        
        if not person1 or not person2:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="One or both persons not found")
        
        if relationship.fromPersonId == relationship.toPersonId:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot create relationship with the same person")
        
        return family_service.create_relationship(relationship)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.get("/relationship/{person1_id}/{person2_id}")
async def find_relationship(person1_id: str, person2_id: str):
    """Find the relationship path between two persons"""
    if person1_id == person2_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot find relationship with the same person")
    try:
        result = family_service.find_relationship(person1_id, person2_id)
        if not result:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No relationship found between these persons")
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

# ==================== UPDATE ====================

@router.put("/{person_id}")
async def update_person(person_id: str, person: PersonCreate):
    """Update a person's information"""
    try:
        existing = family_service.get_person_with_family(person_id)
        if not existing:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Person not found")
        
        result = family_service.update_person(person_id, person)
        return {"status": "success", "data": result}
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

# ==================== DELETE ====================

@router.delete("/{person_id}", status_code=status.HTTP_200_OK)
async def delete_person(person_id: str):
    """Delete a person and all their relationships (CASCADE delete)"""
    try:
        existing = family_service.get_person_with_family(person_id)
        if not existing:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Person not found")
        
        result = family_service.delete_person(person_id)
        return result
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.delete("/{person_id}/safe", status_code=status.HTTP_200_OK)
async def delete_person_safe(person_id: str):
    """Safely delete a person without removing relationships"""
    try:
        existing = family_service.get_person_with_family(person_id)
        if not existing:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Person not found")
        
        result = family_service.delete_person_safe(person_id)
        return result
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.delete("/{from_person_id}/relationship/{to_person_id}", status_code=status.HTTP_200_OK)
async def delete_relationship(from_person_id: str, to_person_id: str, relationship_type: str):
    """Delete a specific relationship between two persons"""
    if from_person_id == to_person_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot delete relationship with the same person")
    
    try:
        person1 = family_service.get_person_with_family(from_person_id)
        person2 = family_service.get_person_with_family(to_person_id)
        
        if not person1 or not person2:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="One or both persons not found")
        
        result = family_service.delete_relationship(from_person_id, to_person_id, relationship_type)
        return result
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))