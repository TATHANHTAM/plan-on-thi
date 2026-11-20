import { AlertTriangle, BatteryMedium, CalendarClock, CheckCircle2, ChevronRight, GraduationCap, RotateCcw } from 'lucide-react';
import type { StudyData } from '../hooks/useStudyData';
import type { EnergyMode, Review, ReviewResponse, StudyTask } from '../types';
import { CAPACITY, energyLabel } from '../utils/study';
import { daysBetween, formatDate, todayISO, weekdayLabel } from '../utils/date';
import { TaskCard } from './TaskCard';

interface Props { data:StudyData; updateTask:(id:string,u:Partial<StudyTask>)=>void; deleteTask:(t:StudyTask)=>void; setEnergy:(e:EnergyMode)=>void; respondToReview:(r:Review,response:ReviewResponse)=>void; onOpenTimer:()=>void; onCatchUp:()=>void; }

export function Overview({ data, updateTask, deleteTask, setEnergy, respondToReview, onOpenTimer, onCatchUp }: Props) {
  const today = todayISO();
  const priorityOrder = { MUST: 0, SHOULD: 1, BONUS: 2 };
  const todayTasks = data.tasks.filter(t=>t.date===today).sort((a,b)=>priorityOrder[a.priority]-priorityOrder[b.priority]);
  const planned = todayTasks.filter(t=>t.status!=='skipped').reduce((s,t)=>s+t.estimatedBlocks,0);
  const completed = todayTasks.filter(t=>t.status==='completed').reduce((s,t)=>s+t.estimatedBlocks,0);
  const cap = CAPACITY[data.settings.energyMode];
  const dueReviews = data.reviews.filter(r=>r.status==='pending' && r.dueDate<=today).sort((a,b)=>a.dueDate.localeCompare(b.dueDate));
  const upcoming = data.exams.filter(e=>e.kind==='exam' && e.date>=today).sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time)).slice(0,4);
  const groups = ['MUST','SHOULD','BONUS'] as const;

  return <div className="space-y-6">
    <section className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
      <div><p className="text-sm font-semibold uppercase tracking-wider text-teal-600">{weekdayLabel(today)}</p><h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950 dark:text-white">Hôm nay học gì?</h1><p className="mt-2 text-slate-600 dark:text-slate-300">Ưu tiên việc bắt buộc, giữ nhịp bền vững, không học bù khuya.</p></div>
      <div className="flex gap-2"><button className="btn-secondary" onClick={onCatchUp}><RotateCcw size={17}/>Tôi bị trễ lịch</button><button className="btn-secondary" onClick={onOpenTimer}><span className="h-2 w-2 rounded-full bg-rose-500"/>Bộ đếm tập trung</button></div>
    </section>

    {today>='2026-11-20' && today<='2026-11-22' && <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 text-blue-900 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-100"><strong>20–22/11: chỉ hoàn thành đồ án Python.</strong><p className="mt-1 text-sm">Lịch ôn thi bắt đầu 23/11. Ba ngày này không tạo nhiệm vụ quá hạn CTDL, XSTK hoặc Python ATTT.</p></div>}

    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Stat icon={<CalendarClock/>} label="Khối đã lên lịch" value={`${planned}`} note={`Trần hôm nay: ${cap}`} />
      <Stat icon={<CheckCircle2/>} label="Khối hoàn thành" value={`${completed}`} note={`${Math.max(0,planned-completed)} khối còn lại`} />
      <Stat icon={<RotateCcw/>} label="Lượt ôn đến hạn" value={`${dueReviews.length}`} note={dueReviews.some(r=>r.dueDate<today)?'Có lượt ôn quá hạn':'Không có ôn quá hạn'} warn={dueReviews.some(r=>r.dueDate<today)} />
      <Stat icon={<BatteryMedium/>} label="Năng lượng" value={data.settings.energyMode.toUpperCase()} note={energyLabel(data.settings.energyMode)} />
    </section>

    <section className="card p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="text-lg font-bold text-slate-900 dark:text-white">Chế độ năng lượng</h2><p className="text-sm text-slate-500">Tự chọn theo trạng thái thật của bạn.</p></div><div className="grid grid-cols-3 gap-2">{(['green','yellow','red'] as EnergyMode[]).map(e=><button key={e} onClick={()=>setEnergy(e)} className={`min-h-11 rounded-xl px-3 text-sm font-bold capitalize ${data.settings.energyMode===e ? e==='green'?'bg-emerald-600 text-white':e==='yellow'?'bg-amber-500 text-white':'bg-rose-600 text-white':'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}>{e}</button>)}</div></div>
      {planned>cap && <div className="mt-4 flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-950/30 dark:text-amber-100"><AlertTriangle className="shrink-0" size={18}/><span>Lịch đang vượt {planned-cap} khối so với năng lượng hiện tại. Hãy giữ MUST gần kỳ thi và cân nhắc dời SHOULD; ứng dụng sẽ không tự ý đổi lịch.</span></div>}
    </section>

    <div className="grid gap-6 xl:grid-cols-[1.45fr_1fr]">
      <section className="space-y-5"><div className="flex items-center justify-between"><h2 className="text-xl font-bold text-slate-900 dark:text-white">Nhiệm vụ hôm nay</h2><span className="text-sm text-slate-500">{todayTasks.filter(t=>t.status==='completed').length}/{todayTasks.length} việc</span></div>
        {todayTasks.length===0 && <Empty text="Hôm nay không có nhiệm vụ ôn thi trong kế hoạch." />}
        {groups.map(group=>{const list=todayTasks.filter(t=>t.priority===group); return list.length>0&&<div key={group}><div className="mb-2 flex items-center gap-2"><span className={`h-2 w-2 rounded-full ${group==='MUST'?'bg-rose-500':group==='SHOULD'?'bg-amber-500':'bg-slate-400'}`}/><h3 className="text-sm font-bold tracking-wide text-slate-600 dark:text-slate-300">{group}</h3><span className="text-xs text-slate-400">{list.length}</span></div><div className="space-y-3">{list.map(task=><TaskCard key={task.id} task={task} subject={data.subjects.find(s=>s.id===task.subjectId)} onUpdate={updateTask} onDelete={deleteTask}/>)}</div></div>})}
      </section>
      <aside className="space-y-6">
        <section className="card p-5"><div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-bold text-slate-900 dark:text-white">Ôn tập hôm nay</h2><RotateCcw className="text-teal-600" size={20}/></div>{dueReviews.length===0?<p className="text-sm text-slate-500">Chưa có lượt ôn đến hạn. Lịch +1/+3/+7/+14 được tạo khi bạn đánh dấu chương đã học lượt đầu.</p>:<div className="space-y-3">{dueReviews.slice(0,6).map(r=><ReviewItem key={r.id} review={r} data={data} today={today} onRespond={respondToReview}/>)}</div>}</section>
        <section className="card p-5"><div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-bold text-slate-900 dark:text-white">Kỳ thi sắp tới</h2><GraduationCap className="text-blue-600" size={21}/></div><div className="space-y-4">{upcoming.map(e=>{const days=Math.max(0,daysBetween(today,e.date));return <div key={e.id} className="flex items-center gap-3"><div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300"><strong className="text-lg leading-none">{days}</strong><span className="text-[11px]">ngày</span></div><div className="min-w-0 flex-1"><p className="truncate font-semibold text-slate-800 dark:text-slate-100">{e.title}</p><p className="text-sm text-slate-500">{formatDate(e.date)} · {e.time}</p></div><ChevronRight className="text-slate-300" size={18}/></div>})}</div></section>
      </aside>
    </div>
  </div>;
}

