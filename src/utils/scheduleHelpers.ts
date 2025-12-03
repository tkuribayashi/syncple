import { format, differenceInDays } from 'date-fns';
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
 * 複数日にまたがる予定かどうか判定
 */
export function isMultiDaySchedule(schedule: Schedule): boolean {
  return !!schedule.endDate && schedule.endDate > schedule.date;
}

/**
 * 指定日が予定期間内に含まれるか判定
 */
export function isScheduleInDateRange(schedule: Schedule, targetDate: Date): boolean {
  const dateStr = format(targetDate, 'yyyy-MM-dd');

  if (!schedule.endDate) {
    // 単日予定
    return schedule.date === dateStr;
  }

  // 複数日予定
  return schedule.date <= dateStr && schedule.endDate >= dateStr;
}

/**
 * 予定期間の日数を計算
 */
export function getScheduleDurationDays(schedule: Schedule): number {
  if (!schedule.endDate) return 1;

  const start = new Date(schedule.date);
  const end = new Date(schedule.endDate);
  return differenceInDays(end, start) + 1;
}

/**
 * 指定日が予定期間内の何日目かを計算（1始まり）
 */
export function getScheduleDayNumber(schedule: Schedule, targetDate: Date): number | null {
  if (!isScheduleInDateRange(schedule, targetDate)) return null;

  const dateStr = format(targetDate, 'yyyy-MM-dd');
  const start = new Date(schedule.date);
  const target = new Date(dateStr);
  return differenceInDays(target, start) + 1;
}

/**
 * 指定日の予定をフィルタリング＆ソート
 */
export function getSchedulesForDate(schedules: Schedule[], date: Date): Schedule[] {
  const filtered = schedules.filter(s => isScheduleInDateRange(s, date));
  return sortSchedulesByTime(filtered);
}

/**
 * 今日の日付文字列を取得
 */
export function getTodayDateString(): string {
  return format(new Date(), 'yyyy-MM-dd');
}
