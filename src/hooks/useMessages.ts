'use client';

import { useEffect, useState } from 'react';
import {
  collection,
  addDoc,
  doc,
  query,
  orderBy,
  limit,
  onSnapshot,
  Timestamp,
  updateDoc,
  getDocs,
  deleteDoc
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Message } from '@/types';
import { useAuth } from '@/contexts/AuthContext';

const MAX_MESSAGES = 100;

export function useMessages(pairId: string | null, messageLimit: number = 50) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!pairId) {
      setLoading(false);
      return;
    }

    const messagesRef = collection(db, 'pairs', pairId, 'messages');
    const q = query(messagesRef, orderBy('createdAt', 'desc'), limit(messageLimit));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messagesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Message[];
      setMessages(messagesData.reverse());
      setLoading(false);
    });

    return unsubscribe;
  }, [pairId, messageLimit]);

  const sendMessage = async (content: string) => {
    if (!pairId || !user) throw new Error('Pair ID or user not found');

    const newMessage = {
      senderId: user.uid,
      content,
      isRead: false,
      createdAt: Timestamp.now(),
    };

    const messagesRef = collection(db, 'pairs', pairId, 'messages');
    await addDoc(messagesRef, newMessage);

    // メッセージ数をチェックして、100件を超えたら古いものを削除
    const allMessagesQuery = query(messagesRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(allMessagesQuery);

    if (snapshot.size > MAX_MESSAGES) {
      // 古いメッセージを削除（最新100件を残す）
      const messagesToDelete = snapshot.docs.slice(MAX_MESSAGES);
      await Promise.all(
        messagesToDelete.map(doc => deleteDoc(doc.ref))
      );
    }
  };

  const markAsRead = async (messageId: string) => {
    if (!pairId) throw new Error('Pair ID not found');

    await updateDoc(doc(db, 'pairs', pairId, 'messages', messageId), {
      isRead: true,
    });
  };

  return {
    messages,
    loading,
    sendMessage,
    markAsRead,
  };
}
