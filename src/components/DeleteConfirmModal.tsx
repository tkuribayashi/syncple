'use client';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  itemName: string;
  usageCount: number;
  /** 削除後の状態を表すラベル（例: 「カテゴリなし」「ステータスなし」） */
  emptyLabel: string;
  loading?: boolean;
}

export default function DeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  itemName,
  usageCount,
  emptyLabel,
  loading = false,
}: DeleteConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 背景オーバーレイ */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />

      {/* モーダルコンテンツ */}
      <div className="relative bg-white rounded-2xl shadow-xl p-6 max-w-md mx-4">
        <h2 className="text-xl font-bold text-gray-900 mb-4">{title}</h2>

        <div className="space-y-4 mb-6">
          <p className="text-gray-700">
            「{itemName}」を削除しますか？
          </p>

          {usageCount > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800 font-semibold mb-2">
                使用中の項目です
              </p>
              <p className="text-sm text-yellow-700">
                この項目は現在 <strong>{usageCount}件</strong> で使用されています。
              </p>
              <p className="text-sm text-yellow-700 mt-2">
                削除すると、すべて「{emptyLabel}」になります。
              </p>
            </div>
          )}
        </div>

        {/* ボタン */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="btn btn-secondary flex-1 disabled:opacity-50"
          >
            キャンセル
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="btn btn-danger flex-1 disabled:opacity-50"
          >
            {loading ? '削除中...' : '削除'}
          </button>
        </div>
      </div>
    </div>
  );
}
