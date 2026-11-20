import { Check, Clock3, Play, Trash2 } from 'lucide-react';
import type { StudyTask, Subject } from '../types';
import { statusLabel } from '../utils/study';

interface Props { task: StudyTask; subject?: Subject; onUpdate: (id:string, updates:Partial<StudyTask>)=>void; onDelete?: (task:StudyTask)=>void; compact?: boolean; }

export function TaskCard({ task, subject, onUpdate, onDelete, compact }: Props) {
  const completed = task.status === 'completed';
  return <article className={`rounded-2xl border p-4 transition ${completed ? 'border-emerald-200 bg-emerald-50/70 dark:border-emerald-900 dark:bg-emerald-950/20' : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900'}`}>
    <div className="flex items-start gap-3">
      <span className="mt-1 h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: subject?.color ?? '#64748b' }} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold" style={{ color: subject?.color }}>{subject?.shortName ?? 'Khác'}</span>
          <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${task.priority === 'MUST' ? 'bg-rose-100 text-rose-700' : task.priority === 'SHOULD' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>{task.priority}</span>
          <span className="text-xs text-slate-500">{statusLabel(task.status)}</span>
        </div>
        <h3 className={`mt-1 font-semibold leading-snug ${completed ? 'text-slate-500 line-through' : 'text-slate-900 dark:text-white'}`}>{task.title}</h3>
        {!compact && task.description !== task.title && <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{task.description}</p>}
        <div className="mt-2 flex items-center gap-1 text-sm text-slate-500"><Clock3 size={15}/>{task.estimatedBlocks} khối</div>
      </div>
    </div>
    <div className="mt-3 flex flex-wrap gap-2 pl-6">
      {!completed && task.status !== 'in-progress' && <button className="btn-secondary !min-h-9 !px-3 !text-sm" onClick={()=>onUpdate(task.id,{status:'in-progress'})}><Play size={15}/>Bắt đầu</button>}
      {!completed && <button className="btn-secondary !min-h-9 !px-3 !text-sm" onClick={()=>onUpdate(task.id,{status:'completed'})}><Check size={15}/>Hoàn thành</button>}
      {!completed && <button className="btn-ghost !min-h-9 !px-3 !text-sm" onClick={()=>{ const date=window.prompt('Dời sang ngày nào? (YYYY-MM-DD)',task.date); if(date && /^\d{4}-\d{2}-\d{2}$/.test(date)) onUpdate(task.id,{date,status:'rescheduled'}); }}>Dời lịch</button>}
      {compact && !completed && <button className="btn-ghost !min-h-9 !px-3 !text-sm" onClick={()=>{const title=window.prompt('Tên nhiệm vụ',task.title);if(title===null||!title.trim())return;const description=window.prompt('Mô tả',task.description);if(description===null)return;const blocks=window.prompt('Số khối (0.5–4)',String(task.estimatedBlocks));if(blocks===null)return;const value=Number(blocks);if(value>=0.5&&value<=4)onUpdate(task.id,{title:title.trim(),description,estimatedBlocks:value});}}>Chỉnh sửa</button>}
      {compact && !completed && <select aria-label="Mức ưu tiên" className="min-h-9 rounded-lg border border-slate-200 bg-white px-2 text-sm font-semibold dark:border-slate-700 dark:bg-slate-800" value={task.priority} onChange={e=>onUpdate(task.id,{priority:e.target.value as StudyTask['priority']})}><option>MUST</option><option>SHOULD</option><option>BONUS</option></select>}
      {compact && !completed && <button className="btn-ghost !min-h-9 !px-3 !text-sm" onClick={()=>onUpdate(task.id,{status:'skipped'})}>Bỏ qua</button>}
      {task.isCustom && !completed && onDelete && <button className="btn-ghost !min-h-9 !px-3 !text-sm text-rose-600" onClick={()=>onDelete(task)} aria-label="Xóa nhiệm vụ"><Trash2 size={15}/></button>}
    </div>
  </article>;
}
