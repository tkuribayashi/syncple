'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuickMessages } from '@/hooks/useQuickMessages';
import { useScheduleCategories, ScheduleCategoryKey, ScheduleCategoryMap } from '@/hooks/useScheduleCategories';

export default function SettingsPage() {
  const { signOut, userProfile } = useAuth();
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

      {/* アカウント */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">アカウント</h2>
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
