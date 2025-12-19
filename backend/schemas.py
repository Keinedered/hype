from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime
from enum import Enum


# Enums
class TrackId(str, Enum):
    event = "event"
    digital = "digital"
    communication = "communication"
    design = "design"


class CourseLevel(str, Enum):
    beginner = "beginner"
    intermediate = "intermediate"
    advanced = "advanced"


class CourseStatus(str, Enum):
    not_started = "not_started"
    in_progress = "in_progress"
    completed = "completed"


class NodeType(str, Enum):
    track = "track"
    course = "course"
    module = "module"
    lesson = "lesson"
    concept = "concept"


class NodeStatus(str, Enum):
    completed = "completed"
    current = "current"
    open = "open"
    closed = "closed"


class EdgeType(str, Enum):
    required = "required"
    alternative = "alternative"
    recommended = "recommended"


class SubmissionStatus(str, Enum):
    not_submitted = "not_submitted"
    pending = "pending"
    accepted = "accepted"
    needs_revision = "needs_revision"


class NotificationType(str, Enum):
    submission_reviewed = "submission_reviewed"
    new_branch_unlocked = "new_branch_unlocked"
    reminder = "reminder"


# Base schemas
class TrackBase(BaseModel):
    id: TrackId
    name: str
    description: str
    color: str


class Track(TrackBase):
    class Config:
        from_attributes = True


class CourseBase(BaseModel):
    id: str
    track_id: TrackId
    title: str
    version: str
    description: str
    short_description: str
    level: CourseLevel
    module_count: int
    lesson_count: int
    task_count: int
    authors: List[str]
    enrollment_deadline: Optional[str] = None


class Course(CourseBase):
    created_at: datetime
    
    class Config:
        from_attributes = True


class CourseWithProgress(Course):
    progress: Optional[float] = None
    status: Optional[CourseStatus] = None


class HandbookExcerptBase(BaseModel):
    id: str
    section_title: str
    excerpt: str
    full_section_id: str


class HandbookExcerpt(HandbookExcerptBase):
    lesson_id: str
    
    class Config:
        from_attributes = True


class AssignmentBase(BaseModel):
    id: str
    description: str
    criteria: str
    requires_text: bool
    requires_file: bool
    requires_link: bool


class Assignment(AssignmentBase):
    lesson_id: str
    
    class Config:
        from_attributes = True


class LessonBase(BaseModel):
    id: str
    module_id: str
    title: str
    description: str
    video_url: Optional[str] = None
    video_duration: Optional[str] = None
    content: str
    order_index: int


class Lesson(LessonBase):
    handbook_excerpts: List[HandbookExcerpt] = []
    assignment: Optional[Assignment] = None
    status: Optional[CourseStatus] = None
    
    class Config:
        from_attributes = True


class ModuleBase(BaseModel):
    id: str
    course_id: str
    title: str
    description: str
    order_index: int


class Module(ModuleBase):
    lessons: List[Lesson] = []
    progress: Optional[float] = None
    
    class Config:
        from_attributes = True


class GraphNodeBase(BaseModel):
    id: str
    type: NodeType
    entity_id: str
    title: str
    x: float
    y: float
    status: Optional[NodeStatus] = None
    size: Optional[int] = 40


class GraphNode(GraphNodeBase):
    class Config:
        from_attributes = True


class GraphEdgeBase(BaseModel):
    id: str
    source_id: str
    target_id: str
    type: EdgeType


class GraphEdge(GraphEdgeBase):
    class Config:
        from_attributes = True


class SubmissionCreate(BaseModel):
    assignment_id: str
    text_answer: Optional[str] = None
    link_url: Optional[str] = None
    file_urls: Optional[List[str]] = []


class SubmissionUpdate(BaseModel):
    text_answer: Optional[str] = None
    link_url: Optional[str] = None
    file_urls: Optional[List[str]] = []


class Submission(BaseModel):
    id: str
    assignment_id: str
    user_id: str
    version: int
    text_answer: Optional[str] = None
    link_url: Optional[str] = None
    file_urls: List[str] = []
    status: SubmissionStatus
    curator_comment: Optional[str] = None
    submitted_at: Optional[datetime] = None
    reviewed_at: Optional[datetime] = None
    created_at: datetime
    
    class Config:
        from_attributes = True


class NotificationBase(BaseModel):
    id: str
    type: NotificationType
    title: str
    message: str
    is_read: bool
    related_url: Optional[str] = None
    created_at: datetime


class Notification(NotificationBase):
    user_id: str
    
    class Config:
        from_attributes = True


# User schemas
class UserBase(BaseModel):
    email: EmailStr
    username: str
    full_name: Optional[str] = None


class UserCreate(UserBase):
    password: str


class UserLogin(BaseModel):
    username: str
    password: str


class User(UserBase):
    id: str
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    username: Optional[str] = None

