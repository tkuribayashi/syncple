'use client';

import { useState } from 'react';
import { ScheduleCategoryKey, ScheduleCategoryMap } from '@/hooks/useScheduleCategories';
import DraggableList from '@/components/DraggableList';
import EditableListItem from '@/components/EditableListItem';
import DeleteConfirmModal from '@/components/DeleteConfirmModal';
import { showErrorToast, showSuccessToast } from '@/utils/errorHandling';
import { SCHEDULE_CATEGORY } from '@/constants/app';

const EMPTY_CATEGORY_LABEL = 'カテゴリなし';

interface ScheduleCategoriesSectionProps {
  categories: ScheduleCategoryMap;
  categoryOrder: ScheduleCategoryKey[];
  saveCategories: (categories: ScheduleCategoryMap) => Promise<void>;
  reorderCategories: (order: ScheduleCategoryKey[]) => Promise<void>;
  addCategory: (label: string) => Promise<ScheduleCategoryKey>;
  deleteCategory: (key: ScheduleCategoryKey) => Promise<void>;
  getCategoryUsageCount: (key: ScheduleCategoryKey) => Promise<number>;
  saving: boolean;
  setSaving: (saving: boolean) => void;
}

export default function ScheduleCategoriesSection({
  categories,
  categoryOrder,
  saveCategories,
  reorderCategories,
  addCategory,
  deleteCategory,
  getCategoryUsageCount,
  saving,
  setSaving,
}: ScheduleCategoriesSectionProps) {
  const [editingCategory, setEditingCategory] = useState<{key: ScheduleCategoryKey, value: string} | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<{
    key: ScheduleCategoryKey;
    label: string;
    usageCount: number;
  } | null>(null);

  const handleSaveCategory = async (key: ScheduleCategoryKey, newValue: string) => {
    if (!newValue.trim()) return;

    const updated = { ...categories, [key]: newValue.trim() };
    setEditingCategory(null);

    setSaving(true);
    try {
      await saveCategories(updated);
      showSuccessToast('カテゴリを保存しました');
    } catch (error) {
      showErrorToast(error, 'saveCategory');
      setEditingCategory({ key, value: newValue });
    } finally {
      setSaving(false);
    }
  };

  const handleReorderCategories = async (reorderedItems: Array<{ id: string; content: React.ReactNode }>) => {
    const newOrder = reorderedItems.map((item) => item.id as ScheduleCategoryKey);

    setSaving(true);
    try {
      await reorderCategories(newOrder);
      showSuccessToast('並び替えを保存しました');
    } catch (error) {
      showErrorToast(error, 'reorderCategories');
    } finally {
      setSaving(false);
    }
  };

  // カテゴリを追加
  const handleAddCategory = async () => {
    if (Object.keys(categories).length >= SCHEDULE_CATEGORY.MAX) {
      showErrorToast(new Error(`カテゴリは最大${SCHEDULE_CATEGORY.MAX}個までです`), 'addCategory');
      return;
    }

    setSaving(true);
    try {
      const newKey = await addCategory('新しいカテゴリ');
      // 追加後に編集モードに入る
      setEditingCategory({ key: newKey, value: '新しいカテゴリ' });
    } catch (error) {
      showErrorToast(error, 'addCategory');
    } finally {
      setSaving(false);
    }
  };

  // 削除確認モーダルを開く
  const handleDeleteCategory = async (key: ScheduleCategoryKey) => {
    if (Object.keys(categories).length <= SCHEDULE_CATEGORY.MIN) {
      showErrorToast(new Error('カテゴリは最低1つ必要です'), 'deleteCategory');
      return;
    }

    setSaving(true);
    try {
      const usageCount = await getCategoryUsageCount(key);
      setDeletingCategory({
        key,
        label: categories[key],
        usageCount,
      });
    } catch (error) {
      showErrorToast(error, 'getCategoryUsageCount');
    } finally {
      setSaving(false);
    }
  };

  // 削除を確定
  const confirmDelete = async () => {
    if (!deletingCategory) return;

    setSaving(true);
    try {
      await deleteCategory(deletingCategory.key);
      showSuccessToast('カテゴリを削除しました');
      setDeletingCategory(null);
    } catch (error) {
      showErrorToast(error, 'deleteCategory');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold text-gray-900">予定カテゴリ</h2>
        <button
          onClick={handleAddCategory}
          disabled={Object.keys(categories).length >= SCHEDULE_CATEGORY.MAX || saving}
          className="btn btn-primary text-sm py-2 disabled:opacity-50"
        >
          + 追加
        </button>
      </div>

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
              showDeleteButton={true}
              onDelete={async () => await handleDeleteCategory(key)}
              deleteDisabled={Object.keys(categories).length <= SCHEDULE_CATEGORY.MIN}
            />
          ),
        }))}
        onReorder={handleReorderCategories}
      />

      <p className="text-xs text-gray-500 mt-4">
        ※ 予定カテゴリは最大{SCHEDULE_CATEGORY.MAX}個まで設定できます
      </p>

      {/* 削除確認モーダル */}
      <DeleteConfirmModal
        isOpen={!!deletingCategory}
        onClose={() => setDeletingCategory(null)}
        onConfirm={confirmDelete}
        title="カテゴリの削除"
        itemName={deletingCategory?.label || ''}
        usageCount={deletingCategory?.usageCount || 0}
        emptyLabel={EMPTY_CATEGORY_LABEL}
        loading={saving}
      />
    </div>
  );
}
