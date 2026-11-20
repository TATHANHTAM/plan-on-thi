import { X } from 'lucide-react';
import type { ReactNode } from 'react';

export function Modal({ title, children, onClose, wide=false }: { title:string; children:ReactNode; onClose:()=>void; wide?:boolean }) {
  return <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/45 p-0 sm:items-center sm:p-4" role="dialog" aria-modal="true">
    <div className={`max-h-[92vh] w-full overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl dark:bg-slate-900 sm:rounded-3xl ${wide?'max-w-3xl':'max-w-lg'}`}>
      <div className="mb-4 flex items-center justify-between"><h2 className="text-xl font-bold text-slate-900 dark:text-white">{title}</h2><button className="btn-ghost !p-2" onClick={onClose} aria-label="Đóng"><X size={20}/></button></div>
      {children}
    </div>
  </div>;
}
