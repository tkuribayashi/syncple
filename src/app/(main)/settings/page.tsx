'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuickMessages } from '@/hooks/useQuickMessages';
import { useScheduleCategories } from '@/hooks/useScheduleCategories';
import { useDinnerStatusOptions } from '@/hooks/useDinnerStatusOptions';
import QuickMessagesSection from './components/QuickMessagesSection';
import ScheduleCategoriesSection from './components/ScheduleCategoriesSection';
import DinnerStatusSection from './components/DinnerStatusSection';
import CalendarViewSection from './components/CalendarViewSection';
import NotificationSection from './components/NotificationSection';
import DisplayNameSection from './components/DisplayNameSection';

type CalendarViewMode = '2weeks' | 'month';

export default function SettingsPage() {
  const { signOut, userProfile, updateDisplayName, fcm } = useAuth();
  const { quickMessages, loading: loadingMessages, saveQuickMessages } = useQuickMessages(userProfile?.pairId || null);
  const {
    categories,
    categoryOrder,
    loading: loadingCategories,
    saveCategories,
    reorderCategories,
    addCategory,
    deleteCategory,
    getCategoryUsageCount,
  } = useScheduleCategories(userProfile?.pairId || null);
  const {
    statuses: dinnerStatuses,
    statusOrder,
    loading: loadingStatuses,
    saveStatuses,
    reorderStatuses,
    addStatus,
    deleteStatus,
    getStatusUsageCount,
  } = useDinnerStatusOptions(userProfile?.pairId || null);
  const [saving, setSaving] = useState(false);

  // カレンダー表示モードをlocalStorageから読み込む（初期値のみ）
  const [calendarViewMode, setCalendarViewMode] = useState<CalendarViewMode>(() => {
    if (typeof window === 'undefined') return '2weeks';
    const saved = localStorage.getItem('calendarViewMode');
    return (saved === '2weeks' || saved === 'month') ? saved : '2weeks';
  });

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
        saveQuickMessages={saveQuickMessages}
        saving={saving}
        setSaving={setSaving}
      />

      {/* 予定カテゴリ設定 */}
      <ScheduleCategoriesSection
        categories={categories}
        categoryOrder={categoryOrder}
        saveCategories={saveCategories}
        reorderCategories={reorderCategories}
        addCategory={addCategory}
        deleteCategory={deleteCategory}
        getCategoryUsageCount={getCategoryUsageCount}
        saving={saving}
        setSaving={setSaving}
      />

      {/* 晩ご飯ステータス設定 */}
      <DinnerStatusSection
        dinnerStatuses={dinnerStatuses}
        statusOrder={statusOrder}
        saveStatuses={saveStatuses}
        reorderStatuses={reorderStatuses}
        addStatus={addStatus}
        deleteStatus={deleteStatus}
        getStatusUsageCount={getStatusUsageCount}
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