function Stat({icon,label,value,note,warn}:{icon:React.ReactNode;label:string;value:string;note:string;warn?:boolean}) { return <div className="card p-4"><div className="flex items-center justify-between text-slate-400"><span className="text-sm font-medium">{label}</span><span className={warn?'text-amber-500':'text-slate-400'}>{icon}</span></div><div className="mt-3 text-3xl font-bold text-slate-950 dark:text-white">{value}</div><p className={`mt-1 text-xs ${warn?'text-amber-600':'text-slate-500'}`}>{note}</p></div>; }
function Empty({text}:{text:string}) { return <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500 dark:border-slate-700">{text}</div>; }
function ReviewItem({review,data,today,onRespond}:{review:Review;data:StudyData;today:string;onRespond:(r:Review,x:ReviewResponse)=>void}) { const chapter=data.chapters.find(c=>c.id===review.chapterId); const overdue=review.dueDate<today; return <div className={`rounded-xl border p-3 ${overdue?'border-rose-200 bg-rose-50/60 dark:border-rose-900 dark:bg-rose-950/20':'border-slate-200 dark:border-slate-800'}`}><div className="flex items-start justify-between gap-2"><div><p className="font-semibold text-slate-800 dark:text-slate-100">{chapter?.name}</p><p className={`text-xs ${overdue?'text-rose-600':'text-slate-500'}`}>{overdue?`Quá hạn · ${formatDate(review.dueDate)}`:`Ôn +${review.offsetDays}`}</p></div></div><div className="mt-3 grid grid-cols-3 gap-1"><button className="rounded-lg bg-emerald-100 px-2 py-2 text-xs font-semibold text-emerald-700" onClick={()=>onRespond(review,'good')}>Nhớ tốt</button><button className="rounded-lg bg-amber-100 px-2 py-2 text-xs font-semibold text-amber-700" onClick={()=>onRespond(review,'partial')}>Nhớ một phần</button><button className="rounded-lg bg-rose-100 px-2 py-2 text-xs font-semibold text-rose-700" onClick={()=>onRespond(review,'forgot')}>Quên gần hết</button></div></div>; }
