'use client';

import { useState } from 'react';
import { DinnerStatusType } from '@/types';
import { DinnerStatusMap } from '@/hooks/useDinnerStatusOptions';
import DraggableList from '@/components/DraggableList';
import EditableListItem from '@/components/EditableListItem';
import { showErrorToast } from '@/utils/errorHandling';

interface DinnerStatusSectionProps {
  dinnerStatuses: DinnerStatusMap;
  statusOrder: DinnerStatusType[];
  setDinnerStatuses: (statuses: DinnerStatusMap) => void;
  setStatusOrder: (order: DinnerStatusType[]) => void;
  saveStatuses: (statuses: DinnerStatusMap) => Promise<void>;
  reorderStatuses: (order: DinnerStatusType[]) => Promise<void>;
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
  saving,
  setSaving,
}: DinnerStatusSectionProps) {
  const [editingStatus, setEditingStatus] = useState<{key: DinnerStatusType, value: string} | null>(null);

  const handleSaveStatus = async (key: DinnerStatusType, newValue: string) => {
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
    const newOrder = reorderedItems.map((item) => item.id as DinnerStatusType);

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

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <h2 className="text-lg font-bold text-gray-900 mb-4">晩ご飯ステータス</h2>
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
            />
          ),
        }))}
        onReorder={handleReorderStatuses}
      />
    </div>
  );
}
