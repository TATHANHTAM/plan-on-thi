import { BarChart3, BookOpen, CalendarDays, GraduationCap, LayoutDashboard, Loader2, RotateCcw, Settings as SettingsIcon } from 'lucide-react';
import { lazy, Suspense, useEffect, useState } from 'react';
import { Checklist } from './components/Checklist';
import { FocusTimer } from './components/FocusTimer';
import { Reviews } from './components/Reviews';
import { Settings } from './components/Settings';
import { Subjects } from './components/Subjects';
import { useStudyData } from './hooks/useStudyData';

const nav=[
  {id:'overview',label:'Lịch học',icon:CalendarDays},
  {id:'subjects',label:'Môn học',icon:BookOpen},
  {id:'reviews',label:'Ôn tập',icon:RotateCcw},
  {id:'analytics',label:'Thống kê',icon:BarChart3},
];
const Analytics = lazy(() => import('./components/Analytics').then(module => ({ default: module.Analytics })));

export default function App(){const api=useStudyData();const {data,loading,error}=api;const [view,setView]=useState('overview'),[timer,setTimer]=useState(false);useEffect(()=>{document.documentElement.classList.toggle('dark',data.settings.darkMode)},[data.settings.darkMode]);
  if(loading)return <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-600"><Loader2 className="mr-2 animate-spin"/>Đang tải kế hoạch học…</div>;
  if(error)return <div className="mx-auto mt-20 max-w-lg rounded-2xl bg-rose-50 p-6 text-rose-800"><strong>Không thể mở Study Tracker.</strong><p className="mt-2 text-sm">{error}</p></div>;
  const content=view==='overview'?<Checklist data={data} refresh={api.refresh} onTimer={()=>setTimer(true)} onReview={api.respondToReview}/>:view==='subjects'?<Subjects data={data} updateChapter={api.updateChapter}/>:view==='reviews'?<Reviews data={data} onRespond={api.respondToReview}/>:view==='analytics'?<Suspense fallback={<div className="card p-6 text-slate-500">Đang tải thống kê…</div>}><Analytics data={data}/></Suspense>:<Settings settings={data.settings} onUpdate={api.updateSettings} onRefresh={api.refresh}/>;
  return <div className="min-h-screen bg-slate-50 text-slate-900 transition-colors dark:bg-slate-950 dark:text-slate-100"><aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 lg:flex lg:flex-col"><div className="flex items-center gap-3 px-2 py-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-teal-500 text-white"><GraduationCap size={22}/></div><div><p className="font-bold leading-tight">Study Tracker</p><p className="text-xs text-slate-500">Kế hoạch ôn thi 2026–2027</p></div></div><nav className="mt-6 space-y-1">{nav.map(item=><NavButton key={item.id} item={item} active={view===item.id} onClick={()=>setView(item.id)}/>)}</nav><div className="mt-auto border-t border-slate-200 pt-3 dark:border-slate-800"><NavButton item={{id:'settings',label:'Cài đặt & sao lưu',icon:SettingsIcon}} active={view==='settings'} onClick={()=>setView('settings')}/><div className="mt-3 rounded-xl bg-slate-50 p-3 text-xs leading-relaxed text-slate-500 dark:bg-slate-800/50">Dữ liệu được lưu cục bộ trong trình duyệt này. Hãy sao lưu JSON thường xuyên.</div></div></aside><main className="mx-auto min-h-screen max-w-[1500px] px-4 pb-28 pt-6 sm:px-6 lg:ml-64 lg:px-8 lg:pb-10 lg:pt-8">{content}</main><nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-slate-200 bg-white/95 px-1 pb-[env(safe-area-inset-bottom)] backdrop-blur dark:border-slate-800 dark:bg-slate-900/95 lg:hidden">{nav.map(item=><button key={item.id} onClick={()=>setView(item.id)} className={`flex min-h-16 flex-col items-center justify-center gap-1 text-[11px] font-semibold ${view===item.id?'text-blue-600':'text-slate-500'}`}><item.icon size={19}/><span>{item.label}</span></button>)}<button onClick={()=>setView('settings')} className={`flex min-h-16 flex-col items-center justify-center gap-1 text-[11px] font-semibold ${view==='settings'?'text-blue-600':'text-slate-500'}`}><SettingsIcon size={19}/><span>Cài đặt</span></button></nav>{timer&&<FocusTimer data={data} onClose={()=>setTimer(false)} onFinish={api.addSession}/>}</div>;
}

function NavButton({item,active,onClick}:{item:{id:string;label:string;icon:typeof LayoutDashboard};active:boolean;onClick:()=>void}){return <button onClick={onClick} className={`flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-sm font-semibold transition ${active?'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300':'text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800'}`}><item.icon size={19}/>{item.label}</button>}
