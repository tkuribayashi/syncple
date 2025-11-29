'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuickMessages } from '@/hooks/useQuickMessages';
import { useScheduleCategories, ScheduleCategoryKey, ScheduleCategoryMap } from '@/hooks/useScheduleCategories';

type CalendarViewMode = '2weeks' | 'month';

export default function SettingsPage() {
  const { signOut, userProfile, updateDisplayName, fcm } = useAuth();
  const { quickMessages: loadedMessages, loading: loadingMessages, saveQuickMessages } = useQuickMessages(userProfile?.pairId || null);
  const { categories: loadedCategories, loading: loadingCategories, saveCategories } = useScheduleCategories(userProfile?.pairId || null);
  const [quickMessages, setQuickMessages] = useState<string[]>([]);
  const [categories, setCategories] = useState<ScheduleCategoryMap>({
    remote: '',
    office: '',
    business_trip: '',
    vacation: '',
    outing: '',
    other: '',
  });
  const [editingMessage, setEditingMessage] = useState<{index: number, value: string} | null>(null);
  const [editingCategory, setEditingCategory] = useState<{key: ScheduleCategoryKey, value: string} | null>(null);
  const [saving, setSaving] = useState(false);
  const [editingDisplayName, setEditingDisplayName] = useState(false);
  const [newDisplayName, setNewDisplayName] = useState('');
  const [calendarViewMode, setCalendarViewMode] = useState<CalendarViewMode>('2weeks');

  useEffect(() => {
    if (!loadingMessages) {
      setQuickMessages([...loadedMessages]);
    }
  }, [loadedMessages, loadingMessages]);

  useEffect(() => {
    if (!loadingCategories) {
      setCategories({ ...loadedCategories });
    }
  }, [loadedCategories, loadingCategories]);

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

  const handleSaveMessage = async (index: number, newValue: string) => {
    if (!newValue.trim()) {
      // 空の場合は保存せずにキャンセル扱い
      alert('メッセージを入力してください');
      return;
    }

    const updated = [...quickMessages];
    updated[index] = newValue.trim();
    setQuickMessages(updated);
    setEditingMessage(null);

    setSaving(true);
    try {
      await saveQuickMessages(updated);
    } catch (error) {
      console.error('Error saving message:', error);
      alert('メッセージの保存に失敗しました');
      // 保存失敗時は編集モードに戻す
      setEditingMessage({ index, value: newValue });
    } finally {
      setSaving(false);
    }
  };

  const handleAddMessage = () => {
    if (quickMessages.length >= 12) return;

    // 空のメッセージを追加して、即座に編集モードに入る
    const newIndex = quickMessages.length;
    setQuickMessages([...quickMessages, '']);
    setEditingMessage({ index: newIndex, value: '' });
  };

  const handleDeleteMessage = async (index: number) => {
    if (quickMessages.length <= 1) return;

    const updated = quickMessages.filter((_, i) => i !== index);
    setQuickMessages(updated);

    setSaving(true);
    try {
      await saveQuickMessages(updated);
    } catch (error) {
      console.error('Error deleting message:', error);
      alert('メッセージの削除に失敗しました');
      // 削除失敗時は元に戻す
      setQuickMessages([...quickMessages]);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveCategory = async (key: ScheduleCategoryKey, newValue: string) => {
    if (!newValue.trim()) return;

    const updated = { ...categories, [key]: newValue.trim() };
    setCategories(updated);
    setEditingCategory(null);

    setSaving(true);
    try {
      await saveCategories(updated);
    } catch (error) {
      console.error('Error saving category:', error);
      alert('カテゴリの保存に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveDisplayName = async () => {
    if (!newDisplayName.trim()) {
      alert('表示名を入力してください');
      return;
    }

    setSaving(true);
    try {
      await updateDisplayName(newDisplayName);
      setEditingDisplayName(false);
      setNewDisplayName('');
    } catch (error) {
      console.error('Error updating display name:', error);
      alert('表示名の更新に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  const handleStartEditingDisplayName = () => {
    setNewDisplayName(userProfile?.displayName || '');
    setEditingDisplayName(true);
  };

  if (loadingMessages || loadingCategories) {
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
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-gray-900">クイックメッセージ</h2>
          <button
            onClick={handleAddMessage}
            disabled={quickMessages.length >= 12 || saving}
            className="btn btn-primary text-sm py-2 disabled:opacity-50"
          >
            {saving ? '保存中...' : '+ 追加'}
          </button>
        </div>

        <div className="space-y-3">
          {quickMessages.map((message, index) => (
            <div key={index} className="flex gap-2">
              {editingMessage?.index === index ? (
                <>
                  <input
                    type="text"
                    value={editingMessage.value}
                    onChange={(e) => setEditingMessage({index, value: e.target.value})}
                    className="input flex-1"
                    autoFocus
                  />
                  <button
                    onClick={() => handleSaveMessage(index, editingMessage.value)}
                    disabled={saving}
                    className="btn btn-primary px-4 disabled:opacity-50"
                  >
                    {saving ? '保存中...' : '保存'}
                  </button>
                  <button
                    onClick={() => {
                      // 空のメッセージ（新規追加中）の場合は削除
                      if (quickMessages[index] === '' && editingMessage.value === '') {
                        setQuickMessages(quickMessages.filter((_, i) => i !== index));
                      }
                      setEditingMessage(null);
                    }}
                    disabled={saving}
                    className="btn btn-secondary px-4 disabled:opacity-50"
                  >
                    キャンセル
                  </button>
                </>
              ) : (
                <>
                  <div className="flex-1 bg-purple-50 p-3 rounded-lg">
                    {message}
                  </div>
                  <button
                    onClick={() => setEditingMessage({index, value: message})}
                    disabled={saving}
                    className="btn btn-secondary px-4 disabled:opacity-50"
                  >
                    編集
                  </button>
                  <button
                    onClick={() => handleDeleteMessage(index)}
                    disabled={quickMessages.length <= 1 || saving}
                    className="btn btn-secondary px-4 disabled:opacity-50"
                  >
                    削除
                  </button>
                </>
              )}
            </div>
          ))}
        </div>

        <p className="text-xs text-gray-500 mt-4">
          ※ クイックメッセージは最大12個まで設定できます
        </p>
      </div>

      {/* 予定カテゴリ設定 */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">予定カテゴリ</h2>
        <div className="space-y-3">
          {(Object.keys(categories) as ScheduleCategoryKey[]).map((key) => (
            <div key={key} className="flex gap-2">
              {editingCategory?.key === key ? (
                <>
                  <input
                    type="text"
                    value={editingCategory.value}
                    onChange={(e) => setEditingCategory({key, value: e.target.value})}
                    className="input flex-1"
                    autoFocus
                  />
                  <button
                    onClick={() => handleSaveCategory(key, editingCategory.value)}
                    disabled={saving}
                    className="btn btn-primary px-4 disabled:opacity-50"
                  >
                    {saving ? '保存中...' : '保存'}
                  </button>
                  <button
                    onClick={() => setEditingCategory(null)}
                    disabled={saving}
                    className="btn btn-secondary px-4 disabled:opacity-50"
                  >
                    キャンセル
                  </button>
                </>
              ) : (
                <>
                  <div className="flex-1 bg-purple-50 p-3 rounded-lg">
                    {categories[key]}
                  </div>
                  <button
                    onClick={() => setEditingCategory({key, value: categories[key]})}
                    disabled={saving}
                    className="btn btn-secondary px-4 disabled:opacity-50"
                  >
                    編集
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* カレンダー表示設定 */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">カレンダー表示</h2>
        <div className="space-y-3">
          <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
            <input
              type="radio"
              name="calendarViewMode"
              value="2weeks"
              checked={calendarViewMode === '2weeks'}
              onChange={() => handleChangeCalendarViewMode('2weeks')}
              className="w-4 h-4"
            />
            <div className="flex-1">
              <div className="font-medium text-gray-900">2週間表示</div>
              <div className="text-xs text-gray-500">14日分を2列で表示（デフォルト）</div>
            </div>
          </label>

          <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
            <input
              type="radio"
              name="calendarViewMode"
              value="month"
              checked={calendarViewMode === 'month'}
              onChange={() => handleChangeCalendarViewMode('month')}
              className="w-4 h-4"
            />
            <div className="flex-1">
              <div className="font-medium text-gray-900">1ヶ月表示</div>
              <div className="text-xs text-gray-500">30日分をカレンダーグリッドで表示</div>
            </div>
          </label>
        </div>
      </div>

      {/* 通知設定 */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">プッシュ通知</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">通知の状態</p>
              <p className="text-xs text-gray-500 mt-1">
                {fcm.notificationPermission === 'granted' && '✅ 通知が有効です'}
                {fcm.notificationPermission === 'denied' && '❌ 通知が拒否されています'}
                {fcm.notificationPermission === 'default' && '⚠️ 通知が未設定です'}
              </p>
            </div>
            {fcm.notificationPermission === 'default' && (
              <button
                onClick={async () => {
                  const granted = await fcm.requestPermission();
                  if (granted) {
                    alert('通知が有効になりました！');
                  } else {
                    alert('通知が拒否されました。ブラウザの設定から変更できます。');
                  }
                }}
                disabled={fcm.isRequesting}
                className="btn btn-primary px-6 disabled:opacity-50"
              >
                {fcm.isRequesting ? '設定中...' : '通知を有効にする'}
              </button>
            )}
          </div>
          {fcm.notificationPermission === 'denied' && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800">
                通知が拒否されています。ブラウザまたはiOSの設定から通知を許可してください。
              </p>
              <p className="text-xs text-red-600 mt-2">
                iOS: 設定 → Safari → Webサイトの設定 → 通知
              </p>
            </div>
          )}
          {fcm.notificationPermission === 'granted' && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-green-800">
                パートナーからメッセージや予定が届くとプッシュ通知でお知らせします。
              </p>
            </div>
          )}
        </div>
      </div>

      {/* アカウント */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">アカウント</h2>

        {/* 表示名設定 */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            表示名
          </label>
          {editingDisplayName ? (
            <div className="flex gap-2">
              <input
                type="text"
                value={newDisplayName}
                onChange={(e) => setNewDisplayName(e.target.value)}
                className="input flex-1"
                autoFocus
                maxLength={50}
              />
              <button
                onClick={handleSaveDisplayName}
                disabled={saving}
                className="btn btn-primary px-4 disabled:opacity-50"
              >
                {saving ? '保存中...' : '保存'}
              </button>
              <button
                onClick={() => {
                  setEditingDisplayName(false);
                  setNewDisplayName('');
                }}
                disabled={saving}
                className="btn btn-secondary px-4 disabled:opacity-50"
              >
                キャンセル
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <div className="flex-1 bg-purple-50 p-3 rounded-lg">
                {userProfile?.displayName || '未設定'}
              </div>
              <button
                onClick={handleStartEditingDisplayName}
                disabled={saving}
                className="btn btn-secondary px-4 disabled:opacity-50"
              >
                編集
              </button>
            </div>
          )}
        </div>

        <button
          onClick={signOut}
          className="w-full bg-red-500 hover:bg-red-600 text-white rounded-xl py-3 font-medium"
        >
          ログアウト
        </button>
      </div>
    </div>
  );
}
