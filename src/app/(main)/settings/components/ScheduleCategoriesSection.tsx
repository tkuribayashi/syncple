'use client';

import { useState } from 'react';
import { ScheduleCategoryKey, ScheduleCategoryMap } from '@/hooks/useScheduleCategories';
import DraggableList from '@/components/DraggableList';
import EditableListItem from '@/components/EditableListItem';
import { showErrorToast } from '@/utils/errorHandling';

interface ScheduleCategoriesSectionProps {
  categories: ScheduleCategoryMap;
  categoryOrder: ScheduleCategoryKey[];
  setCategories: (categories: ScheduleCategoryMap) => void;
  setCategoryOrder: (order: ScheduleCategoryKey[]) => void;
  saveCategories: (categories: ScheduleCategoryMap) => Promise<void>;
  reorderCategories: (order: ScheduleCategoryKey[]) => Promise<void>;
  saving: boolean;
  setSaving: (saving: boolean) => void;
}

export default function ScheduleCategoriesSection({
  categories,
  categoryOrder,
  setCategories,
  setCategoryOrder,
  saveCategories,
  reorderCategories,
  saving,
  setSaving,
}: ScheduleCategoriesSectionProps) {
  const [editingCategory, setEditingCategory] = useState<{key: ScheduleCategoryKey, value: string} | null>(null);

  const handleSaveCategory = async (key: ScheduleCategoryKey, newValue: string) => {
    if (!newValue.trim()) return;

    const updated = { ...categories, [key]: newValue.trim() };
    setCategories(updated);
    setEditingCategory(null);

    setSaving(true);
    try {
      await saveCategories(updated);
    } catch (error) {
      showErrorToast(error, 'saveCategory');
    } finally {
      setSaving(false);
    }
  };

  const handleReorderCategories = async (reorderedItems: Array<{ id: string; content: any }>) => {
    const newOrder = reorderedItems.map((item) => item.id as ScheduleCategoryKey);

    setCategoryOrder(newOrder);

    setSaving(true);
    try {
      await reorderCategories(newOrder);
    } catch (error) {
      showErrorToast(error, 'reorderCategories');
      setCategoryOrder([...categoryOrder]);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <h2 className="text-lg font-bold text-gray-900 mb-4">予定カテゴリ</h2>
      <DraggableList
        items={categoryOrder.map((key) => ({
          id: key,
          disabled: editingCategory?.key === key || saving,
          content: (
            <EditableListItem
              value={categories[key]}
              isEditing={editingCategory?.key === key}
              onEdit={() => setEditingCategory({key, value: categories[key]})}
              onSave={async (newValue) => await handleSaveCategory(key, newValue)}
              onCancel={() => setEditingCategory(null)}
              disabled={saving}
              saving={saving}
            />
          ),
        }))}
        onReorder={handleReorderCategories}
      />
    </div>
  );
}
