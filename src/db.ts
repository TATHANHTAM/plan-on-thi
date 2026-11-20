import Dexie, { type EntityTable } from 'dexie';
import type { BackupData, Chapter, Exam, Review, ReviewAttempt, StudySession, StudyTask, Subject, UserSettings } from './types';
import { chapters, exams, PLAN_VERSION, subjects, tasks } from './data/seed';

class StudyDB extends Dexie {
  subjects!: EntityTable<Subject, 'id'>;
  chapters!: EntityTable<Chapter, 'id'>;
  tasks!: EntityTable<StudyTask, 'id'>;
  exams!: EntityTable<Exam, 'id'>;
  reviews!: EntityTable<Review, 'id'>;
  reviewAttempts!: EntityTable<ReviewAttempt, 'id'>;
  sessions!: EntityTable<StudySession, 'id'>;
  settings!: EntityTable<UserSettings, 'id'>;
  constructor() {
    super('study-tracker-v1');
    this.version(1).stores({
      subjects: 'id', chapters: 'id, subjectId, stage', tasks: 'id, date, subjectId, priority, status', exams: 'id, date, subjectId, kind',
      reviews: 'id, dueDate, chapterId, subjectId, status', reviewAttempts: 'id, reviewId, chapterId, completedAt', sessions: 'id, taskId, subjectId, startedAt', settings: 'id',
    });
  }
}

export const db = new StudyDB();

export async function ensureSeeded() {
  const settings = await db.settings.get('settings');
  if (!settings) {
    await db.transaction('rw', db.subjects, db.chapters, db.tasks, db.exams, db.settings, async () => {
      await db.subjects.bulkPut(subjects);
      await db.chapters.bulkPut(chapters);
      await db.tasks.bulkPut(tasks);
      await db.exams.bulkPut(exams);
      await db.settings.put({ id: 'settings', energyMode: 'green', darkMode: false, currentView: 'overview', seededVersion: PLAN_VERSION });
    });
  }
}

export async function exportAll(): Promise<BackupData> {
  return { version: 1, exportedAt: new Date().toISOString(), subjects: await db.subjects.toArray(), chapters: await db.chapters.toArray(), tasks: await db.tasks.toArray(), exams: await db.exams.toArray(), reviews: await db.reviews.toArray(), reviewAttempts: await db.reviewAttempts.toArray(), sessions: await db.sessions.toArray(), settings: await db.settings.toArray() };
}

export function validateBackup(value: unknown): value is BackupData {
  if (!value || typeof value !== 'object') return false;
  const data = value as Partial<BackupData>;
  return data.version === 1 && ['subjects','chapters','tasks','exams','reviews','reviewAttempts','sessions','settings'].every((k) => Array.isArray(data[k as keyof BackupData]));
}

export async function importAll(data: BackupData, mode: 'replace' | 'merge') {
  await db.transaction('rw', [db.subjects, db.chapters, db.tasks, db.exams, db.reviews, db.reviewAttempts, db.sessions, db.settings], async () => {
    if (mode === 'replace') await Promise.all([db.subjects.clear(),db.chapters.clear(),db.tasks.clear(),db.exams.clear(),db.reviews.clear(),db.reviewAttempts.clear(),db.sessions.clear(),db.settings.clear()]);
    await db.subjects.bulkPut(data.subjects); await db.chapters.bulkPut(data.chapters); await db.tasks.bulkPut(data.tasks); await db.exams.bulkPut(data.exams);
    await db.reviews.bulkPut(data.reviews); await db.reviewAttempts.bulkPut(data.reviewAttempts); await db.sessions.bulkPut(data.sessions); await db.settings.bulkPut(data.settings);
  });
}

export async function resetScheduleOnly() {
  await db.transaction('rw', db.tasks, db.exams, async () => {
    const existing = new Map((await db.tasks.bulkGet(tasks.map(task => task.id))).filter(Boolean).map(task => [task!.id, task!]));
    await db.tasks.bulkPut(tasks.map(seed => {
      const current = existing.get(seed.id);
      return current ? { ...seed, status: current.status, completedAt: current.completedAt } : seed;
    }));
    await db.exams.clear(); await db.exams.bulkPut(exams);
  });
}

export async function resetEverything() { await db.delete(); window.location.reload(); }
