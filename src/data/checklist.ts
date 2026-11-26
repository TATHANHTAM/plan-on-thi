import { addDays } from '../utils/date';

export const firstDay = '2026-11-26';
export const lastDay = '2027-01-07';
export const groups = {
  ctdl: 'CTDLGT', xstk: 'XSTK', research: 'NCKH sinh viên',
  methods: 'Phương pháp luận NCKH', python: 'Python ATTT', other: 'Môn khác',
};
export type Group = keyof typeof groups;
export type Block = { output: string; minutes: string; weight: number; rest?: boolean };
export type Session = { id: string; date: string; group: Group; title: string; blocks: Block[]; time?: string; optional?: boolean };
export type BlockProgress = { done?: boolean; omitted?: boolean; output?: string; error?: string; slot?: string; researchDate?: string; note?: string };
export type DayLog = { energy?: string; done?: string; error?: string; tomorrow?: string };
export type ChecklistProgress = {
  blocks?: Record<string, BlockProgress>;
  times?: Record<string, string>;
  enabled?: Record<string, boolean>;
  logs?: Record<string, DayLog>;
};

const regular = (output: string): Block => ({ output, minutes: '45–50', weight: 1, rest: true });
const short = (output: string, minutes = '25–45'): Block => ({ output, minutes, weight: Number(minutes.split('–').at(-1)) / 50 });
export const schedule: Session[] = [];
function add(date: string, group: Group, title: string, blocks: Block[], options: Pick<Session, 'time' | 'optional'> = {}) {
  schedule.push({ id: [date, group, schedule.filter(s => s.date === date && s.group === group).length].join('/'), date, group, title, blocks, ...options });
}
function code(date: string, topic = 'Luyện CTDLGT') {
  add(date, 'ctdl', topic, [
    regular('Tìm hướng và viết bản code đầu tiên.'),
    regular('Hoàn thiện code và chạy ca kiểm thử biên.'),
    regular('Sửa lỗi chính hoặc làm một bài biến thể.'),
  ]);
}
function stats(date: string, topic: string, output: string, second = '') {
  add(date, 'xstk', topic, [regular(output), ...(second ? [regular(second)] : [])]);
}
function research(date: string, optional = false, minutes = optional ? '25' : '25–45') {
  add(date, 'research', optional ? 'NCKH sinh viên · Suất thứ 5' : 'NCKH sinh viên',
    [short('Ghi chú một bài báo, viết một đoạn hoặc kiểm tra một kết quả.', minutes)], { optional });
}
function mock(date: string, group: Group, time: string, optional = false) {
  add(date, group, 'Thi thử', [{ output: 'Làm đề liên tục 100 phút.', minutes: '100', weight: 2 }], { time, optional });
}

stats('2026-11-26', 'XSTK Ch2', 'Kiểm tra phần Ch2 đã tự giải được.', 'Tự giải bài đại diện và ghi lỗi.');
research('2026-11-26');
code('2026-11-27');
stats('2026-11-28', 'XSTK Ch2', 'Làm lại bài sai và tự giải một bài trộn.');
add('2026-11-28', 'python', 'Chuẩn bị báo cáo', [short('Chạy thử demo và diễn tập báo cáo.')]);

