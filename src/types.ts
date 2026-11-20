export type Priority = 'MUST' | 'SHOULD' | 'BONUS';
export type TaskStatus = 'todo' | 'in-progress' | 'completed' | 'rescheduled' | 'skipped';
export type ChapterStage = 'not-started' | 'learning' | 'first-pass' | 'practicing' | 'review-needed' | 'exam-ready';
export type EnergyMode = 'green' | 'yellow' | 'red';
export type ReviewResponse = 'good' | 'partial' | 'forgot';

export interface Subject { id: string; name: string; shortName: string; color: string; initialAssessment: number | null; initialAssessmentLabel?: string; note?: string; }
export interface Chapter { id: string; subjectId: string; name: string; order: number; stage: ChapterStage; weak: boolean; firstCompletedAt?: string; }
export interface StudyTask { id: string; subjectId: string; chapterId?: string; title: string; description: string; date: string; estimatedBlocks: number; priority: Priority; status: TaskStatus; isCustom: boolean; sourceNote?: string; completedAt?: string; createdAt: string; parentTaskId?: string; }
export interface Exam { id: string; subjectId?: string; title: string; date: string; time: string; durationMinutes?: number; kind: 'exam' | 'mock' | 'fixed'; note?: string; }
export interface Review { id: string; chapterId: string; subjectId: string; dueDate: string; offsetDays: 1 | 3 | 7 | 14; status: 'pending' | 'completed'; createdFrom: string; completedAt?: string; response?: ReviewResponse; }
export interface ReviewAttempt { id: string; reviewId: string; chapterId: string; response: ReviewResponse; completedAt: string; note?: string; }
export interface StudySession { id: string; taskId?: string; subjectId?: string; startedAt: string; endedAt: string; actualMinutes: number; exercisesAttempted?: number; correctAnswers?: number; mistakes?: string; notes?: string; }
export interface UserSettings { id: 'settings'; energyMode: EnergyMode; darkMode: boolean; currentView: string; seededVersion: number; }
export interface FixedCommitment { id: string; title: string; date: string; time?: string; note?: string; }
export interface BackupData { version: number; exportedAt: string; subjects: Subject[]; chapters: Chapter[]; tasks: StudyTask[]; exams: Exam[]; reviews: Review[]; reviewAttempts: ReviewAttempt[]; sessions: StudySession[]; settings: UserSettings[]; }
