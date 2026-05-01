from typing import Optional
import uuid
from pydantic import BaseModel, EmailStr

# Shared properties
class UserBase(BaseModel):
    email: Optional[EmailStr] = None
    name: Optional[str] = None

# Properties to receive via API on creation
class UserCreate(UserBase):
    email: EmailStr
    password: str

# Properties to receive via API on update
class UserUpdate(UserBase):
    password: Optional[str] = None

class UserInDBBase(UserBase):
    id: uuid.UUID
    role: str

    model_config = {"from_attributes": True}

# Additional properties to return via API
class User(UserInDBBase):
    pass
