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
import { DINNER_STATUSES, DEFAULT_DINNER_STATUS_KEYS } from '@/types';

// 動的キーに対応するため string 型に拡張
export type DinnerStatusKey = string;
export type DinnerStatusMap = Record<DinnerStatusKey, string>;

// 順序情報を含む型
export type DinnerStatusData = DinnerStatusMap & {
  _order?: DinnerStatusKey[];
};

const DEFAULT_STATUSES: DinnerStatusMap = { ...DINNER_STATUSES };
const DEFAULT_ORDER: DinnerStatusKey[] = [...DEFAULT_DINNER_STATUS_KEYS];

export function useDinnerStatusOptions(pairId: string | null) {
  const [statuses, setStatuses] = useState<DinnerStatusMap>(DEFAULT_STATUSES);
  const [statusOrder, setStatusOrder] = useState<DinnerStatusKey[]>(DEFAULT_ORDER);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!pairId) {
      setLoading(false);
      return;
    }

    // リアルタイム監視
    const unsubscribe = onSnapshot(
      doc(db, 'pairs', pairId, 'settings', 'dinnerStatuses'),
      (statusesDoc) => {
        if (!statusesDoc.exists()) {
          // カスタムステータスがない場合はデフォルトを使用
          setStatuses(DEFAULT_STATUSES);
          setStatusOrder(DEFAULT_ORDER);
        } else {
          const data = statusesDoc.data();
          // _order と updatedAt を除外して、ステータスのみを抽出
           
          const { _order, updatedAt: _updatedAt, ...statusData } = data;

          setStatuses(statusData as DinnerStatusMap);

          // _order がない場合はデフォルト順序を使用
          if (_order && Array.isArray(_order)) {
            setStatusOrder(_order as DinnerStatusKey[]);
          } else {
            setStatusOrder(DEFAULT_ORDER);
          }
        }
        setLoading(false);
      },
      (error) => {
        console.error('Error loading dinner status options:', error);
        setStatuses(DEFAULT_STATUSES);
        setStatusOrder(DEFAULT_ORDER);
        setLoading(false);
      }
    );

    // クリーンアップ関数
    return () => unsubscribe();
  }, [pairId]);

  const saveStatuses = async (newStatuses: DinnerStatusMap) => {
    if (!pairId) return;

    try {
      const now = Timestamp.now();
      await setDoc(doc(db, 'pairs', pairId, 'settings', 'dinnerStatuses'), {
        ...newStatuses,
        _order: statusOrder,
        updatedAt: now,
      });

      setStatuses(newStatuses);
    } catch (error) {
      console.error('Error saving dinner status options:', error);
      throw error;
    }
  };

  const reorderStatuses = async (newOrder: DinnerStatusKey[]) => {
    if (!pairId) return;

    try {
      const now = Timestamp.now();
      await setDoc(doc(db, 'pairs', pairId, 'settings', 'dinnerStatuses'), {
        ...statuses,
        _order: newOrder,
        updatedAt: now,
      });

      setStatusOrder(newOrder);
    } catch (error) {
      console.error('Error reordering statuses:', error);
      throw error;
    }
  };

  /**
   * 新しいステータスを追加
   */
  const addStatus = async (label: string): Promise<DinnerStatusKey> => {
    if (!pairId) throw new Error('Pair ID not found');

    // 新しいステータスキーを生成（タイムスタンプベース）
    const newKey = `custom_status_${Date.now()}`;

    const newStatuses = {
      ...statuses,
      [newKey]: label.trim() || '新しいステータス',
    };

    const newOrder = [...statusOrder, newKey];

    try {
      const now = Timestamp.now();
      await setDoc(doc(db, 'pairs', pairId, 'settings', 'dinnerStatuses'), {
        ...newStatuses,
        _order: newOrder,
        updatedAt: now,
      });

      setStatuses(newStatuses);
      setStatusOrder(newOrder);

      return newKey;
    } catch (error) {
      console.error('Error adding status:', error);
      throw error;
    }
  };

  /**
   * ステータスを削除し、既存の晩ご飯ステータスを一括更新
   */
  const deleteStatus = async (key: DinnerStatusKey): Promise<void> => {
    if (!pairId) throw new Error('Pair ID not found');

    // ステータスの削除
     
    const { [key]: _, ...remainingStatuses } = statuses;
    const newOrder = statusOrder.filter((k) => k !== key);

    try {
      const now = Timestamp.now();

      // ステータスを削除
      await setDoc(doc(db, 'pairs', pairId, 'settings', 'dinnerStatuses'), {
        ...remainingStatuses,
        _order: newOrder,
        updatedAt: now,
      });

      // 既存の晩ご飯ステータスでこのステータスを使用しているものをnullに更新
      await updateDinnerStatusKey(pairId, key, null);

      setStatuses(remainingStatuses);
      setStatusOrder(newOrder);
    } catch (error) {
      console.error('Error deleting status:', error);
      throw error;
    }
  };

  /**
   * 指定されたステータスを使用している晩ご飯ステータスの件数を取得
   */
  const getStatusUsageCount = async (key: DinnerStatusKey): Promise<number> => {
    if (!pairId) return 0;

    try {
      const dinnerStatusRef = collection(db, 'pairs', pairId, 'dinnerStatus');
      const q = query(dinnerStatusRef, where('status', '==', key));
      const snapshot = await getDocs(q);

      return snapshot.size;
    } catch (error) {
      console.error('Error getting status usage count:', error);
      return 0;
    }
  };

  return {
    statuses,
    statusOrder,
    loading,
    saveStatuses,
    reorderStatuses,
    addStatus,
    deleteStatus,
    getStatusUsageCount,
  };
}

/**
 * 指定されたステータスを使用している晩ご飯ステータスを一括更新（nullに変換）
 */
async function updateDinnerStatusKey(
  pairId: string,
  oldStatus: string,
  newStatus: string | null
): Promise<void> {
  const dinnerStatusRef = collection(db, 'pairs', pairId, 'dinnerStatus');
  const q = query(dinnerStatusRef, where('status', '==', oldStatus));
  const snapshot = await getDocs(q);

  if (snapshot.empty) return;

  // Firestore バッチ処理（最大500件）
  const batch = writeBatch(db);

  snapshot.docs.forEach((docSnapshot) => {
    batch.update(docSnapshot.ref, {
      status: newStatus,
      updatedAt: Timestamp.now(),
    });
  });

  await batch.commit();
}
