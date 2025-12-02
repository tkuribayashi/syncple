'use client';

import { useState } from 'react';
import { User } from '@/types';
import { toast } from '@/components/ui/Toast';
import { showErrorToast } from '@/utils/errorHandling';

interface DisplayNameSectionProps {
  userProfile: User | null;
  updateDisplayName: (displayName: string) => Promise<void>;
  signOut: () => Promise<void>;
  saving: boolean;
  setSaving: (saving: boolean) => void;
}

export default function DisplayNameSection({
  userProfile,
  updateDisplayName,
  signOut,
  saving,
  setSaving,
}: DisplayNameSectionProps) {
  const [editingDisplayName, setEditingDisplayName] = useState(false);
  const [newDisplayName, setNewDisplayName] = useState('');

  const handleSaveDisplayName = async () => {
    if (!newDisplayName.trim()) {
      toast.error('表示名を入力してください');
      return;
    }

    setSaving(true);
    try {
      await updateDisplayName(newDisplayName);
      setEditingDisplayName(false);
      setNewDisplayName('');
    } catch (error) {
      showErrorToast(error, 'updateDisplayName');
    } finally {
      setSaving(false);
    }
  };

  const handleStartEditingDisplayName = () => {
    setNewDisplayName(userProfile?.displayName || '');
    setEditingDisplayName(true);
  };

  return (
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
  );
}
