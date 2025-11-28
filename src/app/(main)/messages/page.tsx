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
    <div className="h-[calc(100vh-80px)] md:h-screen flex flex-col">
      <div className="flex-none max-w-4xl w-full mx-auto p-4 pb-2">
        <div>
          <h1 className="text-2xl font-bold">メッセージ</h1>
          <p className="text-sm text-gray-600 mt-1">
            {partner?.displayName || 'パートナー'}とのメッセージ
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 h-full">
          <div className="card h-full overflow-y-auto space-y-3">
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
        </div>
      </div>

      {/* 固定入力エリア */}
      <div className="flex-none border-t bg-white">
        <div className="max-w-4xl mx-auto p-4">
          <div className="mb-3 p-3 bg-gray-50 rounded-lg">
            <h3 className="text-xs font-semibold text-gray-700 mb-2">クイックメッセージ</h3>
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
    </div>
  );
}
