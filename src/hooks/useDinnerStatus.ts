'use client';

import { useEffect, useState } from 'react';
import {
  collection,
  doc,
  setDoc,
  onSnapshot,
  Timestamp,
  query,
  where
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { DinnerStatus } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';

export function useDinnerStatus(pairId: string | null) {
  const { user } = useAuth();
  const [myStatus, setMyStatus] = useState<DinnerStatus | null>(null);
  const [partnerStatus, setPartnerStatus] = useState<DinnerStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const today = format(new Date(), 'yyyy-MM-dd');

  useEffect(() => {
    if (!pairId || !user) {
      // pairIdまたはuserがnullの場合、データ取得の必要がないため即座にloading=falseに設定
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoading(false);
    } else {
      const dinnerStatusRef = collection(db, 'pairs', pairId, 'dinnerStatus');
      const q = query(dinnerStatusRef, where('date', '==', today));

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const statuses = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as DinnerStatus[];

        // 自分のステータスを探す
        const mine = statuses.find(s => s.userId === user.uid);
        setMyStatus(mine || null);

        // パートナーのステータスを探す
        const partner = statuses.find(s => s.userId !== user.uid);
        setPartnerStatus(partner || null);

        setLoading(false);
      });

      return unsubscribe;
    }
  }, [pairId, user, today]);

  const updateStatus = async (status: string) => {
    if (!pairId || !user) throw new Error('Pair ID or user not found');

    const docId = `${user.uid}_${today}`;
    const statusDoc = {
      userId: user.uid,
      date: today,
      status,
      updatedAt: Timestamp.now(),
    };

    await setDoc(doc(db, 'pairs', pairId, 'dinnerStatus', docId), statusDoc);
  };

  return {
    myStatus,
    partnerStatus,
    loading,
    updateStatus,
  };
}
