from sqlalchemy import Column, String, Integer, Float, ForeignKey, DateTime, Boolean, Text, Enum as SQLEnum, Table, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base
import enum


# Enums
class TrackIdEnum(enum.Enum):
    event = "event"
    digital = "digital"
    communication = "communication"
    design = "design"


class CourseLevel(enum.Enum):
    beginner = "beginner"
    intermediate = "intermediate"
    advanced = "advanced"


class CourseStatus(enum.Enum):
    not_started = "not_started"
    in_progress = "in_progress"
    completed = "completed"


class NodeType(enum.Enum):
    track = "track"
    course = "course"
    module = "module"
    lesson = "lesson"
    concept = "concept"


class NodeStatus(enum.Enum):
    completed = "completed"
    current = "current"
    open = "open"
    closed = "closed"


class EdgeType(enum.Enum):
    required = "required"
    alternative = "alternative"
    recommended = "recommended"


class SubmissionStatus(enum.Enum):
    not_submitted = "not_submitted"
    pending = "pending"
    accepted = "accepted"
    needs_revision = "needs_revision"


class NotificationType(enum.Enum):
    submission_reviewed = "submission_reviewed"
    new_branch_unlocked = "new_branch_unlocked"
    reminder = "reminder"


class UserRole(enum.Enum):
    student = "student"
    teacher = "teacher"
    admin = "admin"


