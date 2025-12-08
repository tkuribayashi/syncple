'use client';

import { useState, useEffect } from 'react';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  Timestamp,
  writeBatch,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ShoppingItem } from '@/types';

export function useShoppingItems(pairId: string | null) {
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!pairId) {
      // pairIdがnullの場合、データ取得の必要がないため即座にloading=falseに設定
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoading(false);
    } else {
      const q = query(
        collection(db, 'pairs', pairId, 'shoppingItems'),
        orderBy('order', 'asc')
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const itemsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as ShoppingItem[];
        setItems(itemsData);
        setLoading(false);
      });

      return unsubscribe;
    }
  }, [pairId]);

  const addItem = async (text: string, userId: string, pairId: string) => {
    if (!text.trim()) return;

    const maxOrder = items.length > 0 ? Math.max(...items.map((item) => item.order)) : 0;

    const newItem: Omit<ShoppingItem, 'id'> = {
      pairId,
      text: text.trim(),
      isCompleted: false,
      createdBy: userId,
      createdAt: Timestamp.now(),
      order: maxOrder + 1,
    };

    await addDoc(collection(db, 'pairs', pairId, 'shoppingItems'), newItem);
  };

  const toggleComplete = async (itemId: string, isCompleted: boolean, pairId: string) => {
    const itemRef = doc(db, 'pairs', pairId, 'shoppingItems', itemId);
    await updateDoc(itemRef, { isCompleted });
  };

  const deleteItem = async (itemId: string, pairId: string) => {
    const itemRef = doc(db, 'pairs', pairId, 'shoppingItems', itemId);
    await deleteDoc(itemRef);
  };

  const updateOrder = async (reorderedItems: ShoppingItem[], pairId: string) => {
    const batch = writeBatch(db);
    reorderedItems.forEach((item, index) => {
      if (item.id) {
        const itemRef = doc(db, 'pairs', pairId, 'shoppingItems', item.id);
        batch.update(itemRef, { order: index });
      }
    });
    await batch.commit();
  };

  const deleteCompletedItems = async (pairId: string) => {
    const batch = writeBatch(db);
    items.filter((item) => item.isCompleted).forEach((item) => {
      if (item.id) {
        const itemRef = doc(db, 'pairs', pairId, 'shoppingItems', item.id);
        batch.delete(itemRef);
      }
    });
    await batch.commit();
  };

  return {
    items,
    loading,
    addItem,
    toggleComplete,
    deleteItem,
    updateOrder,
    deleteCompletedItems,
  };
}
