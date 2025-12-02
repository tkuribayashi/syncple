import { format } from 'date-fns';
import { Schedule } from '@/types';

/**
 * 予定を時刻順にソートする
 * 終日の予定を先に表示し、時刻指定の予定は開始時刻順にソート
 */
export function sortSchedulesByTime(schedules: Schedule[]): Schedule[] {
  return [...schedules].sort((a, b) => {
    // 終日の予定を先に表示
    if (a.isAllDay && !b.isAllDay) return -1;
    if (!a.isAllDay && b.isAllDay) return 1;

    // 両方時刻指定の場合、開始時刻順
    if (!a.isAllDay && !b.isAllDay) {
      return (a.startTime || '').localeCompare(b.startTime || '');
    }

    return 0;
  });
}

/**
 * 指定日の予定をフィルタリング＆ソート
 */
export function getSchedulesForDate(schedules: Schedule[], date: Date): Schedule[] {
  const dateStr = format(date, 'yyyy-MM-dd');
  const filtered = schedules.filter(s => s.date === dateStr);
  return sortSchedulesByTime(filtered);
}

/**
 * 今日の日付文字列を取得
 */
export function getTodayDateString(): string {
  return format(new Date(), 'yyyy-MM-dd');
}
