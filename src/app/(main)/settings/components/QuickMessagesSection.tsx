'use client';

import { useState, useRef, useEffect } from 'react';
import DraggableList from '@/components/DraggableList';
import { toast } from '@/components/ui/Toast';
import { showErrorToast, showSuccessToast } from '@/utils/errorHandling';
import { QUICK_MESSAGE } from '@/constants/app';

interface QuickMessagesSectionProps {
  quickMessages: string[];
  saveQuickMessages: (messages: string[]) => Promise<void>;
  saving: boolean;
  setSaving: (saving: boolean) => void;
}

export default function QuickMessagesSection({
  quickMessages: quickMessagesProp,
  saveQuickMessages,
  saving,
  setSaving,
}: QuickMessagesSectionProps) {
  const [quickMessages, setQuickMessages] = useState<string[]>(quickMessagesProp);
  const [editingMessage, setEditingMessage] = useState<{index: number, value: string, cursorPosition: number} | null>(null);
  const [defaultValueInput, setDefaultValueInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync local state with prop when it changes
  useEffect(() => {
    setQuickMessages(quickMessagesProp);
  }, [quickMessagesProp]);

  const handleSaveMessage = async (index: number, newValue: string) => {
    if (!newValue.trim()) {
      toast.error('メッセージを入力してください');
      return;
    }

    const updated = [...quickMessages];
    updated[index] = newValue.trim();
    setEditingMessage(null);

    setSaving(true);
    try {
      await saveQuickMessages(updated);
      showSuccessToast('メッセージを保存しました');
    } catch (error) {
      showErrorToast(error, 'saveQuickMessage');
      setEditingMessage({ index, value: newValue, cursorPosition: newValue.length });
    } finally {
      setSaving(false);
    }
  };

  const insertVariable = (variable: string) => {
    if (!editingMessage) return;

    const { value, cursorPosition } = editingMessage;
    const before = value.substring(0, cursorPosition);
    const after = value.substring(cursorPosition);
    const newValue = before + variable + after;
    const newCursorPosition = cursorPosition + variable.length;

    setEditingMessage({
      ...editingMessage,
      value: newValue,
      cursorPosition: newCursorPosition,
    });

    setDefaultValueInput('');

    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        inputRef.current.setSelectionRange(newCursorPosition, newCursorPosition);
      }
    }, 0);
  };

  const handleAddMessage = () => {
    if (quickMessages.length >= QUICK_MESSAGE.MAX) return;

    const newIndex = quickMessages.length;
    setQuickMessages([...quickMessages, '']);
    setEditingMessage({ index: newIndex, value: '', cursorPosition: 0 });
  };

  const handleDeleteMessage = async (index: number) => {
    if (quickMessages.length <= QUICK_MESSAGE.MIN) return;

    const updated = quickMessages.filter((_, i) => i !== index);
    setQuickMessages(updated);

    setSaving(true);
    try {
      await saveQuickMessages(updated);
    } catch (error) {
      showErrorToast(error, 'deleteQuickMessage');
      setQuickMessages([...quickMessages]);
    } finally {
      setSaving(false);
    }
  };

  const handleReorderMessages = async (reorderedItems: Array<{ id: string; content: React.ReactNode }>) => {
    const oldMessages = [...quickMessages];

    const reorderedMessages = reorderedItems.map((item) => {
      const index = parseInt(item.id.replace('msg-', ''), 10);
      return quickMessages[index];
    });

    setQuickMessages(reorderedMessages);

    setSaving(true);
    try {
      await saveQuickMessages(reorderedMessages);
      showSuccessToast('並び替えを保存しました');
    } catch (error) {
      showErrorToast(error, 'reorderQuickMessages');
      setQuickMessages(oldMessages);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold text-gray-900">クイックメッセージ</h2>
        <button
          onClick={handleAddMessage}
          disabled={quickMessages.length >= QUICK_MESSAGE.MAX || saving}
          className="btn btn-primary text-sm py-2 disabled:opacity-50"
        >
          {saving ? '保存中...' : '+ 追加'}
        </button>
      </div>

      <DraggableList
        items={quickMessages.map((message, index) => ({
          id: `msg-${index}`,
          disabled: editingMessage?.index === index || saving,
          content: (
            <div>
              {editingMessage?.index === index ? (
                <div className="space-y-2">
                  {/* メッセージ入力 */}
                  <input
                    ref={inputRef}
                    type="text"
                    value={editingMessage.value}
                    onChange={(e) => {
                      const target = e.target as HTMLInputElement;
                      setEditingMessage({
                        index,
                        value: e.target.value,
                        cursorPosition: target.selectionStart || 0,
                      });
                    }}
                    onSelect={(e) => {
                      const target = e.target as HTMLInputElement;
                      setEditingMessage({
                        ...editingMessage,
                        cursorPosition: target.selectionStart || 0,
                      });
                    }}
                    className="input w-full"
                    autoFocus
                  />

                  {/* 変数挿入UI */}
                  <div className="bg-purple-50 rounded-lg p-3 space-y-2">
                    <p className="text-xs font-semibold text-gray-700">
                      数値変数を挿入:
                    </p>

                    <div className="flex gap-2">
                      <input
                        type="number"
                        inputMode="numeric"
                        placeholder="初期値"
                        value={defaultValueInput}
                        onChange={(e) => setDefaultValueInput(e.target.value)}
                        className="input w-20 text-sm px-2"
                      />

                      <button
                        type="button"
                        onClick={() => {
                          const variable = defaultValueInput
                            ? `{n=${defaultValueInput}}`
                            : '{n}';
                          insertVariable(variable);
                        }}
                        className="px-3 py-1.5 text-sm bg-white border border-purple-200 rounded-lg hover:bg-purple-100"
                      >
                        {'{n}'}を挿入
                      </button>
                    </div>

                    <p className="text-xs text-gray-500">
                      例: 「{'{n}'}分後に帰る」「あと{'{n=30}'}分で着く」
                    </p>
                  </div>

                  {/* 保存/キャンセル */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSaveMessage(index, editingMessage.value)}
                      disabled={saving}
                      className="btn btn-primary flex-1 disabled:opacity-50"
                    >
                      {saving ? '保存中...' : '保存'}
                    </button>
                    <button
                      onClick={() => {
                        if (quickMessages[index] === '') {
                          setQuickMessages(quickMessages.filter((_, i) => i !== index));
                        }
                        setEditingMessage(null);
                        setDefaultValueInput('');
                      }}
                      disabled={saving}
                      className="btn btn-secondary flex-1 disabled:opacity-50"
                    >
                      キャンセル
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2">
                  <div className="flex-1 bg-purple-50 p-3 rounded-lg">
                    {message}
                  </div>
                  <button
                    onClick={() => setEditingMessage({index, value: message, cursorPosition: message.length})}
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
                </div>
              )}
            </div>
          ),
        }))}
        onReorder={handleReorderMessages}
      />

      <p className="text-xs text-gray-500 mt-4">
        ※ クイックメッセージは最大12個まで設定できます
      </p>
    </div>
  );
}
