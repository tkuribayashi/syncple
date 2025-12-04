import HolidayJp from '@holiday-jp/holiday_jp';

/**
 * 指定された日付が日本の祝日かどうかを判定
 * @param date 判定する日付
 * @returns 祝日の場合はtrue、それ以外はfalse
 */
export function isJapaneseHoliday(date: Date): boolean {
  return HolidayJp.isHoliday(date);
}

/**
 * 指定された日付の祝日情報を取得
 * @param date 判定する日付
 * @returns 祝日の場合は祝日名、それ以外はnull
 */
export function getJapaneseHolidayName(date: Date): string | null {
  const holiday = HolidayJp.isHoliday(date);
  if (!holiday) return null;

  // 祝日オブジェクトから名前を取得
  const holidays = HolidayJp.between(date, date);
  return holidays.length > 0 ? holidays[0].name : null;
}
