#!/usr/bin/env node

/**
 * Firebase Messaging Service Worker生成スクリプト
 * ビルド時に環境変数から firebase-messaging-sw.js を生成します
 */

const fs = require('fs');
const path = require('path');

// 環境変数から Firebase 設定を取得
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// 必須の環境変数がすべて設定されているか確認
const missingVars = Object.entries(firebaseConfig)
  .filter(([_, value]) => !value)
  .map(([key]) => key);

if (missingVars.length > 0) {
  console.error('❌ 以下の環境変数が設定されていません:');
  missingVars.forEach(key => console.error(`   - NEXT_PUBLIC_FIREBASE_${key.replace(/[A-Z]/g, '_$&').toUpperCase()}`));
  process.exit(1);
}

// Service Worker のコンテンツを生成
const swContent = `// Firebase Messaging Service Worker
// このファイルはビルド時に自動生成されます (scripts/generate-sw.js)

importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Firebase設定
firebase.initializeApp(${JSON.stringify(firebaseConfig, null, 2)});

const messaging = firebase.messaging();

// バックグラウンドメッセージの処理
messaging.onBackgroundMessage((payload) => {
  const notificationTitle = payload.notification?.title || 'New Message';
  const notificationOptions = {
    body: payload.notification?.body || '',
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png',
    tag: payload.data?.type || 'notification',
    data: payload.data,
    requireInteraction: false,
    vibrate: [200, 100, 200],
  };

  return self.registration.showNotification(notificationTitle, notificationOptions)
    .catch((error) => {
      console.error('Error showing notification:', error);
    });
});

// 通知クリック時の処理
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const urlToOpen = event.notification.data?.type === 'message'
    ? '/messages'
    : '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // 既に開いているウィンドウがあればフォーカス
        for (const client of clientList) {
          if (client.url.includes(urlToOpen) && 'focus' in client) {
            return client.focus();
          }
        }
        // なければ新しいウィンドウを開く
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});
`;

// public ディレクトリに書き込み
const outputPath = path.join(__dirname, '../public/firebase-messaging-sw.js');
fs.writeFileSync(outputPath, swContent, 'utf8');

console.log('✅ firebase-messaging-sw.js を生成しました');
console.log(`   出力先: ${outputPath}`);
