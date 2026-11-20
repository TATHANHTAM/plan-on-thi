import { useMemo, useState } from 'react';
import type { StudyData } from '../hooks/useStudyData';
import type { StudyTask } from '../types';
import { addDays, todayISO } from '../utils/date';
import { CAPACITY, priorityRank } from '../utils/study';
import { Modal } from './Modal';
import { fixedCommitments } from '../data/seed';

export function CatchUpModal({data,onClose,onApply}:{data:StudyData;onClose:()=>void;onApply:(moves:{task:StudyTask;date:string}[])=>Promise<void>}) {
  const [applying,setApplying]=useState(false); const today=todayISO();
  const moves=useMemo(()=>{
    if (data.settings.energyMode === 'red') return [];
    const unfinished=data.tasks.filter(t=>t.date<today&&t.status!=='completed'&&t.status!=='skipped'&&t.priority!=='BONUS').sort((a,b)=>priorityRank(a.priority)-priorityRank(b.priority)||a.date.localeCompare(b.date));
    const load=new Map<string,number>(); data.tasks.filter(t=>t.date>=today&&t.status!=='completed').forEach(t=>load.set(t.date,(load.get(t.date)||0)+t.estimatedBlocks));
    return unfinished.flatMap(task=>{let date=addDays(today,1);for(let i=0;i<30;i++){const examDay=data.exams.some(e=>e.kind==='exam'&&e.date===date);const fixedDay=fixedCommitments.some(e=>e.date===date);const base=CAPACITY[data.settings.energyMode];const limit=examDay?Math.min(2,base):fixedDay?Math.max(1,base-1):base;if((load.get(date)||0)+task.estimatedBlocks<=limit){load.set(date,(load.get(date)||0)+task.estimatedBlocks);return[{task,date}];}date=addDays(date,1);}return[];});
  },[data,today]);
  const should=moves.filter(m=>m.task.priority==='SHOULD');
  return <Modal title="Gợi ý xử lý lịch trễ" onClose={onClose} wide><p className="text-sm text-slate-600 dark:text-slate-300">Quy tắc giữ nguyên ngày thi và mốc cố định, bỏ BONUS khỏi đề xuất, ưu tiên MUST và không dồn tất cả sang ngày mai. Chỉ thay đổi sau khi bạn xác nhận.</p>{moves.length===0?<div className="my-6 rounded-xl bg-emerald-50 p-4 text-emerald-800">{data.settings.energyMode==='red'?'Ngày Red không tự tạo lịch đầy: chỉ học 25 phút hoặc nghỉ. Hãy đổi năng lượng khi sẵn sàng để xem gợi ý dời lịch.':'Không có nhiệm vụ quá hạn phù hợp để dời trong 30 ngày tới.'}</div>:<div className="mt-5 space-y-2">{moves.map(m=><div key={m.task.id} className="grid gap-2 rounded-xl border border-slate-200 p-3 dark:border-slate-800 sm:grid-cols-[1fr_auto]"><div><span className={`mr-2 rounded px-1.5 py-0.5 text-xs font-bold ${m.task.priority==='MUST'?'bg-rose-100 text-rose-700':'bg-amber-100 text-amber-700'}`}>{m.task.priority}</span><span className="font-semibold text-slate-800 dark:text-slate-100">{m.task.title}</span><p className="mt-1 text-xs text-slate-500">Từ {m.task.date} · {m.task.estimatedBlocks} khối</p></div><div className="self-center rounded-lg bg-slate-100 px-3 py-2 text-sm font-semibold dark:bg-slate-800">Dời đến {m.date}</div></div>)}</div>} {should.length>0&&<p className="mt-4 text-sm text-amber-700">Có {should.length} nhiệm vụ SHOULD trong đề xuất; cân nhắc bỏ qua nếu năng lượng thấp.</p>}<div className="mt-5 flex justify-end gap-2"><button className="btn-ghost" onClick={onClose}>Để tôi tự chỉnh</button><button className="btn bg-blue-600 text-white disabled:opacity-50" disabled={!moves.length||applying} onClick={async()=>{setApplying(true);await onApply(moves);setApplying(false);onClose();}}>{applying?'Đang áp dụng…':'Xác nhận áp dụng'}</button></div></Modal>;
}
