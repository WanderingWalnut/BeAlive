from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict


# ========= Enums =========


class ConnectionStatus(str, Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    BLOCKED = "blocked"


class CommitmentSide(str, Enum):
    FOR = "for"
    AGAINST = "against"


# ========= Profiles =========


class ProfileBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    username: Optional[str] = None
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None


class ProfileCreate(BaseModel):
    user_id: UUID
    username: Optional[str] = None
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None


class ProfileUpdate(ProfileBase):
    pass


class ProfileOut(ProfileBase):
    user_id: UUID
    created_at: datetime
    updated_at: datetime


# ========= Connections =========


class ConnectionCreate(BaseModel):
    addressee_id: UUID


class ConnectionUpdate(BaseModel):
    status: ConnectionStatus


class ConnectionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    requester_id: UUID
    addressee_id: UUID
    status: ConnectionStatus
    created_at: datetime

