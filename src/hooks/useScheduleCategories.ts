import { useState, useEffect } from 'react';
import { doc, onSnapshot, setDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { SCHEDULE_CATEGORIES } from '@/types';

export type ScheduleCategoryKey = keyof typeof SCHEDULE_CATEGORIES;
export type ScheduleCategoryMap = Record<ScheduleCategoryKey, string>;

// 順序情報を含む型
export type ScheduleCategoryData = ScheduleCategoryMap & {
  _order?: ScheduleCategoryKey[];
};

const DEFAULT_CATEGORIES: ScheduleCategoryMap = { ...SCHEDULE_CATEGORIES };
const DEFAULT_ORDER: ScheduleCategoryKey[] = [
  'remote',
  'office',
  'business_trip',
  'vacation',
  'outing',
  'other',
];

export function useScheduleCategories(pairId: string | null) {
  const [categories, setCategories] = useState<ScheduleCategoryMap>(DEFAULT_CATEGORIES);
  const [categoryOrder, setCategoryOrder] = useState<ScheduleCategoryKey[]>(DEFAULT_ORDER);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!pairId) {
      setLoading(false);
      return;
    }

    // リアルタイム監視
    const unsubscribe = onSnapshot(
      doc(db, 'pairs', pairId, 'settings', 'scheduleCategories'),
      (categoriesDoc) => {
        if (!categoriesDoc.exists()) {
          // カスタムカテゴリがない場合はデフォルトを使用
          setCategories(DEFAULT_CATEGORIES);
          setCategoryOrder(DEFAULT_ORDER);
        } else {
          const data = categoriesDoc.data();
          // _order と updatedAt を除外して、カテゴリのみを抽出
          const { _order, updatedAt, ...categoryData } = data;

          setCategories(categoryData as ScheduleCategoryMap);

          // _order がない場合はデフォルト順序を使用
          if (_order && Array.isArray(_order)) {
            setCategoryOrder(_order as ScheduleCategoryKey[]);
          } else {
            setCategoryOrder(DEFAULT_ORDER);
          }
        }
        setLoading(false);
      },
      (error) => {
        console.error('Error loading schedule categories:', error);
        setCategories(DEFAULT_CATEGORIES);
        setCategoryOrder(DEFAULT_ORDER);
        setLoading(false);
      }
    );

    // クリーンアップ関数
    return () => unsubscribe();
  }, [pairId]);

  const saveCategories = async (newCategories: ScheduleCategoryMap) => {
    if (!pairId) return;

    try {
      const now = Timestamp.now();
      await setDoc(doc(db, 'pairs', pairId, 'settings', 'scheduleCategories'), {
        ...newCategories,
        _order: categoryOrder,
        updatedAt: now,
      });

      setCategories(newCategories);
    } catch (error) {
      console.error('Error saving schedule categories:', error);
      throw error;
    }
  };

  const reorderCategories = async (newOrder: ScheduleCategoryKey[]) => {
    if (!pairId) return;

    try {
      const now = Timestamp.now();
      await setDoc(doc(db, 'pairs', pairId, 'settings', 'scheduleCategories'), {
        ...categories,
        _order: newOrder,
        updatedAt: now,
      });

      setCategoryOrder(newOrder);
    } catch (error) {
      console.error('Error reordering categories:', error);
      throw error;
    }
  };

  return { categories, categoryOrder, loading, saveCategories, reorderCategories };
}