# Models
class User(Base):
    __tablename__ = "users"
    
    id = Column(String, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    is_active = Column(Boolean, default=True)
    role = Column(SQLEnum(UserRole), default=UserRole.student, nullable=False)
    
    # Relationships
    submissions = relationship("Submission", back_populates="user")
    notifications = relationship("Notification", back_populates="user")
    user_courses = relationship("UserCourse", back_populates="user")
    user_lessons = relationship("UserLesson", back_populates="user")
    created_courses = relationship("Course", foreign_keys="Course.created_by_id")


class Track(Base):
    __tablename__ = "tracks"
    
    id = Column(SQLEnum(TrackIdEnum), primary_key=True)
    name = Column(String, nullable=False)
    description = Column(Text)
    color = Column(String)
    
    # Relationships
    courses = relationship("Course", back_populates="track")


class Course(Base):
    __tablename__ = "courses"
    
    id = Column(String, primary_key=True, index=True)
    track_id = Column(SQLEnum(TrackIdEnum), ForeignKey("tracks.id"), nullable=False, index=True)
    title = Column(String, nullable=False)
    version = Column(String)
    description = Column(Text)
    short_description = Column(Text)
    level = Column(SQLEnum(CourseLevel), nullable=False)
    module_count = Column(Integer, default=0)
    lesson_count = Column(Integer, default=0)
    task_count = Column(Integer, default=0)
    enrollment_deadline = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    status = Column(String, default='draft', index=True)  # draft, published, archived
    created_by_id = Column(String, ForeignKey('users.id'), index=True)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    published_at = Column(DateTime(timezone=True))
    
    # Relationships
    track = relationship("Track", back_populates="courses")
    modules = relationship("Module", back_populates="course", cascade="all, delete-orphan")
    authors = relationship("CourseAuthor", back_populates="course", cascade="all, delete-orphan")
    user_courses = relationship("UserCourse", back_populates="course")
    created_by = relationship("User", foreign_keys=[created_by_id])


class CourseAuthor(Base):
    __tablename__ = "course_authors"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    course_id = Column(String, ForeignKey("courses.id", ondelete="CASCADE"), nullable=False, index=True)
    author_name = Column(String, nullable=False)
    
    # Relationships
    course = relationship("Course", back_populates="authors")


class UserCourse(Base):
    """Progress пользователя по курсу"""
    __tablename__ = "user_courses"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    course_id = Column(String, ForeignKey("courses.id", ondelete="CASCADE"), nullable=False, index=True)
    status = Column(SQLEnum(CourseStatus), default=CourseStatus.not_started)
    progress = Column(Float, default=0.0)
    started_at = Column(DateTime(timezone=True))
    completed_at = Column(DateTime(timezone=True))
    
    # Relationships
    user = relationship("User", back_populates="user_courses")
    course = relationship("Course", back_populates="user_courses")
    
    __table_args__ = (
        # Один пользователь может иметь только одну запись прогресса по курсу
        UniqueConstraint('user_id', 'course_id', name='unique_user_course'),
    )


class Module(Base):
    __tablename__ = "modules"
    
    id = Column(String, primary_key=True, index=True)
    course_id = Column(String, ForeignKey("courses.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String, nullable=False)
    description = Column(Text)
    order_index = Column(Integer, default=0)
    prerequisites = Column(Text)  # JSON array of module IDs
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    course = relationship("Course", back_populates="modules")
    lessons = relationship("Lesson", back_populates="module", cascade="all, delete-orphan")
    handbook = relationship("Handbook", back_populates="module", uselist=False, cascade="all, delete-orphan")


class Lesson(Base):
    __tablename__ = "lessons"
    
    id = Column(String, primary_key=True, index=True)
    module_id = Column(String, ForeignKey("modules.id", ondelete="SET NULL"), nullable=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text)
    video_url = Column(String)
    video_duration = Column(String)
    content = Column(Text)
    order_index = Column(Integer, default=0)
    content_type = Column(String, default='text')  # text, video, interactive, assignment
    tags = Column(Text)  # JSON array
    estimated_time = Column(Integer, default=0)  # minutes
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    module = relationship("Module", back_populates="lessons")
    handbook_excerpts = relationship("HandbookExcerpt", back_populates="lesson", cascade="all, delete-orphan")
    assignment = relationship("Assignment", back_populates="lesson", uselist=False, cascade="all, delete-orphan")
    user_lessons = relationship("UserLesson", back_populates="lesson")


class UserLesson(Base):
    """Progress пользователя по уроку"""
    __tablename__ = "user_lessons"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    lesson_id = Column(String, ForeignKey("lessons.id", ondelete="CASCADE"), nullable=False, index=True)
    status = Column(SQLEnum(CourseStatus), default=CourseStatus.not_started)
    completed_at = Column(DateTime(timezone=True))
    
    # Relationships
    user = relationship("User", back_populates="user_lessons")
    lesson = relationship("Lesson", back_populates="user_lessons")
    
    __table_args__ = (
        # Один пользователь может иметь только одну запись прогресса по уроку
        UniqueConstraint('user_id', 'lesson_id', name='unique_user_lesson'),
    )




class Handbook(Base):
    __tablename__ = "handbooks"
    
    id = Column(String, primary_key=True, index=True)
    module_id = Column(String, ForeignKey("modules.id", ondelete="CASCADE"), nullable=False, unique=True)
    title = Column(String, nullable=False)
    description = Column(Text)
    order_index = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    module = relationship("Module", back_populates="handbook")
    sections = relationship("HandbookSection", back_populates="handbook", cascade="all, delete-orphan")


class HandbookSection(Base):
    __tablename__ = "handbook_sections"
    
    id = Column(String, primary_key=True, index=True)
    handbook_id = Column(String, ForeignKey("handbooks.id", ondelete="CASCADE"), nullable=False, index=True)
    parent_section_id = Column(String, ForeignKey("handbook_sections.id"), nullable=True, index=True)
    title = Column(String, nullable=False)
    order_index = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    handbook = relationship("Handbook", back_populates="sections")
    parent = relationship("HandbookSection", remote_side="HandbookSection.id", backref="children")
    articles = relationship("HandbookArticle", back_populates="section", cascade="all, delete-orphan")


class HandbookArticle(Base):
    __tablename__ = "handbook_articles"
    
    id = Column(String, primary_key=True, index=True)
    section_id = Column(String, ForeignKey("handbook_sections.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String, nullable=False)
    content = Column(Text)
    tags = Column(Text)  # JSON array
    related_lessons = Column(Text)  # JSON array of lesson IDs
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    section = relationship("HandbookSection", back_populates="articles")

class HandbookExcerpt(Base):
    __tablename__ = "handbook_excerpts"
    
    id = Column(String, primary_key=True, index=True)
    lesson_id = Column(String, ForeignKey("lessons.id", ondelete="CASCADE"), nullable=False, index=True)
    section_title = Column(String, nullable=False)
    excerpt = Column(Text)
    full_section_id = Column(String)
    
    # Relationships
    lesson = relationship("Lesson", back_populates="handbook_excerpts")


class Assignment(Base):
    __tablename__ = "assignments"
    
    id = Column(String, primary_key=True, index=True)
    lesson_id = Column(String, ForeignKey("lessons.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    description = Column(Text)
    criteria = Column(Text)
    requires_text = Column(Boolean, default=False)
    requires_file = Column(Boolean, default=False)
    requires_link = Column(Boolean, default=False)
    
    # Relationships
    lesson = relationship("Lesson", back_populates="assignment")
    submissions = relationship("Submission", back_populates="assignment", cascade="all, delete-orphan")


class Submission(Base):
    __tablename__ = "submissions"
    
    id = Column(String, primary_key=True, index=True)
    assignment_id = Column(String, ForeignKey("assignments.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    version = Column(Integer, default=1)
    text_answer = Column(Text)
    link_url = Column(String)
    status = Column(SQLEnum(SubmissionStatus), default=SubmissionStatus.not_submitted, index=True)
    curator_comment = Column(Text)
    submitted_at = Column(DateTime(timezone=True))
    reviewed_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    assignment = relationship("Assignment", back_populates="submissions")
    user = relationship("User", back_populates="submissions")
    files = relationship("SubmissionFile", back_populates="submission", cascade="all, delete-orphan")


class SubmissionFile(Base):
    __tablename__ = "submission_files"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    submission_id = Column(String, ForeignKey("submissions.id", ondelete="CASCADE"), nullable=False, index=True)
    file_url = Column(String, nullable=False)
    
    # Relationships
    submission = relationship("Submission", back_populates="files")


class GraphNode(Base):
    __tablename__ = "graph_nodes"
    
    id = Column(String, primary_key=True, index=True)
    type = Column(SQLEnum(NodeType), nullable=False, index=True)
    entity_id = Column(String, nullable=False, index=True)
    title = Column(String, nullable=False)
    x = Column(Float, nullable=False)
    y = Column(Float, nullable=False)
    status = Column(SQLEnum(NodeStatus), index=True)
    size = Column(Integer, default=40)
    # Note: created_at and updated_at removed as they don't exist in the database table
    
    # Relationships
    outgoing_edges = relationship(
        "GraphEdge",
        foreign_keys="GraphEdge.source_id",
        back_populates="source",
        cascade="all, delete-orphan"
    )
    incoming_edges = relationship(
        "GraphEdge",
        foreign_keys="GraphEdge.target_id",
        back_populates="target",
        cascade="all, delete-orphan"
    )


class GraphEdge(Base):
    __tablename__ = "graph_edges"
    
    id = Column(String, primary_key=True, index=True)
    source_id = Column(String, ForeignKey("graph_nodes.id", ondelete="CASCADE"), nullable=False, index=True)
    target_id = Column(String, ForeignKey("graph_nodes.id", ondelete="CASCADE"), nullable=False, index=True)
    type = Column(SQLEnum(EdgeType), nullable=False)
    # Note: created_at removed as it doesn't exist in the database table
    
    # Relationships
    source = relationship("GraphNode", foreign_keys=[source_id], back_populates="outgoing_edges")
    target = relationship("GraphNode", foreign_keys=[target_id], back_populates="incoming_edges")
    
    __table_args__ = (
        # Уникальная связь между двумя узлами (один source -> один target)
        UniqueConstraint('source_id', 'target_id', name='unique_graph_edge'),
    )


class Notification(Base):
    __tablename__ = "notifications"
    
    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    type = Column(SQLEnum(NotificationType), nullable=False, index=True)
    title = Column(String, nullable=False)
    message = Column(Text)
    is_read = Column(Boolean, default=False, index=True)
    related_url = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    user = relationship("User", back_populates="notifications")







