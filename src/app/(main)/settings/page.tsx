'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuickMessages } from '@/hooks/useQuickMessages';
import { useScheduleCategories, ScheduleCategoryKey, ScheduleCategoryMap } from '@/hooks/useScheduleCategories';
import { useDinnerStatusOptions, DinnerStatusMap } from '@/hooks/useDinnerStatusOptions';
import { DinnerStatusType } from '@/types';
import QuickMessagesSection from './components/QuickMessagesSection';
import ScheduleCategoriesSection from './components/ScheduleCategoriesSection';
import DinnerStatusSection from './components/DinnerStatusSection';
import CalendarViewSection from './components/CalendarViewSection';
import NotificationSection from './components/NotificationSection';
import DisplayNameSection from './components/DisplayNameSection';

type CalendarViewMode = '2weeks' | 'month';

export default function SettingsPage() {
  const { signOut, userProfile, updateDisplayName, fcm } = useAuth();
  const { quickMessages: loadedMessages, loading: loadingMessages, saveQuickMessages } = useQuickMessages(userProfile?.pairId || null);
  const { categories: loadedCategories, categoryOrder: loadedCategoryOrder, loading: loadingCategories, saveCategories, reorderCategories } = useScheduleCategories(userProfile?.pairId || null);
  const { statuses: loadedStatuses, statusOrder: loadedStatusOrder, loading: loadingStatuses, saveStatuses, reorderStatuses } = useDinnerStatusOptions(userProfile?.pairId || null);
  const [quickMessages, setQuickMessages] = useState<string[]>([]);
  const [categories, setCategories] = useState<ScheduleCategoryMap>({
    remote: '',
    office: '',
    business_trip: '',
    vacation: '',
    outing: '',
    other: '',
  });
  const [categoryOrder, setCategoryOrder] = useState<ScheduleCategoryKey[]>([
    'remote',
    'office',
    'business_trip',
    'vacation',
    'outing',
    'other',
  ]);
  const [dinnerStatuses, setDinnerStatuses] = useState<DinnerStatusMap>({
    alone: '',
    cooking: '',
    cooking_together: '',
    undecided: '',
  });
  const [statusOrder, setStatusOrder] = useState<DinnerStatusType[]>([
    'alone',
    'cooking',
    'cooking_together',
    'undecided',
  ]);
  const [saving, setSaving] = useState(false);
  const [calendarViewMode, setCalendarViewMode] = useState<CalendarViewMode>('2weeks');

  useEffect(() => {
    if (!loadingMessages) {
      setQuickMessages([...loadedMessages]);
    }
  }, [loadedMessages, loadingMessages]);

  useEffect(() => {
    if (!loadingCategories) {
      setCategories({ ...loadedCategories });
      setCategoryOrder([...loadedCategoryOrder]);
    }
  }, [loadedCategories, loadedCategoryOrder, loadingCategories]);

  useEffect(() => {
    if (!loadingStatuses) {
      setDinnerStatuses({ ...loadedStatuses });
      setStatusOrder([...loadedStatusOrder]);
    }
  }, [loadedStatuses, loadedStatusOrder, loadingStatuses]);

  // カレンダー表示モードをlocalStorageから読み込む
  useEffect(() => {
    const saved = localStorage.getItem('calendarViewMode');
    if (saved && (saved === '2weeks' || saved === 'month')) {
      setCalendarViewMode(saved as CalendarViewMode);
    }
  }, []);

  const handleChangeCalendarViewMode = (mode: CalendarViewMode) => {
    setCalendarViewMode(mode);
    localStorage.setItem('calendarViewMode', mode);
  };

  if (loadingMessages || loadingCategories || loadingStatuses) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4 pb-24 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">設定</h1>

      {/* クイックメッセージ設定 */}
      <QuickMessagesSection
        quickMessages={quickMessages}
        setQuickMessages={setQuickMessages}
        saveQuickMessages={saveQuickMessages}
        saving={saving}
        setSaving={setSaving}
      />

      {/* 予定カテゴリ設定 */}
      <ScheduleCategoriesSection
        categories={categories}
        categoryOrder={categoryOrder}
        setCategories={setCategories}
        setCategoryOrder={setCategoryOrder}
        saveCategories={saveCategories}
        reorderCategories={reorderCategories}
        saving={saving}
        setSaving={setSaving}
      />

      {/* 晩ご飯ステータス設定 */}
      <DinnerStatusSection
        dinnerStatuses={dinnerStatuses}
        statusOrder={statusOrder}
        setDinnerStatuses={setDinnerStatuses}
        setStatusOrder={setStatusOrder}
        saveStatuses={saveStatuses}
        reorderStatuses={reorderStatuses}
        saving={saving}
        setSaving={setSaving}
      />

      {/* カレンダー表示設定 */}
      <CalendarViewSection
        calendarViewMode={calendarViewMode}
        onChangeMode={handleChangeCalendarViewMode}
      />

      {/* 通知設定 */}
      <NotificationSection fcm={fcm} />

      {/* アカウント */}
      <DisplayNameSection
        userProfile={userProfile}
        updateDisplayName={updateDisplayName}
        signOut={signOut}
        saving={saving}
        setSaving={setSaving}
      />
    </div>
  );
}
