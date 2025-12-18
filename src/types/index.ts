export type TrackId = 'event' | 'digital' | 'communication' | 'design';

export interface Track {
  id: TrackId;
  name: string;
  description: string;
  color: string;
}

export interface Course {
  id: string;
  trackId: TrackId;
  title: string;
  version: string;
  description: string;
  shortDescription: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  moduleCount: number;
  lessonCount: number;
  taskCount: number;
  authors: string[];
  enrollmentDeadline?: string;
  progress?: number;
  status?: 'not_started' | 'in_progress' | 'completed';
}

export interface Module {
  id: string;
  courseId: string;
  title: string;
  description: string;
  lessons: Lesson[];
  progress?: number;
}

export interface Lesson {
  id: string;
  moduleId: string;
  title: string;
  description: string;
  videoUrl?: string;
  videoDuration?: string;
  content: string;
  handbookExcerpts: HandbookExcerpt[];
  assignment: Assignment;
  status?: 'not_started' | 'in_progress' | 'completed';
}

export interface HandbookExcerpt {
  id: string;
  sectionTitle: string;
  excerpt: string;
  fullSectionId: string;
}

export interface Assignment {
  id: string;
  lessonId: string;
  description: string;
  criteria: string;
  requiresText: boolean;
  requiresFile: boolean;
  requiresLink: boolean;
}

export interface Submission {
  id: string;
  assignmentId: string;
  userId: string;
  version: number;
  textAnswer?: string;
  fileUrls?: string[];
  linkUrl?: string;
  status: 'not_submitted' | 'pending' | 'accepted' | 'needs_revision';
  curatorComment?: string;
  submittedAt?: Date;
  reviewedAt?: Date;
}

export interface GraphNode {
  id: string;
  type: 'track' | 'course' | 'module' | 'lesson' | 'concept';
  entityId: string;
  title: string;
  x: number;
  y: number;
  status?: 'locked' | 'available' | 'current' | 'completed';
  size?: number;
}

export interface GraphEdge {
  id: string;
  sourceId: string;
  targetId: string;
  type: 'required' | 'alternative' | 'recommended';
}

export interface Notification {
  id: string;
  userId: string;
  type: 'submission_reviewed' | 'new_branch_unlocked' | 'reminder';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
  relatedUrl?: string;
}
