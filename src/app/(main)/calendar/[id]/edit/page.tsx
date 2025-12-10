'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { doc, getDoc, updateDoc, deleteField, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { useScheduleCategories } from '@/hooks/useScheduleCategories';
import { Schedule } from '@/types';
import { format, parse } from 'date-fns';
import { ja } from 'date-fns/locale';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { toast } from '@/components/ui/Toast';
import Loading from '@/components/ui/Loading';
import { showErrorToast } from '@/utils/errorHandling';

export default function EditSchedulePage() {
  const router = useRouter();
  const params = useParams();
  const scheduleId = params.id as string;
  const { user, userProfile } = useAuth();
  const { categories, categoryOrder } = useScheduleCategories(userProfile?.pairId || null);

  const [formData, setFormData] = useState({
    date: '',
    endDate: '', // 複数日予定の終了日
    isMultiDay: false, // 複数日予定かどうか
    title: '',
    category: '' as string | null,
    memo: '',
    isAllDay: true,
    startTime: '09:00',
    endTime: '18:00',
    isShared: false,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // 複数日予定のチェック変更時
  const handleMultiDayChange = (checked: boolean) => {
    if (checked) {
      setFormData({
        ...formData,
        isMultiDay: true,
        isAllDay: true, // 強制的に終日に
        endDate: formData.date // デフォルトは開始日と同じ
      });
    } else {
      setFormData({
        ...formData,
        isMultiDay: false,
        endDate: ''
      });
    }
  };

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
            toast.error('この予定は編集できません');
            router.push(`/calendar/${scheduleId}`);
            return;
          }

          setFormData({
            date: schedule.date,
            endDate: schedule.endDate || '',
            isMultiDay: !!schedule.endDate && schedule.endDate > schedule.date,
            title: schedule.title,
            category: schedule.category,
            memo: schedule.memo || '',
            isAllDay: schedule.isAllDay,
            startTime: schedule.startTime || '09:00',
            endTime: schedule.endTime || '18:00',
            isShared: schedule.isShared || false,
          });
        } else {
          toast.error('予定が見つかりません');
          router.push('/calendar');
        }
      } catch (error) {
        showErrorToast(error, 'fetchSchedule');
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

      // バリデーション：複数日予定の場合、終了日が開始日以降であること
      if (formData.isMultiDay && formData.endDate && formData.endDate < formData.date) {
        setError('終了日は開始日以降の日付を指定してください');
        setSaving(false);
        return;
      }

      // タイトルが空の場合はカテゴリ名を使用（カテゴリがある場合）
      const title = formData.title.trim() || (formData.category && categories[formData.category]) || '予定';

      const updateData: Partial<Schedule> & { updatedAt: Timestamp } = {
        date: formData.date,
        title,
        category: formData.category,
        memo: formData.memo || null,
        isAllDay: formData.isAllDay,
        startTime: formData.isAllDay ? null : formData.startTime,
        endTime: formData.isAllDay ? null : formData.endTime,
        isShared: formData.isShared,
        updatedAt: Timestamp.now(),
      };

      // 複数日予定の場合はendDateを追加、そうでない場合は削除
      if (formData.isMultiDay && formData.endDate) {
        updateData.endDate = formData.endDate;
      } else {
        // @ts-expect-error - deleteField()はFirestoreの特殊な値で、型システムでは表現できない
        updateData.endDate = deleteField();
      }

      await updateDoc(doc(db, 'pairs', userProfile.pairId, 'schedules', scheduleId), updateData);

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
        <Loading />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4 pb-32">
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

          {categoryOrder.length > 0 && (
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                カテゴリ
              </label>
              <select
                id="category"
                value={formData.category || ''}
                onChange={(e) => setFormData({ ...formData, category: e.target.value || null })}
                className="input w-full"
              >
                <option value="">カテゴリなし</option>
                {categoryOrder.map((key) => (
                  <option key={key} value={key}>
                    {categories[key]}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="space-y-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.isAllDay}
                onChange={(e) => setFormData({ ...formData, isAllDay: e.target.checked })}
                disabled={formData.isMultiDay}
                className="w-4 h-4"
              />
              <span className="text-sm font-medium text-gray-700">
                終日
                {formData.isMultiDay && ' (複数日予定は終日のみ)'}
              </span>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.isMultiDay}
                onChange={(e) => handleMultiDayChange(e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-sm font-medium text-gray-700">複数日にまたがる予定</span>
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

          {formData.isMultiDay && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                終了日 *
              </label>
              <DatePicker
                selected={formData.endDate ? parse(formData.endDate, 'yyyy-MM-dd', new Date()) : null}
                onChange={(date) => {
                  if (date) {
                    setFormData({ ...formData, endDate: format(date, 'yyyy-MM-dd') });
                  }
                }}
                onChangeRaw={(e) => e?.preventDefault()}
                onFocus={(e) => (e.target as HTMLInputElement).blur()}
                minDate={parse(formData.date, 'yyyy-MM-dd', new Date())}
                dateFormat="yyyy/MM/dd"
                locale={ja}
                className="input w-full"
                placeholderText="終了日を選択"
                required
              />
            </div>
          )}

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
