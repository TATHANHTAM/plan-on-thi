const VN_TZ = 'Asia/Bangkok';

export function todayISO(now = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: VN_TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
  return `${get('year')}-${get('month')}-${get('day')}`;
}

// Dùng 12:00 UTC để biểu diễn một ngày lịch. Mốc giữa ngày không bị đổi sang
// ngày liền trước/sau khi định dạng ở Asia/Bangkok.
export function parseISO(date: string): Date { return new Date(`${date}T12:00:00Z`); }
export function addDays(date: string, days: number): string { const d = parseISO(date); d.setUTCDate(d.getUTCDate() + days); return d.toISOString().slice(0, 10); }
export function daysBetween(from: string, to: string): number { return Math.ceil((parseISO(to).getTime() - parseISO(from).getTime()) / 86400000); }
export function formatDate(date: string, options?: Intl.DateTimeFormatOptions): string { return new Intl.DateTimeFormat('vi-VN', { timeZone: VN_TZ, day: '2-digit', month: '2-digit', year: 'numeric', ...options }).format(parseISO(date)); }
export function weekdayLabel(date: string): string { return new Intl.DateTimeFormat('vi-VN', { timeZone: VN_TZ, weekday: 'long', day: '2-digit', month: '2-digit' }).format(parseISO(date)); }
export function startOfWeek(date: string): string { const d = parseISO(date); const day = d.getUTCDay() || 7; d.setUTCDate(d.getUTCDate() - day + 1); return d.toISOString().slice(0, 10); }
export function isBetween(date: string, start: string, end: string): boolean { return date >= start && date <= end; }
