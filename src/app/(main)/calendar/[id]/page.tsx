'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { doc, getDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { usePair } from '@/hooks/usePair';
import { useScheduleCategories } from '@/hooks/useScheduleCategories';
import { Schedule } from '@/types';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

export default function ScheduleDetailPage() {
  const router = useRouter();
  const params = useParams();
  const scheduleId = params.id as string;
  const { user, userProfile } = useAuth();
  const { partner } = usePair();
  const { categories } = useScheduleCategories(userProfile?.pairId || null);
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const fetchSchedule = async () => {
      if (!userProfile?.pairId || !scheduleId) {
        setLoading(false);
        return;
      }

      try {
        const scheduleDoc = await getDoc(
          doc(db, 'pairs', userProfile.pairId, 'schedules', scheduleId)
        );

        if (scheduleDoc.exists()) {
          setSchedule({ id: scheduleDoc.id, ...scheduleDoc.data() } as Schedule);
        } else {
          alert('予定が見つかりません');
          router.push('/calendar');
        }
      } catch (error) {
        console.error('Error fetching schedule:', error);
        alert('予定の読み込みに失敗しました');
      } finally {
        setLoading(false);
      }
    };

    fetchSchedule();
  }, [userProfile?.pairId, scheduleId, router]);

  const handleDelete = async () => {
    if (!userProfile?.pairId || !scheduleId) return;

    const confirmed = confirm('この予定を削除しますか？');
    if (!confirmed) return;

    setDeleting(true);
    try {
      await deleteDoc(doc(db, 'pairs', userProfile.pairId, 'schedules', scheduleId));
      router.push('/calendar');
    } catch (error) {
      console.error('Error deleting schedule:', error);
      alert('予定の削除に失敗しました');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto p-4">
        <div className="text-center text-gray-500 py-8">読み込み中...</div>
      </div>
    );
  }

  if (!schedule) {
    return null;
  }

  const isMySchedule = schedule.userId === user?.uid;
  const ownerName = isMySchedule ? 'あなた' : partner?.displayName || 'パートナー';

  return (
    <div className="max-w-2xl mx-auto p-4 pb-24">
      <div className="mb-4">
        <Link href="/calendar" className="text-blue-600 hover:text-blue-700">
          ← カレンダーに戻る
        </Link>
      </div>

      <div className="bg-white rounded-2xl shadow-lg p-6 space-y-6">
        {/* タイトル */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{schedule.title}</h1>
          <p className="text-sm text-gray-500 mt-1">{ownerName}の予定</p>
        </div>

        {/* 日付と時間 */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="text-2xl">📅</div>
            <div>
              <p className="text-sm text-gray-600">日付</p>
              <p className="text-lg font-semibold">
                {format(new Date(schedule.date), 'M月d日(E)', { locale: ja })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-2xl">🏷️</div>
            <div>
              <p className="text-sm text-gray-600">カテゴリー</p>
              <p className="text-lg font-semibold">
                {categories[schedule.category]}
              </p>
            </div>
          </div>

          {!schedule.isAllDay && schedule.startTime && (
            <div className="flex items-center gap-3">
              <div className="text-2xl">⏰</div>
              <div>
                <p className="text-sm text-gray-600">時間</p>
                <p className="text-lg font-semibold">
                  {schedule.startTime}
                  {schedule.endTime && ` - ${schedule.endTime}`}
                </p>
              </div>
            </div>
          )}

          {schedule.isAllDay && (
            <div className="flex items-center gap-3">
              <div className="text-2xl">⏰</div>
              <div>
                <p className="text-sm text-gray-600">時間</p>
                <p className="text-lg font-semibold">終日</p>
              </div>
            </div>
          )}
        </div>

        {/* メモ */}
        {schedule.memo && (
          <div>
            <p className="text-sm text-gray-600 mb-2">メモ</p>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-gray-900 whitespace-pre-wrap">{schedule.memo}</p>
            </div>
          </div>
        )}

        {/* 繰り返し */}
        {schedule.repeat.pattern !== 'none' && (
          <div>
            <p className="text-sm text-gray-600 mb-2">繰り返し</p>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-gray-900">
                {schedule.repeat.pattern === 'daily' && '毎日'}
                {schedule.repeat.pattern === 'weekly' && '毎週'}
                {schedule.repeat.pattern === 'monthly' && '毎月'}
                {schedule.repeat.endDate && (
                  <span className="text-gray-600">
                    {' '}（{format(new Date(schedule.repeat.endDate), 'M月d日', { locale: ja })}まで）
                  </span>
                )}
              </p>
            </div>
          </div>
        )}

        {/* アクションボタン */}
        <div className="space-y-3 pt-4">
          {isMySchedule && (
            <>
              <Link
                href={`/calendar/${scheduleId}/edit`}
                className="block w-full btn btn-primary py-3 text-center"
              >
                ✏️ 編集する
              </Link>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="w-full bg-red-500 hover:bg-red-600 text-white rounded-xl py-3 font-medium disabled:opacity-50"
              >
                {deleting ? '削除中...' : '🗑️ 削除する'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
