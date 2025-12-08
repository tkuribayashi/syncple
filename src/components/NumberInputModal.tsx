'use client';

import { useState, useEffect, useRef } from 'react';

interface NumberInputModalProps {
  isOpen: boolean;
  defaultValue: string;
  onConfirm: (value: string) => void;
  onCancel: () => void;
}

export default function NumberInputModal({
  isOpen,
  defaultValue,
  onConfirm,
  onCancel,
}: NumberInputModalProps) {
  const [value, setValue] = useState(defaultValue);
  const prevIsOpenRef = useRef(false);

  useEffect(() => {
    // Reset value only when modal first opens (transitions from false to true)
    if (isOpen && !prevIsOpenRef.current) {
      // モーダルが開いたときに入力値をdefaultValueにリセット（開くたびに1回のみ実行）
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setValue(defaultValue);
    }
    prevIsOpenRef.current = isOpen;
  }, [isOpen, defaultValue]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim()) {
      onConfirm(value);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">
          数値を入力してください
        </h3>

        <form onSubmit={handleSubmit}>
          <input
            type="number"
            inputMode="numeric"
            pattern="[0-9]*"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="input w-full text-center text-2xl font-bold"
            autoFocus
          />

          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 btn btn-secondary"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={!value.trim()}
              className="flex-1 btn btn-primary disabled:opacity-50"
            >
              送信
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
