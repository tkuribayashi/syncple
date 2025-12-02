import { useState, useEffect } from 'react';
import { collection, doc, getDocs, setDoc, deleteDoc, query, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { DEFAULT_QUICK_MESSAGES } from '@/types';
import { v4 as uuidv4 } from 'uuid';

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
      const snapshot = await getDocs(messagesRef);

      const now = Timestamp.now();
      const existingDocs = snapshot.docs;

      // 更新または追加
      const updates = messages.map((content, index) => {
        const docId = existingDocs[index]?.id || uuidv4();
        return setDoc(doc(messagesRef, docId), {
          content,
          order: index,
          updatedAt: now,
        }, { merge: true });
      });

      // 余分なドキュメントを削除
      const deletes = existingDocs
        .slice(messages.length)
        .map(doc => deleteDoc(doc.ref));

      await Promise.all([...updates, ...deletes]);
      setQuickMessages(messages);
    } catch (error) {
      console.error('Error saving quick messages:', error);
      throw error;
    }
  };

  return { quickMessages, loading, saveQuickMessages };
}
