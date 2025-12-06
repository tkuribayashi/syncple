'use client';

import { useState } from 'react';
import { DinnerStatusMap, DinnerStatusKey } from '@/hooks/useDinnerStatusOptions';
import DraggableList from '@/components/DraggableList';
import EditableListItem from '@/components/EditableListItem';
import DeleteConfirmModal from '@/components/DeleteConfirmModal';
import { showErrorToast, showSuccessToast } from '@/utils/errorHandling';
import { DINNER_STATUS } from '@/constants/app';

const EMPTY_STATUS_LABEL = 'ステータスなし';

interface DinnerStatusSectionProps {
  dinnerStatuses: DinnerStatusMap;
  statusOrder: DinnerStatusKey[];
  setDinnerStatuses: (statuses: DinnerStatusMap) => void;
  setStatusOrder: (order: DinnerStatusKey[]) => void;
  saveStatuses: (statuses: DinnerStatusMap) => Promise<void>;
  reorderStatuses: (order: DinnerStatusKey[]) => Promise<void>;
  addStatus: (label: string) => Promise<DinnerStatusKey>;
  deleteStatus: (key: DinnerStatusKey) => Promise<void>;
  getStatusUsageCount: (key: DinnerStatusKey) => Promise<number>;
  saving: boolean;
  setSaving: (saving: boolean) => void;
}

export default function DinnerStatusSection({
  dinnerStatuses,
  statusOrder,
  setDinnerStatuses,
  setStatusOrder,
  saveStatuses,
  reorderStatuses,
  addStatus,
  deleteStatus,
  getStatusUsageCount,
  saving,
  setSaving,
}: DinnerStatusSectionProps) {
  const [editingStatus, setEditingStatus] = useState<{key: DinnerStatusKey, value: string} | null>(null);
  const [deletingStatus, setDeletingStatus] = useState<{
    key: DinnerStatusKey;
    label: string;
    usageCount: number;
  } | null>(null);

  const handleSaveStatus = async (key: DinnerStatusKey, newValue: string) => {
    if (!newValue.trim()) return;

    const updated = { ...dinnerStatuses, [key]: newValue.trim() };
    setDinnerStatuses(updated);
    setEditingStatus(null);

    setSaving(true);
    try {
      await saveStatuses(updated);
    } catch (error) {
      showErrorToast(error, 'saveDinnerStatus');
    } finally {
      setSaving(false);
    }
  };

  const handleReorderStatuses = async (reorderedItems: Array<{ id: string; content: any }>) => {
    const newOrder = reorderedItems.map((item) => item.id as DinnerStatusKey);

    setStatusOrder(newOrder);

    setSaving(true);
    try {
      await reorderStatuses(newOrder);
    } catch (error) {
      showErrorToast(error, 'reorderStatuses');
      setStatusOrder([...statusOrder]);
    } finally {
      setSaving(false);
    }
  };

  // ステータスを追加
  const handleAddStatus = async () => {
    if (Object.keys(dinnerStatuses).length >= DINNER_STATUS.MAX) {
      showErrorToast(new Error(`ステータスは最大${DINNER_STATUS.MAX}個までです`), 'addStatus');
      return;
    }

    setSaving(true);
    try {
      const newKey = await addStatus('新しいステータス');
      // 追加後に編集モードに入る
      setEditingStatus({ key: newKey, value: '新しいステータス' });
    } catch (error) {
      showErrorToast(error, 'addStatus');
    } finally {
      setSaving(false);
    }
  };

  // 削除確認モーダルを開く
  const handleDeleteStatus = async (key: DinnerStatusKey) => {
    if (Object.keys(dinnerStatuses).length <= DINNER_STATUS.MIN) {
      showErrorToast(new Error('ステータスは最低1つ必要です'), 'deleteStatus');
      return;
    }

    setSaving(true);
    try {
      const usageCount = await getStatusUsageCount(key);
      setDeletingStatus({
        key,
        label: dinnerStatuses[key],
        usageCount,
      });
    } catch (error) {
      showErrorToast(error, 'getStatusUsageCount');
    } finally {
      setSaving(false);
    }
  };

  // 削除を確定
  const confirmDelete = async () => {
    if (!deletingStatus) return;

    setSaving(true);
    try {
      await deleteStatus(deletingStatus.key);
      showSuccessToast('ステータスを削除しました');
      setDeletingStatus(null);
    } catch (error) {
      showErrorToast(error, 'deleteStatus');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold text-gray-900">晩ご飯ステータス</h2>
        <button
          onClick={handleAddStatus}
          disabled={Object.keys(dinnerStatuses).length >= DINNER_STATUS.MAX || saving}
          className="btn btn-primary text-sm py-2 disabled:opacity-50"
        >
          + 追加
        </button>
      </div>

      <DraggableList
        items={statusOrder.map((key) => ({
          id: key,
          disabled: editingStatus?.key === key || saving,
          content: (
            <EditableListItem
              value={dinnerStatuses[key]}
              isEditing={editingStatus?.key === key}
              onEdit={() => setEditingStatus({key, value: dinnerStatuses[key]})}
              onSave={async (newValue) => await handleSaveStatus(key, newValue)}
              onCancel={() => setEditingStatus(null)}
              disabled={saving}
              saving={saving}
              showDeleteButton={true}
              onDelete={async () => await handleDeleteStatus(key)}
              deleteDisabled={Object.keys(dinnerStatuses).length <= DINNER_STATUS.MIN}
            />
          ),
        }))}
        onReorder={handleReorderStatuses}
      />

      <p className="text-xs text-gray-500 mt-4">
        ※ 晩ご飯ステータスは最大{DINNER_STATUS.MAX}個まで設定できます
      </p>

      {/* 削除確認モーダル */}
      <DeleteConfirmModal
        isOpen={!!deletingStatus}
        onClose={() => setDeletingStatus(null)}
        onConfirm={confirmDelete}
        title="ステータスの削除"
        itemName={deletingStatus?.label || ''}
        usageCount={deletingStatus?.usageCount || 0}
        emptyLabel={EMPTY_STATUS_LABEL}
        loading={saving}
      />
    </div>
  );
}
