import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import 'fake-indexeddb/auto';

registerHooks({
  resolve(specifier, context, nextResolve) {
    const localTypeScript = context.parentURL?.endsWith('.ts') && specifier.startsWith('.') && !specifier.endsWith('.ts');
    return nextResolve(localTypeScript ? specifier + '.ts' : specifier, context);
  },
});
const { blockId, fixed, schedule, whiteSlots, moveBlock } =
  await import('../src/data/checklist.ts');
const session = schedule.find(s => s.date === '2026-11-27' && s.group === 'ctdl');
assert.equal(session.blocks.length, 3);
const id = blockId(session, 0);
const otherId = blockId(session, 1);
const progress = { blocks: { [id]: { done: true, error: 'Ca biên' } } };
const restored = JSON.parse(JSON.stringify(progress));
moveBlock(restored, id, whiteSlots[0]);
assert.deepEqual(restored.blocks[id], { done: true, error: 'Ca biên', slot: '2026-11-28' });
assert.equal(Object.keys(restored.blocks).length, 1);
assert.throws(() => moveBlock(restored, otherId, whiteSlots[0]));

const count = (start, end, group) =>
  schedule.filter(s => s.date >= start && s.date <= end && s.group === group && !s.optional).length;
assert.equal(count('2026-12-07', '2026-12-13', 'research'), 4);
assert.equal(count('2026-12-21', '2026-12-27', 'research'), 2);
assert.equal(count('2026-12-07', '2026-12-13', 'xstk'), 4);
assert.equal(count('2027-01-01', '2027-01-07', 'ctdl'), 0);
assert.equal(fixed.filter(e => e[0] === '2027-01-06').length, 0);
assert.equal(schedule.filter(s => s.date === '2027-01-06').length, 0);
assert.deepEqual(fixed.filter(e => e[0] === '2027-01-07').map(e => e[1]),
  ['07:30–09:10', '13:00–14:40']);
assert.ok(schedule.filter(s => s.time).every(s =>
  s.blocks.length === 1 && s.blocks[0].weight === 2 && s.blocks[0].minutes === '100'));
console.log('Checklist OK: từng khối, vòng lưu JSON, chuyển khung, tuần thi và giờ thi.');

const { db, ensureSeeded, exportAll, importAll } = await import('../src/db.ts');
const { todayISO } = await import('../src/utils/date.ts');
assert.equal(todayISO(new Date('2026-11-25T17:00:00Z')), '2026-11-26');
await ensureSeeded();
assert.ok(await db.tasks.get('plan-2026-12-07-35'));
const research = schedule.find(s => s.group === 'research');
const researchId = blockId(research, 0);
await db.settings.update('settings', {
  checklist: { blocks: { [id]: { done: true }, [researchId]: { done: true, error: 'Đã đọc bài báo' } } },
});
db.close();
await db.open();
assert.equal((await db.settings.get('settings')).checklist.blocks[id].done, true);
const backup = await exportAll();
const legacy = {
  ...backup,
  subjects: [...backup.subjects, { id: 'nckh' }],
  exams: [...backup.exams, { id: 'exam-nckh' }],
  tasks: [...backup.tasks, { id: 'retired-task', subjectId: 'nckh' }],
  sessions: [{ id: 'retired-session', taskId: 'retired-task' }],
  settings: backup.settings.map(({ checklist, ...setting }) => ({ ...setting, seededVersion: 1 })),
};
await importAll(legacy, 'merge');
assert.equal((await db.settings.get('settings')).checklist.blocks[researchId].error, 'Đã đọc bài báo');
await importAll({ ...legacy, settings: backup.settings }, 'replace');
const exported = await exportAll();
assert.equal(exported.settings[0].checklist.blocks[researchId].done, true);
assert.ok(!exported.subjects.some(s => s.id === 'nckh'));
assert.ok(!exported.exams.some(e => e.id === 'exam-nckh'));
assert.ok(!exported.tasks.some(t => t.id === 'retired-task'));
assert.ok(!exported.sessions.some(s => s.id === 'retired-session'));
await db.delete();
console.log('IndexedDB mô phỏng OK: mở lại sau khi tick, gộp/khôi phục backup và loại môn cũ.');
