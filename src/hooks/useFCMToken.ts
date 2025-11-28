import { useEffect, useState, useRef, useCallback } from 'react';
import { getToken } from 'firebase/messaging';
import { doc, setDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { getMessagingInstance } from '@/lib/firebase';
import { db } from '@/lib/firebase';

export function useFCMToken(userId: string | null) {
  const [token, setToken] = useState<string | null>(null);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  const tokenRef = useRef<string | null>(null);
  const [isRequesting, setIsRequesting] = useState(false);

  // 通知許可をリクエストする関数（ユーザーアクションから呼び出す）
  const requestPermission = useCallback(async () => {
    if (!userId) {
      return false;
    }

    if (!('Notification' in window)) {
      return false;
    }

    setIsRequesting(true);
    try {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);

      if (permission !== 'granted') {
        return false;
      }

      // FCMトークンを取得して保存
      await initializeFCMToken(userId);
      return true;
    } catch (error) {
      console.error('通知許可のリクエストに失敗:', error);
      return false;
    } finally {
      setIsRequesting(false);
    }
  }, [userId]);

  // FCMトークンの取得と保存
  const initializeFCMToken = async (uid: string) => {
    try {
      const messaging = await getMessagingInstance();
      if (!messaging) {
        return;
      }

      if ('serviceWorker' in navigator) {
        try {
          const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
          await navigator.serviceWorker.ready;

          const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
          if (!vapidKey) {
            console.error('VAPID key not found');
            return;
          }

          const currentToken = await getToken(messaging, {
            vapidKey,
            serviceWorkerRegistration: registration,
          });

          if (currentToken) {
            setToken(currentToken);
            tokenRef.current = currentToken;

            // このデバイスのトークンのみを保存（重複を防ぐため配列を上書き）
            const userRef = doc(db, 'users', uid);
            await setDoc(userRef, {
              fcmTokens: [currentToken],
            }, { merge: true });
          }
        } catch (swError) {
          console.error('Service Worker registration failed:', swError);
        }
      }

      // Service Workerが全ての通知を処理するため、フォアグラウンドハンドラは不要
    } catch (error) {
      console.error('Error initializing FCM:', error);
    }
  };

  // 初回ロード時に通知許可の状態を確認
  useEffect(() => {
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  // 既に許可されている場合は自動的にトークンを取得
  useEffect(() => {
    if (!userId) return;

    if (Notification.permission === 'granted') {
      initializeFCMToken(userId);
    }
  }, [userId]);

  // クリーンアップ
  useEffect(() => {
    return () => {
      if (tokenRef.current && userId) {
        const userRef = doc(db, 'users', userId);
        setDoc(userRef, {
          fcmTokens: arrayRemove(tokenRef.current),
        }, { merge: true }).catch(console.error);
      }
    };
  }, [userId]);

  return {
    token,
    notificationPermission,
    requestPermission,
    isRequesting
  };
}
