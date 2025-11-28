import { useEffect, useState, useRef, useCallback } from 'react';
import { getToken } from 'firebase/messaging';
import { doc, setDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { getMessagingInstance } from '@/lib/firebase';
import { db } from '@/lib/firebase';

export function useFCMToken(userId: string | null) {
  const [token, setToken] = useState<string | null>(null);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  const tokenRef = useRef<string | null>(null);
  const userIdRef = useRef<string | null>(userId);
  const [isRequesting, setIsRequesting] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // クライアントサイドであることを確認
  useEffect(() => {
    setIsClient(true);
  }, []);

  // userIdRefを常に最新の値に保つ
  useEffect(() => {
    userIdRef.current = userId;
  }, [userId]);

  // FCMトークンの取得と保存
  const initializeFCMToken = useCallback(async (uid: string) => {
    try {
      const messaging = await getMessagingInstance();
      if (!messaging) {
        return;
      }

      if (!('serviceWorker' in navigator)) {
        return;
      }

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
        // Service Workerの登録に失敗してもアプリは動作し続けるべき
      }
    } catch (error) {
      console.error('Error initializing FCM:', error);
      // FCMの初期化に失敗してもアプリは動作し続けるべき
    }
  }, []);

  // 通知許可をリクエストする関数（ユーザーアクションから呼び出す）
  const requestPermission = useCallback(async () => {
    if (!isClient) {
      return false;
    }

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
  }, [isClient, userId, initializeFCMToken]);

  // 初回ロード時に通知許可の状態を確認
  useEffect(() => {
    if (!isClient) return;
    if (!('Notification' in window)) return;

    setNotificationPermission(Notification.permission);
  }, [isClient]);

  // 既に許可されている場合は自動的にトークンを取得
  useEffect(() => {
    if (!isClient) return;
    if (!userId) return;
    if (!('Notification' in window)) return;

    if (Notification.permission === 'granted') {
      initializeFCMToken(userId);
    }
  }, [isClient, userId, initializeFCMToken]);

  // クリーンアップ（アンマウント時のみ実行）
  useEffect(() => {
    return () => {
      const currentUserId = userIdRef.current;
      const currentToken = tokenRef.current;

      if (currentToken && currentUserId) {
        const userRef = doc(db, 'users', currentUserId);
        setDoc(userRef, {
          fcmTokens: arrayRemove(currentToken),
        }, { merge: true }).catch(console.error);
      }
    };
    // 空の依存配列にして、アンマウント時のみクリーンアップを実行
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    token,
    notificationPermission,
    requestPermission,
    isRequesting
  };
}
