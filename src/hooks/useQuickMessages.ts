import { useState, useEffect } from 'react';
import { collection, doc, getDocs, setDoc, deleteDoc, query, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { DEFAULT_QUICK_MESSAGES } from '@/types';

export function useQuickMessages(pairId: string | null) {
  const [quickMessages, setQuickMessages] = useState<string[]>([...DEFAULT_QUICK_MESSAGES]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!pairId) {
      setLoading(false);
      return;
    }

    const loadQuickMessages = async () => {
      try {
        const messagesRef = collection(db, 'pairs', pairId, 'quickMessages');
        const q = query(messagesRef, orderBy('order', 'asc'));
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
          // カスタムメッセージがない場合はデフォルトを使用
          setQuickMessages([...DEFAULT_QUICK_MESSAGES]);
        } else {
          const messages = snapshot.docs.map(doc => doc.data().content);
          setQuickMessages(messages);
        }
      } catch (error) {
        console.error('Error loading quick messages:', error);
        setQuickMessages([...DEFAULT_QUICK_MESSAGES]);
      } finally {
        setLoading(false);
      }
    };

    loadQuickMessages();
  }, [pairId]);

  const saveQuickMessages = async (messages: string[]) => {
    if (!pairId) return;

    try {
      const messagesRef = collection(db, 'pairs', pairId, 'quickMessages');

      // 既存のメッセージを削除
      const snapshot = await getDocs(messagesRef);
      await Promise.all(snapshot.docs.map(doc => deleteDoc(doc.ref)));

      // 新しいメッセージを保存
      const now = Timestamp.now();
      await Promise.all(
        messages.map((content, index) =>
          setDoc(doc(messagesRef, `msg_${index}`), {
            content,
            order: index,
            createdAt: now,
            updatedAt: now,
          })
        )
      );

      setQuickMessages(messages);
    } catch (error) {
      console.error('Error saving quick messages:', error);
      throw error;
    }
  };

  return { quickMessages, loading, saveQuickMessages };
}
