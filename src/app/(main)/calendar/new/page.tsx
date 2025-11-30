'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useSchedules } from '@/hooks/useSchedules';
import { useScheduleCategories, ScheduleCategoryKey } from '@/hooks/useScheduleCategories';
import { format, parse } from 'date-fns';
import { ja } from 'date-fns/locale';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

export default function NewSchedulePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { userProfile } = useAuth();
  const { addSchedule } = useSchedules(userProfile?.pairId || null);
  const { categories } = useScheduleCategories(userProfile?.pairId || null);

  // クエリパラメータから日付を取得、なければ今日
  const dateParam = searchParams.get('date');
  const initialDate = dateParam || format(new Date(), 'yyyy-MM-dd');

  const [formData, setFormData] = useState({
    date: initialDate,
    title: '',
    category: 'remote' as ScheduleCategoryKey,
    memo: '',
    isAllDay: true,
    startTime: '09:00',
    endTime: '18:00',
    isShared: false,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // タイトルが空の場合はカテゴリ名を使用
      const title = formData.title.trim() || categories[formData.category];

      await addSchedule({
        date: formData.date,
        title,
        category: formData.category,
        memo: formData.memo || null,
        isAllDay: formData.isAllDay,
        startTime: formData.isAllDay ? null : formData.startTime,
        endTime: formData.isAllDay ? null : formData.endTime,
        isShared: formData.isShared,
        repeat: {
          pattern: 'none',
        },
      });

      router.push('/calendar');
    } catch (err) {
      setError('予定の登録に失敗しました');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="card">
        <h1 className="text-2xl font-bold mb-6">予定を追加</h1>

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
                  selected={parse(formData.endTime, 'HH:mm', new Date())}
                  onChange={(date) => {
                    if (date) {
                      setFormData({ ...formData, endTime: format(date, 'HH:mm') });
                    }
                  }}
                  showTimeSelect
                  showTimeSelectOnly
                  timeIntervals={15}
                  timeCaption="時刻"
                  dateFormat="HH:mm"
                  locale={ja}
                  className="input w-full"
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
              disabled={loading}
              className="flex-1 btn btn-primary disabled:opacity-50"
            >
              {loading ? '登録中...' : '登録'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