const standardWeeks = [
  ['2026-11-30', 'Ch3', 'Ch3', 'Ch3', 'Ch3'],
  ['2026-12-07', 'Ch4', 'Ch4', 'Ch4', 'Ch5'],
  ['2026-12-14', 'Ch5', 'Ch6', 'Ch6', 'Ch6'],
];
for (const [monday, tue, thu, fri, sat] of standardWeeks) {
  const day = (offset: number) => addDays(monday, offset);
  code(day(monday === '2026-11-30' ? 2 : 0));
  code(day(monday === '2026-11-30' ? 3 : 2), monday === '2026-12-07' ? 'CTDLGT · Bộ bài trộn' : undefined);
  code(day(4));
  const statsDay = monday === '2026-12-14' ? 0 : 1;
  stats(day(statsDay), 'XSTK ' + tue, 'Học phần mới và tự giải một bài.', 'Luyện bài đại diện, ghi lỗi.');
  stats(day(3), 'XSTK ' + thu, 'Luyện bài theo dạng.', 'Giải một bài độc lập và kiểm tra cách chọn công thức.');
  stats(day(4), 'XSTK ' + fri, 'Làm lại một bài sai hoặc trả lời một câu ngắn.');
  stats(day(monday === '2026-11-30' ? 6 : 5), 'XSTK ' + sat,
    monday === '2026-11-30' ? 'Kiểm tra Ch3, tự giải bài và ghi dạng còn yếu.' : 'Làm bài trộn, ghi lỗi và đối chiếu mục tiêu 3/5 bài cơ bản.');
  research(day(monday === '2026-11-30' ? 1 : 0), false, '25');
  research(day(monday === '2026-12-14' ? 2 : monday === '2026-11-30' ? 6 : 1));
  research(day(monday === '2026-11-30' ? 2 : 3));
  research(day(5));
  research(day(monday === '2026-12-14' ? 1 : 2), true);
}
add('2026-11-30', 'python', 'Chốt báo cáo', [short('Chốt file, chạy demo và kiểm tra bản sao lưu.')]);
add('2026-12-13', 'other', 'Tiếng Anh', [short('Kiểm tra nhanh bốn kỹ năng trước ngày thi.')]);
add('2026-12-16', 'other', 'Kiểm tra HĐH', [short('Chạy thử thao tác thi thực hành.')]);
add('2026-12-19', 'other', 'Kiểm tra thuyết trình', [short('Chạy thử bài và ghi chỗ cần sửa.')]);
add('2026-12-20', 'other', 'Kiểm tra demo Web', [short('Chạy demo và ghi lỗi sát hạn.')]);
code('2026-12-21');
for (const date of ['2026-12-21', '2026-12-24', '2026-12-27']) stats(date, 'XSTK Ch7', 'Tự giải bài kiểm định và ghi dạng còn yếu.');
research('2026-12-24');
research('2026-12-27');
mock('2026-12-26', 'ctdl', '09:30–11:10');
add('2026-12-26', 'ctdl', 'Chữa đề', [regular('Ghi 2–3 lỗi cần sửa.')]);
add('2026-12-28', 'ctdl', 'Sửa lỗi trước thi', [regular('Làm lại các dạng sai trong đề thi thử.')]);
mock('2026-12-29', 'ctdl', '09:30–11:10');
add('2026-12-30', 'ctdl', 'Ôn nhẹ', [short('Rà sổ lỗi và chuẩn bị thao tác thi.', '25')]);
mock('2027-01-01', 'xstk', '13:00–14:40');
add('2027-01-01', 'xstk', 'Chữa đề', [regular('Chữa đề đầu và ghi dạng còn hổng.')]);
mock('2027-01-02', 'python', '07:30–09:10');
mock('2027-01-03', 'xstk', '13:00–14:40', true);
add('2027-01-03', 'xstk', 'Nếu còn hổng, chữa theo dạng', [regular('Tự giải lại dạng chưa vững.')], { optional: true });
for (const date of ['2027-01-04', '2027-01-05']) {
  stats(date, 'Sửa dạng XSTK yếu', 'Tự giải lại một dạng từng sai và ghi cách chọn công thức.');
  add(date, 'python', 'Làm lại bài Python', [regular('Viết lại bài từng sai và kiểm thử.')]);
}

export const fixed: [string, string, Group, string][] = [
  ['2026-12-01', '07:00', 'python', 'Báo cáo Python'],
  ['2026-12-03', '07:00', 'python', 'Buổi Python cuối'],
  ['2026-12-15', '07:30–09:10', 'other', 'Thi Tiếng Anh'],
  ['2026-12-22', '07:30–09:10', 'other', 'Thi Hệ điều hành'],
  ['2026-12-23', '14:45–16:25', 'other', 'Thi Kỹ năng thuyết trình'],
  ['2026-12-25', '09:30–11:10', 'other', 'Thi Lập trình Web'],
  ['2026-12-31', '09:30–11:10', 'ctdl', 'Thi CTDLGT'],
  ['2027-01-06', '07:30', 'methods', 'Đến ký tên môn Phương pháp luận NCKH'],
  ['2027-01-07', '07:30–09:10', 'python', 'Thi Python ATTT'],
  ['2027-01-07', '13:00–14:40', 'xstk', 'Thi XSTK'],
];
export const whiteSlots = ['2026-11-28', '2026-12-01', '2026-12-05', '2026-12-08', '2026-12-12', '2026-12-15', '2026-12-19'];
export const blockId = (session: Session, index: number) => session.id + '/' + index;

schedule.sort((a, b) => a.date.localeCompare(b.date));

export function moveBlock(progress: ChecklistProgress, id: string, slot: string) {
  const entries = progress.blocks ??= {};
  if (!whiteSlots.includes(slot) || Object.values(entries).some(item => item.slot === slot && !item.omitted)) {
    throw new Error('Khung trắng không còn trống.');
  }
  entries[id] = { ...entries[id], slot };
}
