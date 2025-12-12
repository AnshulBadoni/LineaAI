from pydantic import BaseModel, Field, validator
from typing import Optional, List
from datetime import date
from enum import Enum


# ----------------------------
# Relationship Types (Safe)
# ----------------------------
class RelationshipType(str, Enum):
    PARENT_OF = "PARENT_OF"
    MARRIED_TO = "MARRIED_TO"
    DIVORCED_FROM = "DIVORCED_FROM"
    ADOPTED_PARENT_OF = "ADOPTED_PARENT_OF"
    STEP_PARENT_OF = "STEP_PARENT_OF"


# ----------------------------
# Person Models
# ----------------------------
class PersonBase(BaseModel):
    firstName: str = Field(..., example="John")
    lastName: str = Field(..., example="Doe")
    gender: str = Field(..., example="Male")
    birthDate: Optional[date] = None
    deathDate: Optional[date] = None
    birthPlace: Optional[str] = None
    occupation: Optional[str] = None
    bio: Optional[str] = None
    photoUrl: Optional[str] = None

    @property
    def fullName(self) -> str:
        return f"{self.firstName} {self.lastName}"


class PersonCreate(PersonBase):
    """Model for creating a new person."""
    pass


class PersonResponse(PersonBase):
    id: str = Field(..., example="uuid-1234")
    fullName: str = Field(..., example="John Doe")


# ----------------------------
# Relationship Models
# ----------------------------
class RelationshipCreate(BaseModel):
    fromPersonId: str = Field(..., example="uuid-1")
    toPersonId: str = Field(..., example="uuid-2")
    relationshipType: RelationshipType
    startDate: Optional[date] = None
    endDate: Optional[date] = None
    marriageDate: Optional[date] = None  # <--- ADD THIS LINE


    @validator("endDate")
    def validate_dates(cls, v, values):
        if v and "startDate" in values and values["startDate"] and v < values["startDate"]:
            raise ValueError("endDate cannot be earlier than startDate")
        return v


# ----------------------------
# Family Tree Response Models
# ----------------------------
class PersonShort(BaseModel):
    id: str
    fullName: str
    gender: str
    birthDate: Optional[date] = None
    photoUrl: Optional[str] = None


class PersonWithFamily(PersonResponse):
    parents: List[PersonShort] = []
    children: List[PersonShort] = []
    spouses: List[PersonShort] = []
    siblings: List[PersonShort] = []
    adoptedParents: List[PersonShort] = []
    stepParents: List[PersonShort] = []


# ----------------------------
# Helper Models for RAG / Search
# ----------------------------
class FamilyMember(BaseModel):
    person: PersonResponse
    relationship: str


class SearchResult(BaseModel):
    personId: str
    fullName: str
    snippet: str
