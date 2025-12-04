'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useSchedules } from '@/hooks/useSchedules';
import { useScheduleCategories } from '@/hooks/useScheduleCategories';
import { usePair } from '@/hooks/usePair';
import { Schedule } from '@/types';
import { format, parse } from 'date-fns';
import { ja } from 'date-fns/locale';
import { getSchedulesForDate, isMultiDaySchedule, getScheduleDayNumber, getScheduleDurationDays } from '@/utils/scheduleHelpers';
import Loading from '@/components/ui/Loading';

export default function DailyDetailPage() {
  const router = useRouter();
  const params = useParams();
  const dateStr = params.date as string; // "YYYY-MM-DD"
  const { user, userProfile } = useAuth();
  const { schedules, loading } = useSchedules(userProfile?.pairId || null);
  const { categories } = useScheduleCategories(userProfile?.pairId || null);
  const { partner } = usePair();

  const [date, setDate] = useState<Date | null>(null);
  const [dailySchedules, setDailySchedules] = useState<Schedule[]>([]);

  useEffect(() => {
    if (!dateStr) return;

    try {
      const parsedDate = parse(dateStr, 'yyyy-MM-dd', new Date());
      setDate(parsedDate);

      if (schedules.length > 0) {
        const schedulesForDate = getSchedulesForDate(schedules, parsedDate);
        setDailySchedules(schedulesForDate);
      } else {
        setDailySchedules([]);
      }
    } catch (error) {
      console.error('Invalid date format:', error);
      router.push('/calendar');
    }
  }, [dateStr, schedules, router]);

  if (loading || !date) {
    return (
      <div className="max-w-2xl mx-auto p-4">
        <Loading />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4 pb-24">
      {/* ヘッダー */}
      <div className="mb-4">
        <Link href="/calendar" className="inline-block btn btn-secondary">
          ← カレンダーに戻る
        </Link>
      </div>

      {/* 日付表示 */}
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {format(date, 'M月d日(E)', { locale: ja })}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {dailySchedules.length}件の予定
        </p>
      </div>

      {/* 予定一覧 */}
      <div className="space-y-4">
        {dailySchedules.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-6 text-center text-gray-500">
            この日の予定はありません
          </div>
        ) : (
          dailySchedules.map((schedule) => {
            const isMine = schedule.userId === user?.uid;
            const isShared = schedule.isShared;
            const isMultiDay = isMultiDaySchedule(schedule);
            const ownerName = isMine ? 'あなた' : partner?.displayName || 'パートナー';

            let dayInfo = '';
            if (isMultiDay) {
              const dayNum = getScheduleDayNumber(schedule, date);
              const duration = getScheduleDurationDays(schedule);
              dayInfo = `${dayNum}日目/${duration}日間`;
            }

            return (
              <Link
                key={schedule.id}
                href={`/calendar/${schedule.id}`}
                className="block bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow"
              >
                {/* 時間表示 */}
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                  {schedule.isAllDay ? (
                    <span className="font-medium">終日</span>
                  ) : (
                    <span className="font-medium">
                      {schedule.startTime}
                      {schedule.endTime && schedule.endTime !== schedule.startTime && ` - ${schedule.endTime}`}
                    </span>
                  )}
                  {isMultiDay && (
                    <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">
                      {dayInfo}
                    </span>
                  )}
                </div>

                {/* タイトル */}
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  {schedule.title}
                  {isShared && ' ⭐'}
                </h3>

                {/* カテゴリとオーナー */}
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="bg-gray-100 px-2 py-1 rounded">
                    {categories[schedule.category]}
                  </span>
                  <span>
                    {isShared ? '共通の予定' : ownerName}
                  </span>
                </div>

                {/* メモ（あれば） */}
                {schedule.memo && (
                  <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                    {schedule.memo}
                  </p>
                )}
              </Link>
            );
          })
        )}
      </div>

      {/* 予定追加ボタン */}
      <div className="mt-6">
        <Link
          href={`/calendar/new?date=${dateStr}`}
          className="block w-full btn btn-primary py-4 text-center text-lg"
        >
          + 予定を追加
        </Link>
      </div>
    </div>
  );
}
