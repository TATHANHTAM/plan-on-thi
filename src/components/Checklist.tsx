import { useState } from 'react';
import { blockId, firstDay, fixed, groups, lastDay, moveBlock, schedule, whiteSlots } from '../data/checklist';
import type { BlockProgress, Session } from '../data/checklist';
import { db } from '../db';
import type { StudyData } from '../hooks/useStudyData';
import type { ReviewResponse, Review } from '../types';
import { addDays, startOfWeek, todayISO, weekdayLabel, formatDate } from '../utils/date';

const groupColors = {
  ctdl: 'border-blue-500 bg-blue-50 text-blue-800 dark:bg-blue-950/50 dark:text-blue-200',
  xstk: 'border-teal-500 bg-teal-50 text-teal-800 dark:bg-teal-950/50 dark:text-teal-200',
  python: 'border-violet-500 bg-violet-50 text-violet-800 dark:bg-violet-950/50 dark:text-violet-200',
  research: 'border-amber-500 bg-amber-50 text-amber-900 dark:bg-amber-950/50 dark:text-amber-200',
  other: 'border-slate-500 bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200',
};

export function Checklist({ data, refresh, onTimer, onReview }: {
  data: StudyData;
  refresh: () => Promise<void>;
  onTimer: () => void;
  onReview: (review: Review, response: ReviewResponse) => Promise<void>;
}) {
  const today = todayISO();
  const [week, setWeek] = useState<string>();
  const [notice, setNotice] = useState('');
  const progress = data.settings.checklist ?? {};
  const active = schedule.filter(s => !s.optional || progress.enabled?.[s.id]);
  const blocks = active.flatMap(session => session.blocks.map((block, index) => {
    const id = blockId(session, index);
    const state = progress.blocks?.[id] ?? {};
    return { session, block, index, id, state, date: state.slot ?? state.researchDate ?? session.date };
  }));
  const dates = week ? Array.from({ length: 7 }, (_, i) => addDays(week, i)) : [today];
  const weekStart = week ?? startOfWeek(today);
  const weekEnd = addDays(weekStart, 6);
  const inWeek = (date: string) => date >= weekStart && date <= weekEnd;
  const completed = active.filter(session => inWeek(session.date) &&
    session.blocks.every((_, i) => {
      const state = progress.blocks?.[blockId(session, i)];
      return state?.done || state?.omitted;
    }) && session.blocks.some((_, i) => progress.blocks?.[blockId(session, i)]?.done));
  const used = (date: string) => blocks.find(row => row.state.slot === date && !row.state.omitted);
  const edit = async (change: (state: NonNullable<typeof progress>) => void) => {
    try {
      await db.settings.where('id').equals('settings').modify(settings => {
        change(settings.checklist ??= {});
      });
      await refresh();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Không lưu được thay đổi.');
    }
  };
  const saveBlock = (id: string, patch: BlockProgress) => edit(state => {
    const entries = state.blocks ??= {};
    entries[id] = { ...entries[id], ...patch };
  });
  const renderBlock = (row: typeof blocks[number]) => {
    const { id, session, block, index, state } = row;
    const nextBlock = blocks.find(candidate => candidate.session.group === session.group &&
      candidate.date > session.date && !candidate.session.time && !candidate.state.done &&
      !candidate.state.omitted && !candidate.state.slot &&
      (session.group !== 'ctdl' || candidate.index === candidate.session.blocks.length - 1))?.id;
    const flex = !session.time && !state.omitted && !state.researchDate;
    const extraResearch = schedule.find(s => s.group === 'research' && s.optional &&
      s.date >= today && s.date >= session.date && s.date <= addDays(startOfWeek(session.date), 6) &&
      !progress.enabled?.[s.id] && !blocks.some(row => row.state.researchDate === s.date));
    const eligible = whiteSlots.filter(slot => slot >= session.date && slot >= today && !used(slot) &&
      !blocks.some(other => other.session.id === session.id && other.state.slot === slot) &&
      blocks.filter(other => other.date === slot && !other.state.omitted).reduce((sum, other) => sum + other.block.weight, block.weight) <= 4);
    const groupSlots = session.group === 'ctdl' && blocks.some(other => other.session.id === session.id && other.state.slot)
      ? [] : eligible;
    return <div key={id} className={`space-y-2 rounded-xl border p-3 ${state.omitted
      ? 'border-dashed border-slate-300 bg-slate-50 dark:border-slate-600 dark:bg-slate-800'
      : state.done ? 'border-emerald-300 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/40'
      : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900'}`}>
      <label className="flex items-start gap-2 font-semibold">
        <input type="checkbox" className="mt-1 size-4 accent-emerald-600" checked={!!state.done} disabled={state.omitted}
          onChange={e => void saveBlock(id, { done: e.target.checked })} />
        {session.time ? 'Phiên liên tục' : 'Khối ' + (index + 1)} · {block.minutes} phút
        {state.omitted ? ' · Đã bỏ' : state.done ? ' · Đã xong' : ''}
      </label>
      <label className="block text-sm">Đầu ra
        <textarea key={state.output} className="field py-2" defaultValue={state.output ?? block.output}
          onBlur={e => { if (e.target.value !== (state.output ?? block.output)) void saveBlock(id, { output: e.target.value }); }} />
      </label>
      <label className="block text-sm">Ghi lỗi
        <input key={state.error} className="field" defaultValue={state.error ?? ''}
          onBlur={e => { if (e.target.value !== (state.error ?? '')) void saveBlock(id, { error: e.target.value }); }} />
      </label>
      {state.note && <p className="text-sm text-teal-700 dark:text-teal-300">{state.note}</p>}
      {block.rest && !state.omitted && <p className="text-sm text-slate-500">Sau khối · Nghỉ 10–15 phút</p>}
      <div className="flex flex-wrap gap-2">
        {flex && !state.slot && groupSlots.length > 0 && <select className="field !border-sky-300 !bg-sky-50 !text-sky-900 dark:!border-sky-700 dark:!bg-sky-950 dark:!text-sky-200 sm:w-auto" aria-label="Chuyển sang khung trắng" value=""
          onChange={e => {
            const slot = e.target.value;
            if (session.group === 'research' && !window.confirm('Việc có hạn gần hoặc đang chặn tiến độ?')) return;
            void edit(current => moveBlock(current, id, slot));
          }}>
          <option value="" disabled>Chuyển sang khung trắng</option>
          {groupSlots.map(slot => <option key={slot} value={slot}>{formatDate(slot)}</option>)}
        </select>}
        {flex && !state.done && !state.slot && session.group === 'research' && !session.optional && extraResearch &&
          <button className="btn-secondary" onClick={() => void saveBlock(id, { researchDate: extraResearch.date })}>
            Chuyển sang suất thứ 5 · {formatDate(extraResearch.date)}
          </button>}
        {flex && !state.done && !state.slot && nextBlock && ['xstk', 'ctdl'].includes(session.group) &&
          <button className="btn-secondary !border-violet-200 !bg-violet-50 !text-violet-800 dark:!border-violet-700 dark:!bg-violet-950 dark:!text-violet-200" onClick={() => void edit(current => {
            const entries = current.blocks ??= {};
            const note = session.group === 'xstk' ? 'Gộp một câu luyện' : 'Thay bài biến thể bằng sửa lỗi';
            const source = entries[id];
            entries[id] = { ...source, omitted: true };
            const destination = entries[nextBlock];
            const cue = note + ' từ ' + formatDate(session.date) + ' · ' + (source?.error || source?.output || block.output);
            entries[nextBlock] = {
              ...destination,
              ...(session.group === 'ctdl' ? { output: cue } : {
                note: [destination?.note, cue].filter(Boolean).join('\n'),
              }),
            };
          })}>{session.group === 'xstk' ? 'Gộp một câu luyện vào buổi sau' : 'Đưa lỗi vào buổi sau'}</button>}
        {!session.time && (!state.done || state.omitted) && <button className={state.omitted ? 'btn-ghost' : 'btn-secondary !border-rose-200 !bg-rose-50 !text-rose-800 dark:!border-rose-800 dark:!bg-rose-950 dark:!text-rose-200'}
          onClick={() => void saveBlock(id, { omitted: !state.omitted, ...(state.omitted ? { slot: undefined } : {}) })}>
          {state.omitted ? 'Khôi phục' : 'Bỏ'}
        </button>}
      </div>
    </div>;
  };
  const renderSession = (session: Session) => {
    const rows = blocks.filter(row => row.session.id === session.id);
    const time = progress.times?.[session.id] ?? '';
    const finished = rows.filter(row => row.state.done).length;
    const omitted = rows.filter(row => row.state.omitted).length;
    const reviewRows = session.group === 'xstk' && !session.time ? data.reviews.filter(review =>
      review.subjectId === 'xstk' && review.status === 'pending' &&
      active.find(candidate => candidate.group === 'xstk' && !candidate.time && candidate.date >= (review.dueDate < today ? today : review.dueDate))?.id === session.id) : [];
    return <details open key={session.id} className="group space-y-3 rounded-xl bg-slate-50 p-4 dark:bg-slate-800/50">
      <summary className={`flex min-h-11 cursor-pointer list-none flex-wrap items-center gap-x-2 gap-y-1 rounded-lg border-l-4 px-3 py-2 font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 [&::-webkit-details-marker]:hidden ${groupColors[session.group]}`}>
        <span>{groups[session.group]}</span>
        {session.title !== groups[session.group] && <span className="font-medium">· {session.title}</span>}
        <span className="ml-auto whitespace-nowrap text-xs font-semibold">{finished}/{rows.length} xong</span>
        <span aria-hidden="true" className="inline-block size-2 rotate-[-45deg] border-b-2 border-r-2 group-open:rotate-45" />
      </summary>
      <p className="text-sm">{finished}/{rows.length} khối đã xong{omitted > 0 ? ' · Đã rút gọn, bỏ ' + omitted + ' khối' : ''}</p>
      {session.time ? <p className="font-semibold">{session.time}</p> :
        <label className="flex items-center gap-2 text-sm">Giờ bắt đầu
          <input type="time" className="field w-auto" value={time}
            onChange={e => { const value = e.target.value; void edit(state => { (state.times ??= {})[session.id] = value; }); }} />
        </label>}
      {time && Number(time.slice(0, 2)) * 60 + Number(time.slice(3)) +
        rows.filter(row => !row.state.omitted && !row.state.slot).reduce((sum, row) => sum + Number(row.block.minutes.split('–').at(-1)) + (row.block.rest ? 15 : 0), 0) > 21 * 60 &&
        <p className="text-sm font-semibold text-amber-700">Dự kiến vượt giờ chốt 21:00.</p>}
      {session.group === 'xstk' && !session.time && <p className="text-sm">5–10 phút đầu buổi · Tự gọi lại kiến thức hoặc làm một câu cũ.</p>}
      {reviewRows.map(review => <div key={review.id} className="flex flex-wrap items-center gap-2 text-sm">
        <span>{data.chapters.find(c => c.id === review.chapterId)?.name} · Ôn +{review.offsetDays}</span>
        {([['good', 'Nhớ tốt'], ['partial', 'Nhớ một phần'], ['forgot', 'Quên gần hết']] as const).map(([response, label]) =>
          <button key={response} className="btn-secondary" onClick={() => void onReview(review, response)}>{label}</button>)}
      </div>)}
      {rows.map(row => (row.state.slot || row.state.researchDate) && !row.state.omitted ?
        <p key={row.id} className="text-sm text-teal-700 dark:text-teal-300">Khối {row.index + 1} · Đã chuyển sang {formatDate(row.date)}{row.state.done ? ' · Đã xong' : ''}</p>
        : renderBlock(row))}
    </details>;
  };
  return <div className="space-y-5">
    <header className="flex flex-wrap items-center justify-between gap-3">
      <h1 className="text-3xl font-bold">Checklist ôn thi</h1>
      <button className="btn-secondary" onClick={onTimer}>Bộ đếm tập trung</button>
    </header>
    <nav className="flex flex-wrap gap-2">
      <button className={week ? 'btn-secondary' : 'btn-primary'} onClick={() => setWeek(undefined)}>Hôm nay</button>
      <button className={week ? 'btn-primary' : 'btn-secondary'} onClick={() => setWeek(startOfWeek(today))}>Tuần này</button>
      {week && <>
        <button className="btn-secondary" onClick={() => setWeek(addDays(week, -7))}>Tuần trước</button>
        <button className="btn-secondary" onClick={() => setWeek(addDays(week, 7))}>Tuần sau</button>
      </>}
    </nav>
    {notice && <p role="alert" className="text-rose-700">{notice}</p>}
    <section className="card p-4">
      <h2 className="font-bold">Buổi đã hoàn thành · {formatDate(weekStart)} – {formatDate(weekEnd)}</h2>
      <ul className="mt-2 flex flex-wrap gap-x-5 gap-y-2 text-sm">
        {(Object.keys(groups) as (keyof typeof groups)[]).map(id =>
          <li key={id} className={`rounded-md border-l-2 px-2 py-1 ${groupColors[id]}`}>{groups[id]} · <strong>{completed.filter(s => s.group === id).length}</strong></li>)}
      </ul>
    </section>
    {dates.map(date => {
      const sessions = active.filter(s => s.date === date);
      const slot = used(date);
      const load = blocks.filter(row => row.date === date && !row.state.omitted).reduce((sum, row) => sum + row.block.weight, 0);
      const events = fixed.filter(event => event[0] === date);
      const optional = schedule.filter(s => s.date === date && s.optional);
      const movedResearch = blocks.filter(row => row.state.researchDate === date && !row.state.omitted);
      const sunday = addDays(startOfWeek(date), 6) === date;
      const friday = addDays(startOfWeek(date), 4) === date;
      return <section key={date} className="card space-y-5 p-4 sm:p-6">
        <h2 className="text-xl font-bold capitalize">{weekdayLabel(date)}</h2>
        <div className={events.length ? 'rounded-xl border-l-4 border-indigo-500 bg-indigo-50 p-3 dark:bg-indigo-950/50' : undefined}><h3 className="font-bold">Lịch cố định</h3>
          {events.length ? events.map(([, time, group, title]) => <p key={title} className="mt-2 text-sm"><strong>{time}</strong> · {title} <span className="text-slate-500">· {groups[group]}</span></p>) : <p className="text-sm text-slate-500">Không có mốc cố định.</p>}
        </div>
        <div className="space-y-3"><h3 className="font-bold">Buổi học · {Number(load.toFixed(2))} khối dự kiến</h3>
          {load > 4 && <p role="status" className="text-sm font-semibold text-amber-700">Vượt 4 khối trong ngày. {friday && 'Có thể chuyển khối XSTK nhẹ sang khung trắng thứ 7 nếu còn trống.'}</p>}
          {friday && sessions.some(s => s.group === 'ctdl') && sessions.some(s => s.group === 'xstk') &&
            whiteSlots.includes(addDays(date, 1)) && !used(addDays(date, 1)) &&
            <p className="text-sm text-slate-500">Nếu thứ 6 vướng lịch, ưu tiên chuyển khối XSTK nhẹ sang khung trắng thứ 7.</p>}
          {optional.map(s => <label key={s.id} className="flex items-center gap-2 text-sm">
            <input type="checkbox" disabled={s.group === 'research' && movedResearch.length > 0} checked={!!progress.enabled?.[s.id]} onChange={e => { const value = e.target.checked; void edit(p => {
              (p.enabled ??= {})[s.id] = value;
              if (value && date === '2027-01-03') {
                for (const alternative of optional) if (alternative.id !== s.id) p.enabled[alternative.id] = false;
              }
            }); }} />{s.group === 'research' ? s.title : s.time ? 'Thi thử XSTK 13:00–14:40 · Bật nếu đã chữa đề đầu' : s.title}
          </label>)}
          {sessions.map(renderSession)}
          {movedResearch.map(row => <article key={row.id} className="space-y-2">
            <h4 className="font-bold">NCKH sinh viên · Suất thứ 5 · Từ {formatDate(row.session.date)}</h4>
            {renderBlock({ ...row, block: { ...row.block, minutes: '25', weight: 0.5 } })}
            <button className="btn-ghost" onClick={() => void saveBlock(row.id, { researchDate: undefined })}>Trả khối về ngày gốc</button>
          </article>)}
          {!sessions.length && !optional.length && <p className="text-sm text-slate-500">Không có buổi học trong checklist.</p>}
        </div>
        {whiteSlots.includes(date) && <div className="space-y-2 rounded-xl border border-dashed border-sky-300 bg-sky-50 p-3 text-sky-900 dark:border-sky-700 dark:bg-sky-950/40 dark:text-sky-200">
          <h3 className="text-sm font-semibold">Khung trắng{slot ? '' : ' · 45–50 phút · Còn trống'}</h3>
          {slot && <>
            <p className="text-sm">{slot.session.title} · Chuyển từ {formatDate(slot.session.date)}</p>
            {renderBlock(slot)}
            <button className="btn-ghost" onClick={() => void saveBlock(slot.id, { slot: undefined })}>Trả khối về ngày gốc</button>
          </>}
        </div>}
        {date >= firstDay && date <= lastDay && <p className="text-sm text-slate-600 dark:text-slate-300">
          <strong>Thời gian nghỉ</strong> · {date === '2027-01-07' ? '09:10–13:00 · Ăn, nghỉ và di chuyển giữa hai ca thi'
            : sunday ? 'Nghỉ ít nhất nửa ngày · Rà tuần 10 phút' : 'Ăn, nghỉ và di chuyển theo giờ thực tế'}
        </p>}
        {sunday && <p className="rounded-xl bg-teal-50 p-3 text-sm text-teal-900">
          Rà tuần · {completed.length} buổi đã làm · {blocks.filter(row => (row.state.slot || row.state.researchDate) && inWeek(row.session.date)).length} khối đã dời · {blocks.filter(row => row.state.omitted && inWeek(row.session.date)).length} khối đã bỏ · {whiteSlots.filter(slot => inWeek(slot) && !used(slot)).length} khung trắng còn lại
        </p>}
      </section>;
    })}
    <details className="card p-4">
      <summary className="cursor-pointer font-semibold">Tiến độ và nhiệm vụ đã lưu từ lịch trước</summary>
      <ul className="mt-3 space-y-1 text-sm">{data.tasks.filter(t => t.isCustom || t.status !== 'todo').map(t =>
        <li key={t.id}>{formatDate(t.date)} · {t.title} · {t.status === 'completed' ? 'Đã xong' : t.status === 'skipped' ? 'Đã bỏ' : t.status === 'rescheduled' ? 'Đã dời' : t.status === 'in-progress' ? 'Đang học' : 'Chưa làm'}</li>)}</ul>
    </details>
  </div>;
}
