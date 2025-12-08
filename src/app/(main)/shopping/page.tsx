'use client';

import { useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useShoppingItems } from '@/hooks/useShoppingItems';
import DraggableList from '@/components/DraggableList';
import { toast } from '@/components/ui/Toast';
import { showErrorToast } from '@/utils/errorHandling';
import Loading from '@/components/ui/Loading';

export default function ShoppingListPage() {
  const { user, userProfile } = useAuth();
  const { items, loading, addItem, toggleComplete, deleteItem, updateOrder, deleteCompletedItems } =
    useShoppingItems(userProfile?.pairId || null);

  const [newItemText, setNewItemText] = useState('');
  const [showCompleted, setShowCompleted] = useState(true);

  // 表示するアイテムをフィルタリング
  const displayItems = useMemo(() => {
    const filtered = showCompleted ? items : items.filter((item) => !item.isCompleted);
    return filtered.sort((a, b) => a.order - b.order);
  }, [items, showCompleted]);

  // 完了済みアイテムの数
  const completedCount = items.filter((item) => item.isCompleted).length;

  // アイテム追加
  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemText.trim() || !user || !userProfile?.pairId) return;

    try {
      await addItem(newItemText, user.uid, userProfile.pairId);
      setNewItemText('');
      toast.success('アイテムを追加しました');
    } catch (error) {
      showErrorToast(error, 'addShoppingItem');
    }
  };

  // 完了状態の切り替え
  const handleToggleComplete = async (itemId: string, isCompleted: boolean) => {
    if (!userProfile?.pairId) return;

    try {
      await toggleComplete(itemId, !isCompleted, userProfile.pairId);
    } catch (error) {
      showErrorToast(error, 'toggleComplete');
    }
  };

  // アイテム削除
  const handleDelete = async (itemId: string) => {
    if (!userProfile?.pairId) return;

    try {
      await deleteItem(itemId, userProfile.pairId);
      toast.success('アイテムを削除しました');
    } catch (error) {
      showErrorToast(error, 'deleteShoppingItem');
    }
  };

  // 並び替え
  const handleReorder = async (reorderedItems: Array<{ id: string; content: React.ReactNode }>) => {
    if (!userProfile?.pairId) return;

    const reorderedData = reorderedItems.map((item) => {
      const originalItem = items.find((i) => i.id === item.id);
      return originalItem;
    }).filter((item): item is NonNullable<typeof item> => item !== undefined);

    try {
      await updateOrder(reorderedData, userProfile.pairId);
    } catch (error) {
      showErrorToast(error, 'reorderShoppingItems');
    }
  };

  // 完了済みアイテムの一括削除
  const handleDeleteCompleted = async () => {
    if (completedCount === 0 || !userProfile?.pairId) return;

    if (!confirm(`完了済みアイテム${completedCount}件を削除しますか？`)) {
      return;
    }

    try {
      await deleteCompletedItems(userProfile.pairId);
      toast.success(`${completedCount}件のアイテムを削除しました`);
    } catch (error) {
      showErrorToast(error, 'deleteCompletedItems');
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto p-4">
        <Loading />
      </div>
    );
  }

  if (!userProfile?.pairId) {
    return (
      <div className="max-w-2xl mx-auto p-4 pb-24">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
          <p className="text-gray-600">ペアを作成してからご利用ください</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4 pb-24">
      {/* ヘッダー */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">🛒 お買い物リスト</h1>
        <p className="text-sm text-gray-600">
          {items.length}件のアイテム
          {completedCount > 0 && ` (${completedCount}件完了)`}
        </p>
      </div>

      {/* アイテム追加フォーム */}
      <form onSubmit={handleAddItem} className="mb-6">
        <div className="flex gap-2">
          <input
            type="text"
            value={newItemText}
            onChange={(e) => setNewItemText(e.target.value)}
            placeholder="アイテムを追加..."
            className="flex-1 px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            type="submit"
            disabled={!newItemText.trim()}
            className="px-6 py-3 bg-blue-500 text-white rounded-xl font-semibold hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            追加
          </button>
        </div>
      </form>

      {/* コントロール */}
      <div className="flex justify-between items-center mb-4">
        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
          <input
            type="checkbox"
            checked={showCompleted}
            onChange={(e) => setShowCompleted(e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 text-blue-500 focus:ring-blue-500"
          />
          完了済みを表示
        </label>

        {completedCount > 0 && (
          <button
            onClick={handleDeleteCompleted}
            className="text-sm text-red-500 hover:text-red-700 font-medium transition-colors"
          >
            完了済みを削除 ({completedCount})
          </button>
        )}
      </div>

      {/* アイテムリスト */}
      {displayItems.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center text-gray-500">
          {items.length === 0
            ? 'アイテムを追加してください'
            : '完了済みアイテムのみです'}
        </div>
      ) : (
        <DraggableList
          items={displayItems.map((item) => ({
            id: item.id || '',
            disabled: false,
            content: (
              <div className="flex items-center gap-3 bg-white p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                <input
                  type="checkbox"
                  checked={item.isCompleted}
                  onChange={() => item.id && handleToggleComplete(item.id, item.isCompleted)}
                  className="w-5 h-5 rounded border-gray-300 text-blue-500 focus:ring-blue-500 cursor-pointer"
                />
                <span
                  className={`flex-1 ${
                    item.isCompleted
                      ? 'line-through text-gray-400'
                      : 'text-gray-800 font-medium'
                  }`}
                >
                  {item.text}
                </span>
                <button
                  onClick={() => item.id && handleDelete(item.id)}
                  className="text-red-500 hover:text-red-700 text-sm font-medium transition-colors px-3 py-1 rounded hover:bg-red-50"
                >
                  削除
                </button>
              </div>
            ),
          }))}
          onReorder={handleReorder}
        />
      )}
    </div>
  );
}
