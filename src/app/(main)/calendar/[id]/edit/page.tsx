'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { doc, getDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { useScheduleCategories, ScheduleCategoryKey } from '@/hooks/useScheduleCategories';
import { Schedule } from '@/types';
import { format, parse } from 'date-fns';
import { ja } from 'date-fns/locale';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

export default function EditSchedulePage() {
  const router = useRouter();
  const params = useParams();
  const scheduleId = params.id as string;
  const { user, userProfile } = useAuth();
  const { categories } = useScheduleCategories(userProfile?.pairId || null);

  const [formData, setFormData] = useState({
    date: '',
    title: '',
    category: 'remote' as ScheduleCategoryKey,
    memo: '',
    isAllDay: true,
    startTime: '09:00',
    endTime: '18:00',
    isShared: false,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

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
          const schedule = scheduleDoc.data() as Schedule;

          // 共通の予定でない場合、自分の予定でなければリダイレクト
          if (!schedule.isShared && schedule.userId !== user?.uid) {
            alert('この予定は編集できません');
            router.push(`/calendar/${scheduleId}`);
            return;
          }

          setFormData({
            date: schedule.date,
            title: schedule.title,
            category: schedule.category,
            memo: schedule.memo || '',
            isAllDay: schedule.isAllDay,
            startTime: schedule.startTime || '09:00',
            endTime: schedule.endTime || '18:00',
            isShared: schedule.isShared || false,
          });
        } else {
          alert('予定が見つかりません');
          router.push('/calendar');
        }
      } catch (error) {
        console.error('Error fetching schedule:', error);
        alert('予定の読み込みに失敗しました');
        router.push('/calendar');
      } finally {
        setLoading(false);
      }
    };

    fetchSchedule();
  }, [userProfile?.pairId, scheduleId, user?.uid, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      if (!userProfile?.pairId) {
        throw new Error('Pair ID not found');
      }

      // タイトルが空の場合はカテゴリ名を使用
      const title = formData.title.trim() || categories[formData.category];

      await updateDoc(doc(db, 'pairs', userProfile.pairId, 'schedules', scheduleId), {
        date: formData.date,
        title,
        category: formData.category,
        memo: formData.memo || null,
        isAllDay: formData.isAllDay,
        startTime: formData.isAllDay ? null : formData.startTime,
        endTime: formData.isAllDay ? null : formData.endTime,
        isShared: formData.isShared,
        updatedAt: Timestamp.now(),
      });

      router.push(`/calendar/${scheduleId}`);
    } catch (err) {
      setError('予定の更新に失敗しました');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto p-4">
        <div className="text-center text-gray-500 py-8">読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4 pb-24">
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h1 className="text-2xl font-bold mb-6">予定を編集</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              日付 *
            </label>
            <DatePicker
              selected={parse(formData.date, 'yyyy-MM-dd', new Date())}
              onChange={(date) => {
                if (date) {
                  setFormData({ ...formData, date: format(date, 'yyyy-MM-dd') });
                }
              }}
              onChangeRaw={(e) => e?.preventDefault()}
              onFocus={(e) => (e.target as HTMLInputElement).blur()}
              dateFormat="yyyy/MM/dd"
              locale={ja}
              className="input w-full"
              required
            />
          </div>

          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              タイトル（任意）
            </label>
            <input
              id="title"
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="input w-full"
              placeholder="空欄の場合はカテゴリ名が使用されます"
            />
          </div>

          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
              カテゴリ *
            </label>
            <select
              id="category"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value as ScheduleCategoryKey })}
              className="input w-full"
              required
            >
              {Object.entries(categories).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.isAllDay}
                onChange={(e) => setFormData({ ...formData, isAllDay: e.target.checked })}
                className="w-4 h-4"
              />
              <span className="text-sm font-medium text-gray-700">終日</span>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.isShared}
                onChange={(e) => setFormData({ ...formData, isShared: e.target.checked })}
                className="w-4 h-4"
              />
              <span className="text-sm font-medium text-gray-700">共通の予定（2人で編集可能）</span>
            </label>
          </div>

          {!formData.isAllDay && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  開始時刻
                </label>
                <DatePicker
                  selected={parse(formData.startTime, 'HH:mm', new Date())}
                  onChange={(date) => {
                    if (date) {
                      setFormData({ ...formData, startTime: format(date, 'HH:mm') });
                    }
                  }}
                  onChangeRaw={(e) => e?.preventDefault()}
                  onFocus={(e) => (e.target as HTMLInputElement).blur()}
                  showTimeSelect
                  showTimeSelectOnly
                  timeIntervals={15}
                  timeCaption="時刻"
                  dateFormat="HH:mm"
                  locale={ja}
                  className="input w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  終了時刻
                </label>
                <DatePicker
                  selected={formData.endTime ? parse(formData.endTime, 'HH:mm', new Date()) : null}
                  onChange={(date) => {
                    if (date) {
                      setFormData({ ...formData, endTime: format(date, 'HH:mm') });
                    }
                  }}
                  onChangeRaw={(e) => e?.preventDefault()}
                  onFocus={(e) => (e.target as HTMLInputElement).blur()}
                  showTimeSelect
                  showTimeSelectOnly
                  timeIntervals={15}
                  timeCaption="時刻"
                  dateFormat="HH:mm"
                  locale={ja}
                  className="input w-full"
                  placeholderText="選択してください"
                />
              </div>
            </div>
          )}

          <div>
            <label htmlFor="memo" className="block text-sm font-medium text-gray-700 mb-2">
              メモ
            </label>
            <textarea
              id="memo"
              value={formData.memo}
              onChange={(e) => setFormData({ ...formData, memo: e.target.value })}
              className="input w-full"
              rows={3}
              placeholder="詳細やメモを入力"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 btn btn-secondary"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 btn btn-primary disabled:opacity-50"
            >
              {saving ? '保存中...' : '保存'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
