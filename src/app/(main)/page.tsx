'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { usePair } from '@/hooks/usePair';
import { useSchedules } from '@/hooks/useSchedules';
import { useMessages } from '@/hooks/useMessages';
import { useQuickMessages } from '@/hooks/useQuickMessages';
import { useScheduleCategories } from '@/hooks/useScheduleCategories';
import { USER_STATUSES } from '@/types';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import DinnerStatusCard from '@/components/DinnerStatusCard';

export default function HomePage() {
  const router = useRouter();
  const { user, userProfile } = useAuth();
  const { pair, partner, loading: pairLoading } = usePair();
  const { schedules, loading: schedulesLoading } = useSchedules(userProfile?.pairId || null);
  const { messages, loading: messagesLoading, sendMessage } = useMessages(userProfile?.pairId || null, 10);
  const { quickMessages } = useQuickMessages(userProfile?.pairId || null);
  const { categories } = useScheduleCategories(userProfile?.pairId || null);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!pairLoading && !userProfile?.pairId) {
      router.push('/invite');
    }
  }, [pairLoading, userProfile, router]);

  if (pairLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">読み込み中...</div>
      </div>
    );
  }

  const today = format(new Date(), 'yyyy-MM-dd');
  const todaySchedules = schedules.filter(s => s.date === today);

  const handleQuickMessage = async (template: string) => {
    if (template.includes('{分}')) {
      const minutes = prompt('何分後ですか？');
      if (minutes) {
        const message = template.replace('{分}', minutes);
        await sendQuickMessage(message);
      }
    } else {
      await sendQuickMessage(template);
    }
  };

  const sendQuickMessage = async (content: string) => {
    setSending(true);
    try {
      await sendMessage(content);
    } catch (error) {
      console.error('Error sending message:', error);
      alert('メッセージの送信に失敗しました');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4 pb-24 space-y-4">
      {/* 最新メッセージ表示エリア */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">最新メッセージ</h2>

        {messagesLoading ? (
          <p className="text-center text-gray-500 py-4">読み込み中...</p>
        ) : messages.length === 0 ? (
          <p className="text-center text-gray-500 py-4">メッセージはまだありません</p>
        ) : (
          <div className="space-y-3 max-h-[200px] overflow-y-auto">
            {messages.slice(-5).reverse().map((message) => {
              const isMyMessage = message.senderId === user?.uid;
              return (
                <div
                  key={message.id}
                  className={`flex ${isMyMessage ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                      isMyMessage
                        ? 'bg-gradient-to-r from-pink-400 to-pink-500 text-white'
                        : 'bg-purple-100 text-gray-900'
                    }`}
                  >
                    <p className="text-base break-words">{message.content}</p>
                    <p className={`text-xs mt-1 ${
                      isMyMessage ? 'text-pink-100' : 'text-purple-600'
                    }`}>
                      {message.createdAt && format(message.createdAt.toDate(), 'HH:mm')}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* クイックメッセージ */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">クイックメッセージ</h2>
        <div className="grid grid-cols-2 gap-2">
          {quickMessages.map((template, index) => (
            <button
              key={index}
              onClick={() => handleQuickMessage(template)}
              disabled={sending}
              className="btn btn-secondary text-sm py-3 disabled:opacity-50"
            >
              {template}
            </button>
          ))}
          <Link
            href="/messages"
            className="btn btn-secondary text-sm py-3 text-center"
          >
            その他のメッセージ
          </Link>
        </div>
      </div>

      {/* 今日の晩ご飯ステータス */}
      <DinnerStatusCard pairId={userProfile?.pairId || null} />

      {/* 今日の予定 */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">
          今日の予定 {todaySchedules.length > 0 && `(${todaySchedules.length})`}
        </h2>

        {schedulesLoading ? (
          <p className="text-gray-500">読み込み中...</p>
        ) : todaySchedules.length === 0 ? (
          <p className="text-gray-500">今日の予定はありません</p>
        ) : (
          <div className="space-y-3">
            {todaySchedules.map((schedule) => {
              const isMine = schedule.userId === user?.uid;
              return (
                <div
                  key={schedule.id}
                  className={`p-4 rounded-xl ${
                    isMine ? 'bg-pink-50' : 'bg-purple-50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-3 h-3 rounded-full mt-1.5 ${
                      isMine ? 'bg-pink-400' : 'bg-purple-400'
                    }`}></div>
                    <div className="flex-1">
                      <p className="font-bold text-base">{schedule.title}</p>
                      <p className="text-sm text-gray-600 mt-1">
                        {categories[schedule.category]}
                        {!schedule.isAllDay && schedule.startTime && (
                          <>
                            {` • ${schedule.startTime}`}
                            {schedule.endTime && ` - ${schedule.endTime}`}
                          </>
                        )}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {isMine ? 'あなた' : partner?.displayName}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
