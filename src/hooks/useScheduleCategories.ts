import { useState, useEffect } from 'react';
import {
  doc,
  onSnapshot,
  setDoc,
  Timestamp,
  collection,
  query,
  where,
  getDocs,
  writeBatch,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { SCHEDULE_CATEGORIES, DEFAULT_SCHEDULE_CATEGORY_KEYS } from '@/types';

// 動的キーに対応するため string 型に拡張
export type ScheduleCategoryKey = string;
export type ScheduleCategoryMap = Record<ScheduleCategoryKey, string>;

// 順序情報を含む型
export type ScheduleCategoryData = ScheduleCategoryMap & {
  _order?: ScheduleCategoryKey[];
};

const DEFAULT_CATEGORIES: ScheduleCategoryMap = { ...SCHEDULE_CATEGORIES };
const DEFAULT_ORDER: ScheduleCategoryKey[] = [...DEFAULT_SCHEDULE_CATEGORY_KEYS];

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
           
          const { _order, updatedAt: _updatedAt, ...categoryData } = data;

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

  /**
   * 新しいカテゴリを追加
   */
  const addCategory = async (label: string): Promise<ScheduleCategoryKey> => {
    if (!pairId) throw new Error('Pair ID not found');

    // 新しいカテゴリキーを生成（タイムスタンプベース）
    const newKey = `custom_category_${Date.now()}`;

    const newCategories = {
      ...categories,
      [newKey]: label.trim() || '新しいカテゴリ',
    };

    const newOrder = [...categoryOrder, newKey];

    try {
      const now = Timestamp.now();
      await setDoc(doc(db, 'pairs', pairId, 'settings', 'scheduleCategories'), {
        ...newCategories,
        _order: newOrder,
        updatedAt: now,
      });

      setCategories(newCategories);
      setCategoryOrder(newOrder);

      return newKey;
    } catch (error) {
      console.error('Error adding category:', error);
      throw error;
    }
  };

  /**
   * カテゴリを削除し、既存の予定を一括更新
   */
  const deleteCategory = async (key: ScheduleCategoryKey): Promise<void> => {
    if (!pairId) throw new Error('Pair ID not found');

    // カテゴリの削除
     
    const { [key]: _, ...remainingCategories } = categories;
    const newOrder = categoryOrder.filter((k) => k !== key);

    try {
      const now = Timestamp.now();

      // カテゴリを削除
      await setDoc(doc(db, 'pairs', pairId, 'settings', 'scheduleCategories'), {
        ...remainingCategories,
        _order: newOrder,
        updatedAt: now,
      });

      // 既存の予定でこのカテゴリを使用しているものをnullに更新
      await updateSchedulesCategory(pairId, key, null);

      setCategories(remainingCategories);
      setCategoryOrder(newOrder);
    } catch (error) {
      console.error('Error deleting category:', error);
      throw error;
    }
  };

  /**
   * 指定されたカテゴリを使用している予定の件数を取得
   */
  const getCategoryUsageCount = async (key: ScheduleCategoryKey): Promise<number> => {
    if (!pairId) return 0;

    try {
      const schedulesRef = collection(db, 'pairs', pairId, 'schedules');
      const q = query(schedulesRef, where('category', '==', key));
      const snapshot = await getDocs(q);

      return snapshot.size;
    } catch (error) {
      console.error('Error getting category usage count:', error);
      return 0;
    }
  };

  return {
    categories,
    categoryOrder,
    loading,
    saveCategories,
    reorderCategories,
    addCategory,
    deleteCategory,
    getCategoryUsageCount,
  };
}

/**
 * 指定されたカテゴリを使用している予定を一括更新（nullに変換）
 */
async function updateSchedulesCategory(
  pairId: string,
  oldCategory: string,
  newCategory: string | null
): Promise<void> {
  const schedulesRef = collection(db, 'pairs', pairId, 'schedules');
  const q = query(schedulesRef, where('category', '==', oldCategory));
  const snapshot = await getDocs(q);

  if (snapshot.empty) return;

  // Firestore バッチ処理（最大500件）
  const batch = writeBatch(db);

  snapshot.docs.forEach((docSnapshot) => {
    batch.update(docSnapshot.ref, {
      category: newCategory,
      updatedAt: Timestamp.now(),
    });
  });

  await batch.commit();
}
