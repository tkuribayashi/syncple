import { useEffect, useState, useRef } from 'react';
import { getToken, onMessage } from 'firebase/messaging';
import { doc, setDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { getMessagingInstance } from '@/lib/firebase';
import { db } from '@/lib/firebase';

export function useFCMToken(userId: string | null) {
  const [token, setToken] = useState<string | null>(null);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  const tokenRef = useRef<string | null>(null);

  useEffect(() => {
    if (!userId) return;

    const initializeFCM = async () => {
      try {
        // 通知許可をリクエスト
        const permission = await Notification.requestPermission();
        setNotificationPermission(permission);

        if (permission !== 'granted') {
          return;
        }

        // Messagingインスタンスを取得
        const messaging = await getMessagingInstance();
        if (!messaging) {
          return;
        }

        // サービスワーカーを登録
        if ('serviceWorker' in navigator) {
          try {
            const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');

            // Service Workerがアクティブになるまで待つ
            await navigator.serviceWorker.ready;

            // FCMトークンを取得
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

              // Firestoreにトークンを保存
              const userRef = doc(db, 'users', userId);
              await setDoc(userRef, {
                fcmTokens: arrayUnion(currentToken),
              }, { merge: true });
            }
          } catch (swError) {
            console.error('Service Worker registration failed:', swError);
          }
        }

        // フォアグラウンドメッセージの受信
        onMessage(messaging, (payload) => {
          // フォアグラウンドでもカスタム通知を表示
          if (payload.notification) {
            new Notification(payload.notification.title || 'New Message', {
              body: payload.notification.body || '',
              icon: '/icon-192x192.png',
              tag: payload.data?.type || 'notification',
              requireInteraction: false,
            });
          }
        });
      } catch (error) {
        console.error('Error initializing FCM:', error);
      }
    };

    initializeFCM();

    // クリーンアップ: トークンを削除
    return () => {
      if (tokenRef.current && userId) {
        const userRef = doc(db, 'users', userId);
        setDoc(userRef, {
          fcmTokens: arrayRemove(tokenRef.current),
        }, { merge: true }).catch(console.error);
      }
    };
  }, [userId]);

  return { token, notificationPermission };
}
