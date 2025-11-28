'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { usePair } from '@/hooks/usePair';
import { useSchedules } from '@/hooks/useSchedules';
import { SCHEDULE_CATEGORIES } from '@/types';
import { format, addDays, isSameDay, startOfDay } from 'date-fns';
import { ja } from 'date-fns/locale';

export default function CalendarPage() {
  const { user, userProfile } = useAuth();
  const { partner } = usePair();
  const { schedules, loading } = useSchedules(userProfile?.pairId || null);
  const [startDate, setStartDate] = useState(startOfDay(new Date()));

  // 今日開始で7日間
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(startDate, i));

  const getSchedulesForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return schedules.filter(s => s.date === dateStr);
  };

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
          <h2 className="text-sm md:text-lg font-semibold flex-1 text-center">
            {format(startDate, 'M/d', { locale: ja })} - {format(addDays(startDate, 6), 'M/d', { locale: ja })}
          </h2>
          <button
            onClick={() => setStartDate(addDays(startDate, 7))}
            className="btn btn-secondary px-3 py-2 text-sm flex-shrink-0"
          >
            次の7日間 →
          </button>
        </div>

        {loading ? (
          <p className="text-center text-gray-500 py-8">読み込み中...</p>
        ) : (
          <div className="space-y-4">
            {weekDays.map((day, index) => {
              const daySchedules = getSchedulesForDate(day);
              const isToday = isSameDay(day, new Date());

              return (
                <div
                  key={index}
                  className={`border rounded-lg p-4 ${
                    isToday ? 'bg-pink-50 border-pink-400 border-2' : 'bg-white'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-3 pb-3 border-b">
                    <div className={`text-3xl font-bold ${
                      isToday ? 'text-pink-500' : 'text-gray-900'
                    }`}>
                      {format(day, 'd')}
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">
                        {format(day, 'E', { locale: ja })}
                      </div>
                      <div className="text-xs text-gray-500">
                        {format(day, 'M月d日', { locale: ja })}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {daySchedules.length === 0 ? (
                      <p className="text-sm text-gray-400 text-center py-2">予定なし</p>
                    ) : (
                      daySchedules.map((schedule) => {
                        const isOwnSchedule = schedule.userId === user?.uid;
                        const scheduleName = isOwnSchedule
                          ? userProfile?.displayName || '自分'
                          : partner?.displayName || 'パートナー';

                        return (
                          <Link
                            key={schedule.id}
                            href={`/calendar/${schedule.id}`}
                            className={`block p-3 rounded-lg border-2 ${
                              isOwnSchedule
                                ? 'bg-pink-50 border-pink-300 hover:bg-pink-100'
                                : 'bg-purple-50 border-purple-300 hover:bg-purple-100'
                            }`}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
                                isOwnSchedule
                                  ? 'bg-pink-200 text-pink-800'
                                  : 'bg-purple-200 text-purple-800'
                              }`}>
                                {scheduleName}
                              </span>
                            </div>
                            <div className="font-medium">{schedule.title}</div>
                            {!schedule.isAllDay && schedule.startTime && (
                              <div className="text-sm text-gray-600 mt-1">
                                {schedule.startTime}
                                {schedule.endTime && ` - ${schedule.endTime}`}
                              </div>
                            )}
                          </Link>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 今日に戻るボタン */}
      <div className="flex justify-center">
        <button
          onClick={() => setStartDate(startOfDay(new Date()))}
          className="btn btn-secondary"
        >
          📅 今日に戻る
        </button>
      </div>
    </div>
  );
}
