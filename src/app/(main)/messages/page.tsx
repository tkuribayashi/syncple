'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { usePair } from '@/hooks/usePair';
import { useMessages } from '@/hooks/useMessages';
import { useQuickMessages } from '@/hooks/useQuickMessages';
import { format } from 'date-fns';

export default function MessagesPage() {
  const { user, userProfile } = useAuth();
  const { partner } = usePair();
  const { messages, loading, sendMessage } = useMessages(userProfile?.pairId || null);
  const { quickMessages } = useQuickMessages(userProfile?.pairId || null);
  const [messageInput, setMessageInput] = useState('');
  const [showQuickMessages, setShowQuickMessages] = useState(true);
  const [sending, setSending] = useState(false);

  const handleSendMessage = async (content: string) => {
    if (!content.trim()) return;

    setSending(true);
    try {
      await sendMessage(content);
      setMessageInput('');
    } catch (error) {
      console.error('Error sending message:', error);
      alert('メッセージの送信に失敗しました');
    } finally {
      setSending(false);
    }
  };

  const handleQuickMessage = (template: string) => {
    if (template.includes('{分}')) {
      const minutes = prompt('何分後ですか？');
      if (minutes) {
        const message = template.replace('{分}', minutes);
        handleSendMessage(message);
      }
    } else {
      handleSendMessage(template);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage(messageInput);
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="card h-[calc(100vh-200px)] flex flex-col">
        <div className="border-b pb-4 mb-4">
          <h1 className="text-2xl font-bold">メッセージ</h1>
          <p className="text-sm text-gray-600">
            {partner?.displayName || 'パートナー'}とのメッセージ
          </p>
        </div>

        <div className="flex-1 overflow-y-auto mb-4 space-y-3">
          {loading ? (
            <p className="text-center text-gray-500">読み込み中...</p>
          ) : messages.length === 0 ? (
            <p className="text-center text-gray-500">メッセージはまだありません</p>
          ) : (
            [...messages].reverse().map((message) => {
              const isMyMessage = message.senderId === user?.uid;
              return (
                <div
                  key={message.id}
                  className={`flex ${isMyMessage ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[70%] rounded-lg p-3 ${
                      isMyMessage
                        ? 'bg-gradient-to-r from-pink-400 to-pink-500 text-white'
                        : 'bg-purple-100 text-gray-900'
                    }`}
                  >
                    <p className="break-words">{message.content}</p>
                    <p className={`text-xs mt-1 ${
                      isMyMessage ? 'text-pink-100' : 'text-purple-600'
                    }`}>
                      {message.createdAt && format(message.createdAt.toDate(), 'HH:mm')}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {showQuickMessages && (
          <div className="mb-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-semibold text-gray-700">クイックメッセージ</h3>
              <button
                onClick={() => setShowQuickMessages(false)}
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                閉じる
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {quickMessages.map((template, index) => (
                <button
                  key={index}
                  onClick={() => handleQuickMessage(template)}
                  disabled={sending}
                  className="btn btn-secondary text-sm py-2 disabled:opacity-50"
                >
                  {template}
                </button>
              ))}
            </div>
          </div>
        )}

        {!showQuickMessages && (
          <button
            onClick={() => setShowQuickMessages(true)}
            className="mb-4 text-sm text-blue-600 hover:text-blue-700"
          >
            クイックメッセージを表示
          </button>
        )}

        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            placeholder="メッセージを入力..."
            className="flex-1 input"
            disabled={sending}
          />
          <button
            type="submit"
            disabled={sending || !messageInput.trim()}
            className="btn btn-primary px-6 disabled:opacity-50"
          >
            {sending ? '送信中...' : '送信'}
          </button>
        </form>
      </div>
    </div>
  );
}
