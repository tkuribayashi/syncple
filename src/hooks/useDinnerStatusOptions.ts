import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { DINNER_STATUSES, DinnerStatusType } from '@/types';

export type DinnerStatusMap = Record<DinnerStatusType, string>;

// 順序情報を含む型
export type DinnerStatusData = DinnerStatusMap & {
  _order?: DinnerStatusType[];
};

const DEFAULT_STATUSES: DinnerStatusMap = { ...DINNER_STATUSES };
const DEFAULT_ORDER: DinnerStatusType[] = [
  'alone',
  'cooking',
  'cooking_together',
  'undecided',
];

export function useDinnerStatusOptions(pairId: string | null) {
  const [statuses, setStatuses] = useState<DinnerStatusMap>(DEFAULT_STATUSES);
  const [statusOrder, setStatusOrder] = useState<DinnerStatusType[]>(DEFAULT_ORDER);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!pairId) {
      setLoading(false);
      return;
    }

    const loadStatuses = async () => {
      try {
        const statusesDoc = await getDoc(doc(db, 'pairs', pairId, 'settings', 'dinnerStatuses'));

        if (!statusesDoc.exists()) {
          // カスタムステータスがない場合はデフォルトを使用
          setStatuses(DEFAULT_STATUSES);
          setStatusOrder(DEFAULT_ORDER);
        } else {
          const data = statusesDoc.data();
          // _order と updatedAt を除外して、ステータスのみを抽出
          const { _order, updatedAt, ...statusData } = data;

          setStatuses(statusData as DinnerStatusMap);

          // _order がない場合はデフォルト順序を使用
          if (_order && Array.isArray(_order)) {
            setStatusOrder(_order as DinnerStatusType[]);
          } else {
            setStatusOrder(DEFAULT_ORDER);
          }
        }
      } catch (error) {
        console.error('Error loading dinner status options:', error);
        setStatuses(DEFAULT_STATUSES);
        setStatusOrder(DEFAULT_ORDER);
      } finally {
        setLoading(false);
      }
    };

    loadStatuses();
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

  const reorderStatuses = async (newOrder: DinnerStatusType[]) => {
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

  return { statuses, statusOrder, loading, saveStatuses, reorderStatuses };
}
