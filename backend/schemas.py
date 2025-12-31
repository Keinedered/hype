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


class UserRole(str, Enum):
    student = "student"
    teacher = "teacher"
    admin = "admin"


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
    status: Optional[str] = 'draft'  # draft, published, archived
    
    class Config:
        from_attributes = True


class CourseWithProgress(Course):
    progress: Optional[float] = None
    status: Optional[CourseStatus] = None


class HandbookExcerptBase(BaseModel):
    id: str
    section_title: str
    excerpt: Optional[str] = None
    full_section_id: Optional[str] = None


class HandbookExcerpt(HandbookExcerptBase):
    lesson_id: str
    
    class Config:
        from_attributes = True


class AssignmentBase(BaseModel):
    id: str
    description: Optional[str] = None
    criteria: Optional[str] = None
    requires_text: bool = False
    requires_file: bool = False
    requires_link: bool = False


class Assignment(AssignmentBase):
    lesson_id: str
    
    class Config:
        from_attributes = True


class LessonBase(BaseModel):
    id: str
    module_id: Optional[str] = None  # Опционально - урок может быть без модуля
    title: str
    description: Optional[str] = None
    video_url: Optional[str] = None
    video_duration: Optional[str] = None
    content: Optional[str] = None
    order_index: int = 0
    content_type: Optional[str] = "text"
    tags: Optional[str] = None
    estimated_time: Optional[int] = 0
    status: Optional[str] = 'draft'  # draft, published, archived
    published_at: Optional[datetime] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class Lesson(LessonBase):
    handbook_excerpts: List[HandbookExcerpt] = []
    assignment: Optional[Assignment] = None
    
    class Config:
        from_attributes = True


class ModuleBase(BaseModel):
    id: str
    course_id: str
    title: str
    description: Optional[str] = ""
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
    role: UserRole
    created_at: datetime
    
    class Config:
        from_attributes = True


class UserUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    role: Optional[UserRole] = None
    is_active: Optional[bool] = None


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    username: Optional[str] = None


class CourseProgressUpdate(BaseModel):
    progress: float
    status: CourseStatus


class LessonProgressUpdate(BaseModel):
    status: CourseStatus





# Admin schemas for creating/updating entities

class TrackCreate(BaseModel):
    id: TrackId
    name: str
    description: str
    color: str


class CourseCreate(BaseModel):
    id: str
    track_id: TrackId
    title: str
    version: str = "1.0"
    description: str
    short_description: str
    level: CourseLevel
    enrollment_deadline: Optional[str] = None
    authors: List[str] = []


class CourseUpdate(BaseModel):
    track_id: Optional[TrackId] = None
    title: Optional[str] = None
    version: Optional[str] = None
    description: Optional[str] = None
    short_description: Optional[str] = None
    level: Optional[CourseLevel] = None
    enrollment_deadline: Optional[str] = None
    status: Optional[str] = None
    authors: Optional[List[str]] = None


class ModuleCreate(BaseModel):
    id: str
    course_id: str
    title: str
    description: str
    order_index: int = 0
    prerequisites: Optional[str] = None


class ModuleUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    order_index: Optional[int] = None
    prerequisites: Optional[str] = None


class LessonCreate(BaseModel):
    id: str
    module_id: Optional[str] = None  # Опционально - можно создать урок без модуля
    title: str
    description: str
    content: str
    video_url: Optional[str] = None
    video_duration: Optional[str] = None
    order_index: int = 0
    content_type: str = "text"
    tags: Optional[str] = None
    estimated_time: int = 0


class LessonUpdate(BaseModel):
    module_id: Optional[str] = None  # Можно изменить или установить module_id
    title: Optional[str] = None
    description: Optional[str] = None
    content: Optional[str] = None
    video_url: Optional[str] = None
    video_duration: Optional[str] = None
    order_index: Optional[int] = None
    content_type: Optional[str] = None
    tags: Optional[str] = None
    estimated_time: Optional[int] = None


class GraphNodeCreate(BaseModel):
    id: str
    type: NodeType
    entity_id: str
    title: str
    x: float
    y: float
    status: Optional[NodeStatus] = None
    size: int = 40


class GraphNodeUpdate(BaseModel):
    x: Optional[float] = None
    y: Optional[float] = None
    title: Optional[str] = None
    status: Optional[NodeStatus] = None
    size: Optional[int] = None


class GraphEdgeCreate(BaseModel):
    id: str
    source_id: str
    target_id: str
    type: EdgeType


class HandbookCreate(BaseModel):
    id: str
    module_id: str
    title: str
    description: str
    order_index: int = 0


class HandbookUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    order_index: Optional[int] = None


class HandbookSectionCreate(BaseModel):
    id: str
    handbook_id: str
    parent_section_id: Optional[str] = None
    title: str
    order_index: int = 0


class HandbookSectionUpdate(BaseModel):
    title: Optional[str] = None
    order_index: Optional[int] = None
    parent_section_id: Optional[str] = None


class HandbookArticleCreate(BaseModel):
    id: str
    section_id: str
    title: str
    content: str
    tags: Optional[str] = None
    related_lessons: Optional[str] = None


class HandbookArticleUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    tags: Optional[str] = None
    related_lessons: Optional[str] = None


class AssignmentCreate(BaseModel):
    id: str
    lesson_id: str
    description: Optional[str] = ""
    criteria: Optional[str] = ""
    requires_text: bool = False
    requires_file: bool = False
    requires_link: bool = False


class AssignmentUpdate(BaseModel):
    description: Optional[str] = None
    criteria: Optional[str] = None
    requires_text: Optional[bool] = None
    requires_file: Optional[bool] = None
    requires_link: Optional[bool] = None
