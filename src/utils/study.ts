import type { EnergyMode, Review, StudyTask } from '../types';
import { addDays } from './date';

export const REVIEW_OFFSETS = [1, 3, 7, 14] as const;
export const CAPACITY: Record<EnergyMode, number> = { green: 4, yellow: 2, red: 0.5 };

export function createReviewCycle(chapterId: string, subjectId: string, completionDate: string): Review[] {
  return REVIEW_OFFSETS.map((offset) => ({ id: `review-${chapterId}-${completionDate}-${offset}`, chapterId, subjectId, dueDate: addDays(completionDate, offset), offsetDays: offset, status: 'pending', createdFrom: completionDate }));
}

export function priorityRank(p: StudyTask['priority']): number { return { MUST: 0, SHOULD: 1, BONUS: 2 }[p]; }
export function statusLabel(status: StudyTask['status']): string { return { todo: 'Chưa bắt đầu', 'in-progress': 'Đang học', completed: 'Hoàn thành', rescheduled: 'Dời lịch', skipped: 'Bỏ qua' }[status]; }
export function energyLabel(mode: EnergyMode): string { return { green: 'Green · Tối đa 4 khối', yellow: 'Yellow · Tối đa 2 khối', red: 'Red · 25 phút hoặc nghỉ' }[mode]; }
export function chapterStageLabel(stage: string): string { return ({ 'not-started': 'Chưa học', learning: 'Đang học', 'first-pass': 'Đã học lượt đầu', practicing: 'Đang luyện tập', 'review-needed': 'Cần ôn lại', 'exam-ready': 'Sẵn sàng thi' } as Record<string,string>)[stage] ?? stage; }
