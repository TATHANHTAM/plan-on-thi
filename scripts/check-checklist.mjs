import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';

registerHooks({
  resolve(specifier, context, nextResolve) {
    return nextResolve(specifier === '../utils/date' ? specifier + '.ts' : specifier, context);
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
assert.deepEqual(fixed.filter(e => e[0] === '2027-01-06'),
  [['2027-01-06', '07:30', 'methods', 'Đến ký tên môn Phương pháp luận NCKH']]);
assert.equal(schedule.filter(s => s.date === '2027-01-06').length, 0);
assert.deepEqual(fixed.filter(e => e[0] === '2027-01-07').map(e => e[1]),
  ['07:30–09:10', '13:00–14:40']);
assert.ok(schedule.filter(s => s.time).every(s =>
  s.blocks.length === 1 && s.blocks[0].weight === 2 && s.blocks[0].minutes === '100'));
console.log('Checklist OK: từng khối, vòng lưu JSON, chuyển khung, tuần thi và giờ thi.');
