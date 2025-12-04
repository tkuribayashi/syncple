'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { usePair } from '@/hooks/usePair';
import { useSchedules } from '@/hooks/useSchedules';
import { SCHEDULE_CATEGORIES } from '@/types';
import { format, addDays, isSameDay, startOfDay, startOfWeek } from 'date-fns';
import { ja } from 'date-fns/locale';
import { getSchedulesForDate, isMultiDaySchedule, getScheduleDayNumber, getScheduleDurationDays } from '@/utils/scheduleHelpers';
import { isJapaneseHoliday } from '@/utils/holidayHelpers';
import Loading from '@/components/ui/Loading';
import { CALENDAR } from '@/constants/app';

type ViewMode = '2weeks' | 'month';

export default function CalendarPage() {
  const router = useRouter();
  const { user, userProfile } = useAuth();
  const { partner } = usePair();
  const { schedules, loading } = useSchedules(userProfile?.pairId || null);

  // セッションストレージから日付を復元、なければ今日
  const [startDate, setStartDate] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('calendarStartDate');
      if (saved) {
        return startOfDay(new Date(saved));
      }
    }
    return startOfDay(new Date());
  });
  const [viewMode, setViewMode] = useState<ViewMode>('2weeks');

  // startDateが変更されたらsessionStorageに保存
  useEffect(() => {
    sessionStorage.setItem('calendarStartDate', startDate.toISOString());
  }, [startDate]);

  // localStorageから表示モードを読み込む
  useEffect(() => {
    const loadViewMode = () => {
      const saved = localStorage.getItem('calendarViewMode');
      if (saved && (saved === '2weeks' || saved === 'month')) {
        setViewMode(saved as ViewMode);
      }
    };

    // 初回読み込み
    loadViewMode();

    // ページが表示されたときに再読み込み（他のタブや設定画面からの変更を検知）
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadViewMode();
      }
    };

    // フォーカス時にも再読み込み
    const handleFocus = () => {
      loadViewMode();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  // 表示日数を計算
  const getDaysCount = () => {
    return viewMode === '2weeks' ? CALENDAR.TWO_WEEKS_DAYS : CALENDAR.MONTH_DAYS;
  };

  // viewModeに応じて実際の開始日を計算
  const getActualStartDate = () => {
    if (viewMode === 'month') {
      // 4週間表示の場合は、今週の日曜日を開始日とする
      return startOfWeek(startDate, { weekStartsOn: 0 });
    }
    // 2週間表示の場合は、startDateをそのまま使用
    return startDate;
  };

  const actualStartDate = getActualStartDate();
  const daysCount = getDaysCount();
  const weekDays = Array.from({ length: daysCount }, (_, i) => addDays(actualStartDate, i));

  return (
    <div className="max-w-6xl mx-auto p-4 pb-24">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">カレンダー</h1>
        <Link
          href="/calendar/new"
          className="btn btn-primary"
        >
          + 予定追加
        </Link>
      </div>

      <div className="card mb-6">
        {/* ヘッダー */}
        <div className="flex justify-between items-center mb-4 gap-2">
          <button
            onClick={() => setStartDate(addDays(startDate, -daysCount))}
            className="btn btn-secondary px-3 py-2 text-sm flex-shrink-0"
          >
            ← 前
          </button>
          <h2 className="text-sm md:text-lg font-semibold flex-1 text-center">
            {format(actualStartDate, 'M/d', { locale: ja })} - {format(addDays(actualStartDate, daysCount - 1), 'M/d', { locale: ja })}
          </h2>
          <button
            onClick={() => setStartDate(addDays(startDate, daysCount))}
            className="btn btn-secondary px-3 py-2 text-sm flex-shrink-0"
          >
            次 →
          </button>
        </div>

        {loading ? (
          <Loading />
        ) : viewMode === '2weeks' ? (
          // 2週間表示：2コラムレイアウト
          <div className="grid grid-cols-2 gap-2">
            {weekDays.map((day, index) => {
              const daySchedules = getSchedulesForDate(schedules, day);
              const isToday = isSameDay(day, new Date());
              const dayOfWeek = day.getDay();
              const isHoliday = isJapaneseHoliday(day);

              return (
                <div
                  key={index}
                  className={`border rounded-lg p-2 cursor-pointer hover:bg-gray-50 ${
                    isToday ? 'border-pink-400 border-2' : 'border-gray-200'
                  }`}
                  onClick={() => router.push(`/calendar/new?date=${format(day, 'yyyy-MM-dd')}`)}
                >
                  {/* 日付ヘッダー */}
                  <div className="flex items-center gap-1 mb-1">
                    <div className={`text-lg font-bold ${
                      isToday
                        ? 'text-pink-500'
                        : isHoliday || dayOfWeek === 0
                        ? 'text-red-600'
                        : dayOfWeek === 6
                        ? 'text-blue-600'
                        : 'text-gray-900'
                    }`}>
                      {format(day, 'd')}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={`text-xs font-medium ${
                        isToday ? 'text-pink-600' : 'text-gray-700'
                      }`}>
                        {format(day, 'E', { locale: ja })}
                      </div>
                    </div>
                    {daySchedules.length === 0 && (
                      <span className="text-xs text-gray-400">予定なし</span>
                    )}
                  </div>

                  {/* 予定リスト */}
                  {daySchedules.length > 0 && (
                    <div className="space-y-1" onClick={(e) => e.stopPropagation()}>
                      {daySchedules.map((schedule) => {
                        const isOwnSchedule = schedule.userId === user?.uid;
                        const isShared = schedule.isShared;
                        const isMultiDay = isMultiDaySchedule(schedule);

                        let dayIndicator = '';
                        let dayInfo = '';

                        if (isMultiDay) {
                          const dayNum = getScheduleDayNumber(schedule, day);
                          const duration = getScheduleDurationDays(schedule);

                          if (dayNum === 1) {
                            dayIndicator = '◀';
                          } else if (dayNum === duration) {
                            dayIndicator = '▶';
                          } else {
                            dayIndicator = '━';
                          }

                          dayInfo = `${dayNum}日目/${duration}日間`;
                        }

                        return (
                          <Link
                            key={schedule.id}
                            href={`/calendar/${schedule.id}`}
                            className={`block p-1.5 rounded border text-xs ${
                              isShared
                                ? 'bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-300 hover:from-blue-100 hover:to-cyan-100'
                                : isOwnSchedule
                                ? 'bg-pink-50 border-pink-200 hover:bg-pink-100'
                                : 'bg-purple-50 border-purple-200 hover:bg-purple-100'
                            }`}
                          >
                            {isMultiDay && (
                              <div className="text-xs text-gray-500 mb-0.5">
                                {dayIndicator} {dayInfo}
                              </div>
                            )}
                            <div className={`font-semibold mb-0.5 ${
                              isShared
                                ? 'text-blue-900'
                                : isOwnSchedule ? 'text-pink-800' : 'text-purple-800'
                            }`}>
                              {schedule.title}
                              {isShared && ' ⭐'}
                            </div>
                            {!schedule.isAllDay && schedule.startTime && (
                              <div className="text-xs text-gray-600">
                                {schedule.startTime}
                                {schedule.endTime && schedule.endTime !== schedule.startTime && ` - ${schedule.endTime}`}
                              </div>
                            )}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          // 4週間表示：カレンダーグリッド
          <div>
            {/* 曜日ヘッダー */}
            <div className="grid grid-cols-7 gap-1 mb-1">
              {['日', '月', '火', '水', '木', '金', '土'].map((day, i) => (
                <div key={i} className="text-center text-xs font-semibold text-gray-600 py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* カレンダーグリッド */}
            <div className="grid grid-cols-7 gap-1">
              {weekDays.map((day, index) => {
                const daySchedules = getSchedulesForDate(schedules, day);
                const isToday = isSameDay(day, new Date());
                const dayOfWeek = day.getDay();
                const isHoliday = isJapaneseHoliday(day);

                return (
                  <div
                    key={index}
                    className={`border rounded-lg p-1.5 min-h-[80px] cursor-pointer hover:bg-gray-50 ${
                      isToday
                        ? 'bg-pink-50 border-pink-400 border-2'
                        : isHoliday
                        ? 'bg-red-50 border-gray-200'
                        : dayOfWeek === 0
                        ? 'bg-red-50 border-gray-200'
                        : dayOfWeek === 6
                        ? 'bg-blue-50 border-gray-200'
                        : 'bg-white border-gray-200'
                    }`}
                    onClick={() => router.push(`/calendar/date/${format(day, 'yyyy-MM-dd')}`)}
                  >
                    <div className={`text-sm font-bold mb-1 ${
                      isToday
                        ? 'text-pink-500'
                        : isHoliday || dayOfWeek === 0
                        ? 'text-red-600'
                        : dayOfWeek === 6
                        ? 'text-blue-600'
                        : 'text-gray-900'
                    }`}>
                      {format(day, 'd')}
                    </div>

                    <div className="space-y-0.5" onClick={(e) => e.stopPropagation()}>
                      {daySchedules.map((schedule) => {
                        const isOwnSchedule = schedule.userId === user?.uid;
                        const isShared = schedule.isShared;
                        const isMultiDay = isMultiDaySchedule(schedule);

                        let dayIndicator = '';
                        let dayInfo = '';

                        if (isMultiDay) {
                          const dayNum = getScheduleDayNumber(schedule, day);
                          const duration = getScheduleDurationDays(schedule);

                          if (dayNum === 1) {
                            dayIndicator = '◀';
                          } else if (dayNum === duration) {
                            dayIndicator = '▶';
                          } else {
                            dayIndicator = '━';
                          }

                          dayInfo = `${dayNum}/${duration}日`;
                        }

                        return (
                          <Link
                            key={schedule.id}
                            href={`/calendar/date/${format(day, 'yyyy-MM-dd')}`}
                            className={`block text-xs px-1 py-0.5 rounded truncate ${
                              isShared
                                ? 'bg-gradient-to-r from-blue-200 to-cyan-200 text-blue-900 hover:from-blue-300 hover:to-cyan-300'
                                : isOwnSchedule
                                ? 'bg-pink-200 text-pink-900 hover:bg-pink-300'
                                : 'bg-purple-200 text-purple-900 hover:bg-purple-300'
                            }`}
                            title={`${schedule.title}${isMultiDay ? ` (${dayInfo})` : ''}${schedule.startTime ? ` ${schedule.startTime}` : ''}${isShared ? ' (共通)' : ''}`}
                          >
                            {isMultiDay && <span className="mr-1">{dayIndicator}</span>}
                            {schedule.startTime && <span className="font-semibold">{schedule.startTime.substring(0, 5)} </span>}
                            {schedule.title}
                            {isShared && ' ⭐'}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 今日に戻るボタン */}
      <div className="flex justify-center">
        <button
          onClick={() => {
            const today = startOfDay(new Date());
            if (viewMode === 'month') {
              // 4週間表示の場合は、今週の日曜日に戻る
              setStartDate(startOfWeek(today, { weekStartsOn: 0 }));
            } else {
              // 2週間表示の場合は、今日に戻る
              setStartDate(today);
            }
          }}
          className="btn btn-secondary"
        >
          📅 今日に戻る
        </button>
      </div>
    </div>
  );
}
