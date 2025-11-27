'use client';

import { useEffect, useState } from 'react';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Schedule } from '@/types';
import { useAuth } from '@/contexts/AuthContext';

export function useSchedules(pairId: string | null) {
  const { user } = useAuth();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!pairId) {
      setLoading(false);
      return;
    }

    const schedulesRef = collection(db, 'pairs', pairId, 'schedules');
    const q = query(schedulesRef, orderBy('date', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const schedulesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Schedule[];
      setSchedules(schedulesData);
      setLoading(false);
    });

    return unsubscribe;
  }, [pairId]);

  const addSchedule = async (scheduleData: Omit<Schedule, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    if (!pairId || !user) throw new Error('Pair ID or user not found');

    const now = Timestamp.now();
    const newSchedule = {
      ...scheduleData,
      userId: user.uid,
      createdAt: now,
      updatedAt: now,
    };

    await addDoc(collection(db, 'pairs', pairId, 'schedules'), newSchedule);
  };

  const updateSchedule = async (scheduleId: string, updates: Partial<Schedule>) => {
    if (!pairId) throw new Error('Pair ID not found');

    await updateDoc(doc(db, 'pairs', pairId, 'schedules', scheduleId), {
      ...updates,
      updatedAt: Timestamp.now(),
    });
  };

  const deleteSchedule = async (scheduleId: string) => {
    if (!pairId) throw new Error('Pair ID not found');

    await deleteDoc(doc(db, 'pairs', pairId, 'schedules', scheduleId));
  };

  return {
    schedules,
    loading,
    addSchedule,
    updateSchedule,
    deleteSchedule,
  };
}
