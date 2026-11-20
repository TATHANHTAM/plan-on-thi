import { useCallback, useEffect, useState } from 'react';
import { db, ensureSeeded } from '../db';
import type { Chapter, EnergyMode, Exam, Review, ReviewResponse, StudySession, StudyTask, Subject, UserSettings } from '../types';
import { todayISO, addDays } from '../utils/date';
import { createReviewCycle } from '../utils/study';

export interface StudyData {
  subjects: Subject[]; chapters: Chapter[]; tasks: StudyTask[]; exams: Exam[]; reviews: Review[]; sessions: StudySession[]; settings: UserSettings;
}

const emptySettings: UserSettings = { id:'settings', energyMode:'green', darkMode:false, currentView:'overview', seededVersion:1 };

export function useStudyData() {
  const [data, setData] = useState<StudyData>({ subjects:[], chapters:[], tasks:[], exams:[], reviews:[], sessions:[], settings:emptySettings });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    try {
      const [subjects, chapters, tasks, exams, reviews, sessions, settings] = await Promise.all([db.subjects.toArray(), db.chapters.toArray(), db.tasks.toArray(), db.exams.toArray(), db.reviews.toArray(), db.sessions.toArray(), db.settings.get('settings')]);
      setData({ subjects, chapters, tasks, exams, reviews, sessions, settings: settings ?? emptySettings });
    } catch (e) { setError(e instanceof Error ? e.message : 'Không thể đọc dữ liệu cục bộ.'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { ensureSeeded().then(refresh).catch((e) => { setError(String(e)); setLoading(false); }); }, [refresh]);

  const updateTask = async (id: string, updates: Partial<StudyTask>) => {
    const original = await db.tasks.get(id); if (!original) return;
    const next = { ...updates };
    if (updates.status === 'completed' && original.status !== 'completed') next.completedAt = new Date().toISOString();
    await db.tasks.update(id, next);
    if (updates.status === 'completed' && original.sourceNote === 'relearning' && original.chapterId) {
      const completionDate = todayISO();
      const chapter = await db.chapters.get(original.chapterId);
      if (chapter) {
        await db.chapters.update(chapter.id, { stage:'first-pass', weak:true, firstCompletedAt:completionDate });
        await db.reviews.bulkPut(createReviewCycle(chapter.id, chapter.subjectId, completionDate));
      }
    }
    await refresh();
  };

  const createTask = async (input: Omit<StudyTask,'id'|'createdAt'|'isCustom'|'status'>) => {
    await db.tasks.add({ ...input, id:`custom-${crypto.randomUUID()}`, createdAt:new Date().toISOString(), isCustom:true, status:'todo' }); await refresh();
  };
  const deleteTask = async (task: StudyTask) => { if (!task.isCustom || task.status === 'completed') throw new Error('Không thể xóa nhiệm vụ nguồn hoặc lịch sử đã hoàn thành.'); await db.tasks.delete(task.id); await refresh(); };

  const updateChapter = async (chapter: Chapter, updates: Partial<Chapter>) => {
    const completionDate = todayISO();
    if (updates.stage === 'first-pass' && chapter.stage !== 'first-pass') {
      updates.firstCompletedAt = completionDate;
      const cycle = createReviewCycle(chapter.id, chapter.subjectId, completionDate);
      await db.reviews.bulkPut(cycle);
    }
    await db.chapters.update(chapter.id, updates); await refresh();
  };

  const respondToReview = async (review: Review, response: ReviewResponse) => {
    const completedAt = new Date().toISOString();
    await db.transaction('rw', db.reviews, db.reviewAttempts, db.chapters, db.tasks, async () => {
      await db.reviews.update(review.id, { status:'completed', completedAt, response });
      await db.reviewAttempts.put({ id:`attempt-${crypto.randomUUID()}`, reviewId:review.id, chapterId:review.chapterId, response, completedAt });
      if (response === 'partial') {
        await db.chapters.update(review.chapterId, { weak:true, stage:'practicing' });
        await db.tasks.put({ id:`targeted-${review.id}`, subjectId:review.subjectId, chapterId:review.chapterId, title:'Ôn ngắn phần còn yếu', description:'Ôn có mục tiêu từ kết quả “Nhớ một phần”.', date:addDays(todayISO(),1), estimatedBlocks:0.5, priority:'SHOULD', status:'todo', isCustom:true, parentTaskId:review.id, sourceNote:'targeted-review', createdAt:completedAt });
      } else if (response === 'forgot') {
        await db.chapters.update(review.chapterId, { weak:true, stage:'review-needed' });
        await db.tasks.put({ id:`relearn-${review.id}`, subjectId:review.subjectId, chapterId:review.chapterId, title:'Học lại chương', description:'Nhiệm vụ được tạo do kết quả “Quên gần hết”. Hoàn thành để bắt đầu lại chu kỳ ôn.', date:addDays(todayISO(),1), estimatedBlocks:1, priority:'MUST', status:'todo', isCustom:true, parentTaskId:review.id, sourceNote:'relearning', createdAt:completedAt });
      }
    }); await refresh();
  };

  const updateSettings = async (updates: Partial<UserSettings>) => { await db.settings.update('settings', updates); await refresh(); };
  const setEnergy = (energyMode: EnergyMode) => updateSettings({ energyMode });
  const addSession = async (session: Omit<StudySession,'id'>) => { await db.sessions.add({ ...session, id:`session-${crypto.randomUUID()}` }); await refresh(); };

  return { data, loading, error, refresh, updateTask, createTask, deleteTask, updateChapter, respondToReview, updateSettings, setEnergy, addSession };
}
