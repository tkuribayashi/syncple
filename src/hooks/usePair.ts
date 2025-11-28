'use client';

import { useEffect, useState } from 'react';
import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  query,
  where,
  getDocs,
  Timestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Pair, User } from '@/types';
import { generateInviteCode } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

export function usePair() {
  const { user, userProfile } = useAuth();
  const [pair, setPair] = useState<Pair | null>(null);
  const [partner, setPartner] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userProfile?.pairId) {
      setLoading(false);
      return;
    }

    const fetchPair = async () => {
      try {
        if (!userProfile.pairId) {
          setLoading(false);
          return;
        }
        const pairDoc = await getDoc(doc(db, 'pairs', userProfile.pairId));
        if (pairDoc.exists()) {
          const pairData = pairDoc.data() as Pair;
          setPair(pairData);

          // パートナーの情報を取得
          const partnerId = pairData.user1Id === user?.uid ? pairData.user2Id : pairData.user1Id;
          if (partnerId) {
            const partnerDoc = await getDoc(doc(db, 'users', partnerId));
            if (partnerDoc.exists()) {
              setPartner(partnerDoc.data() as User);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching pair:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPair();
  }, [userProfile?.pairId, user?.uid]);

  const createPair = async () => {
    if (!user) throw new Error('User not authenticated');

    const inviteCode = generateInviteCode();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7日後に期限切れ

    const pairData: Pair = {
      user1Id: user.uid,
      user2Id: null,
      inviteCode,
      inviteCodeExpiresAt: Timestamp.fromDate(expiresAt),
      createdAt: Timestamp.now(),
    };

    const pairRef = doc(collection(db, 'pairs'));
    await setDoc(pairRef, pairData);

    // ユーザーのpairIdを更新（merge: trueでドキュメントが存在しない場合も安全）
    await setDoc(doc(db, 'users', user.uid), {
      pairId: pairRef.id,
      updatedAt: Timestamp.now(),
    }, { merge: true });

    return { pairId: pairRef.id, inviteCode };
  };

  const joinPair = async (inviteCode: string) => {
    if (!user) throw new Error('User not authenticated');

    // 招待コードでペアを検索
    const pairsRef = collection(db, 'pairs');
    const q = query(pairsRef, where('inviteCode', '==', inviteCode));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      throw new Error('Invalid invite code');
    }

    const pairDoc = querySnapshot.docs[0];
    const pairData = pairDoc.data() as Pair;

    // 期限チェック
    if (pairData.inviteCodeExpiresAt.toDate() < new Date()) {
      throw new Error('Invite code has expired');
    }

    // すでにペアが完成している場合
    if (pairData.user2Id) {
      throw new Error('This pair is already complete');
    }

    // ペアに参加
    await setDoc(doc(db, 'pairs', pairDoc.id), {
      user2Id: user.uid,
    }, { merge: true });

    // ユーザーのpairIdを更新（merge: trueでドキュメントが存在しない場合も安全）
    await setDoc(doc(db, 'users', user.uid), {
      pairId: pairDoc.id,
      updatedAt: Timestamp.now(),
    }, { merge: true });

    return pairDoc.id;
  };

  return {
    pair,
    partner,
    loading,
    createPair,
    joinPair,
  };
}
