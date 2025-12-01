'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { usePair } from '@/hooks/usePair';
import { useMessages } from '@/hooks/useMessages';
import { useQuickMessages } from '@/hooks/useQuickMessages';
import { format } from 'date-fns';
import { extractVariable, replaceVariable, Variable } from '@/utils/templateVariables';
import NumberInputModal from '@/components/NumberInputModal';

export default function MessagesPage() {
  const { user, userProfile } = useAuth();
  const { partner } = usePair();
  const { messages, loading, sendMessage, markAsRead, toggleReaction } = useMessages(userProfile?.pairId || null);
  const { quickMessages } = useQuickMessages(userProfile?.pairId || null);
  const [messageInput, setMessageInput] = useState('');
  const [sending, setSending] = useState(false);
  const [lastTap, setLastTap] = useState<{ messageId: string; time: number } | null>(null);
  const [animatingMessageId, setAnimatingMessageId] = useState<string | null>(null);
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    template: string;
    variable: Variable | null;
  }>({
    isOpen: false,
    template: '',
    variable: null,
  });

  // パートナーから受信した未読メッセージを自動的に既読にする
  useEffect(() => {
    if (!user || messages.length === 0) return;

    const unreadPartnerMessages = messages.filter(
      msg => msg.senderId !== user.uid && !msg.isRead && msg.id
    );

    if (unreadPartnerMessages.length > 0) {
      // 既読マーク処理（非同期・バックグラウンド）
      Promise.all(
        unreadPartnerMessages.map(msg => markAsRead(msg.id!))
      ).catch(err => console.error('Failed to mark messages as read:', err));
    }
  }, [messages, user, markAsRead]);

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
    const variable = extractVariable(template);

    if (variable) {
      // 変数がある場合はモーダルを表示
      setModalState({ isOpen: true, template, variable });
    } else {
      // 変数がない場合はそのまま送信
      handleSendMessage(template);
    }
  };

  const handleModalConfirm = (value: string) => {
    if (modalState.variable) {
      const message = replaceVariable(
        modalState.template,
        modalState.variable,
        value
      );
      handleSendMessage(message);
    }
    setModalState({ isOpen: false, template: '', variable: null });
  };

  const handleModalCancel = () => {
    setModalState({ isOpen: false, template: '', variable: null });
  };

  const handleMessageTap = (messageId: string) => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300; // 300ms以内の2回目のタップをダブルタップと判定

    if (lastTap && lastTap.messageId === messageId && now - lastTap.time < DOUBLE_TAP_DELAY) {
      // ダブルタップ検出
      setAnimatingMessageId(messageId);
      setTimeout(() => setAnimatingMessageId(null), 600);
      toggleReaction(messageId);
      setLastTap(null);
    } else {
      // 1回目のタップ
      setLastTap({ messageId, time: now });
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
              const hasReaction = message.reactions && Object.keys(message.reactions).length > 0;
              const myReaction = message.reactions && user?.uid ? message.reactions[user.uid] : null;

              return (
                <div
                  key={message.id}
                  className={`flex ${isMyMessage ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    onClick={() => !isMyMessage && message.id && handleMessageTap(message.id)}
                    className={`max-w-[70%] rounded-lg p-3 transition-transform duration-200 ${
                      isMyMessage
                        ? 'bg-gradient-to-r from-pink-400 to-pink-500 text-white'
                        : 'bg-purple-100 text-gray-900 cursor-pointer active:scale-95'
                    } ${
                      animatingMessageId === message.id ? 'scale-110' : ''
                    }`}
                    style={{ touchAction: 'manipulation' }}
                  >
                    <p className="break-words">{message.content}</p>
                    <div className={`flex items-center gap-1.5 text-xs mt-1 ${
                      isMyMessage ? 'text-pink-100' : 'text-purple-600'
                    }`}>
                      <span>
                        {message.createdAt && format(message.createdAt.toDate(), 'HH:mm')}
                      </span>
                      {isMyMessage && message.isRead && (
                        <span className="text-pink-100">✓</span>
                      )}
                    </div>

                    {/* リアクション表示（相手のメッセージのみ） */}
                    {!isMyMessage && hasReaction && (
                      <div className="flex items-center gap-1 mt-1">
                        <span className="text-base">{myReaction === 'like' ? '❤️' : '🤍'}</span>
                      </div>
                    )}
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

      <NumberInputModal
        isOpen={modalState.isOpen}
        defaultValue={modalState.variable?.defaultValue || ''}
        onConfirm={handleModalConfirm}
        onCancel={handleModalCancel}
      />
    </div>
  );
}
