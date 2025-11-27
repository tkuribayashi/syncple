import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { SCHEDULE_CATEGORIES } from '@/types';

export type ScheduleCategoryKey = keyof typeof SCHEDULE_CATEGORIES;
export type ScheduleCategoryMap = Record<ScheduleCategoryKey, string>;

const DEFAULT_CATEGORIES: ScheduleCategoryMap = { ...SCHEDULE_CATEGORIES };

export function useScheduleCategories(pairId: string | null) {
  const [categories, setCategories] = useState<ScheduleCategoryMap>(DEFAULT_CATEGORIES);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!pairId) {
      setLoading(false);
      return;
    }

    const loadCategories = async () => {
      try {
        const categoriesDoc = await getDoc(doc(db, 'pairs', pairId, 'settings', 'scheduleCategories'));

        if (!categoriesDoc.exists()) {
          // カスタムカテゴリがない場合はデフォルトを使用
          setCategories(DEFAULT_CATEGORIES);
        } else {
          const data = categoriesDoc.data();
          // updatedAtなどのメタデータを除外して、カテゴリのみを抽出
          const { updatedAt, ...categoryData } = data;
          setCategories(categoryData as ScheduleCategoryMap);
        }
      } catch (error) {
        console.error('Error loading schedule categories:', error);
        setCategories(DEFAULT_CATEGORIES);
      } finally {
        setLoading(false);
      }
    };

    loadCategories();
  }, [pairId]);

  const saveCategories = async (newCategories: ScheduleCategoryMap) => {
    if (!pairId) return;

    try {
      const now = Timestamp.now();
      await setDoc(doc(db, 'pairs', pairId, 'settings', 'scheduleCategories'), {
        ...newCategories,
        updatedAt: now,
      });

      setCategories(newCategories);
    } catch (error) {
      console.error('Error saving schedule categories:', error);
      throw error;
    }
  };

  return { categories, loading, saveCategories };
}
