import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { DINNER_STATUSES, DinnerStatusType } from '@/types';

export type DinnerStatusMap = Record<DinnerStatusType, string>;

const DEFAULT_STATUSES: DinnerStatusMap = { ...DINNER_STATUSES };

export function useDinnerStatusOptions(pairId: string | null) {
  const [statuses, setStatuses] = useState<DinnerStatusMap>(DEFAULT_STATUSES);
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
        } else {
          const data = statusesDoc.data();
          // updatedAtなどのメタデータを除外して、ステータスのみを抽出
          const { updatedAt, ...statusData } = data;
          setStatuses(statusData as DinnerStatusMap);
        }
      } catch (error) {
        console.error('Error loading dinner status options:', error);
        setStatuses(DEFAULT_STATUSES);
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
        updatedAt: now,
      });

      setStatuses(newStatuses);
    } catch (error) {
      console.error('Error saving dinner status options:', error);
      throw error;
    }
  };

  return { statuses, loading, saveStatuses };
}
