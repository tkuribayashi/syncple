import { useState } from 'react';

interface EditableListItemProps {
  value: string;
  isEditing: boolean;
  onEdit: () => void;
  onSave: (newValue: string) => Promise<void>;
  onCancel: () => void;
  disabled?: boolean;
  saving?: boolean;
  placeholder?: string;
  showDeleteButton?: boolean;
  onDelete?: () => Promise<void>;
  deleteDisabled?: boolean;
}

export default function EditableListItem({
  value,
  isEditing,
  onEdit,
  onSave,
  onCancel,
  disabled = false,
  saving = false,
  placeholder = '',
  showDeleteButton = false,
  onDelete,
  deleteDisabled = false,
}: EditableListItemProps) {
  const [editValue, setEditValue] = useState(value);

  // 編集モードに入る時に値をリセット
  const handleEdit = () => {
    setEditValue(value);
    onEdit();
  };

  // 保存
  const handleSave = async () => {
    await onSave(editValue);
  };

  // キャンセル
  const handleCancel = () => {
    setEditValue(value);
    onCancel();
  };

  if (isEditing) {
    return (
      <div className="flex gap-2">
        <input
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          placeholder={placeholder}
          className="input flex-1"
          autoFocus
        />
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn btn-primary px-4 disabled:opacity-50"
        >
          {saving ? '保存中...' : '保存'}
        </button>
        <button
          onClick={handleCancel}
          disabled={saving}
          className="btn btn-secondary px-4 disabled:opacity-50"
        >
          キャンセル
        </button>
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      <div className="flex-1 bg-purple-50 p-3 rounded-lg">
        {value}
      </div>
      <button
        onClick={handleEdit}
        disabled={disabled}
        className="btn btn-secondary px-4 disabled:opacity-50"
      >
        編集
      </button>
      {showDeleteButton && onDelete && (
        <button
          onClick={onDelete}
          disabled={disabled || deleteDisabled}
          className="btn btn-secondary px-4 disabled:opacity-50"
        >
          削除
        </button>
      )}
    </div>
  );
}
