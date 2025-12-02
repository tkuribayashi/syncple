'use client';

import { toast } from '@/components/ui/Toast';

interface NotificationSectionProps {
  fcm: {
    notificationPermission: NotificationPermission;
    isRequesting: boolean;
    requestPermission: () => Promise<boolean>;
  };
}

export default function NotificationSection({ fcm }: NotificationSectionProps) {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <h2 className="text-lg font-bold text-gray-900 mb-4">プッシュ通知</h2>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900">通知の状態</p>
            <p className="text-xs text-gray-500 mt-1">
              {fcm.notificationPermission === 'granted' && '✅ 通知が有効です'}
              {fcm.notificationPermission === 'denied' && '❌ 通知が拒否されています'}
              {fcm.notificationPermission === 'default' && '⚠️ 通知が未設定です'}
            </p>
          </div>
          {fcm.notificationPermission === 'default' && (
            <button
              onClick={async () => {
                const granted = await fcm.requestPermission();
                if (granted) {
                  toast.success('通知が有効になりました！');
                } else {
                  toast.error('通知が拒否されました。ブラウザの設定から変更できます。');
                }
              }}
              disabled={fcm.isRequesting}
              className="btn btn-primary px-6 disabled:opacity-50"
            >
              {fcm.isRequesting ? '設定中...' : '通知を有効にする'}
            </button>
          )}
        </div>
        {fcm.notificationPermission === 'denied' && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-800">
              通知が拒否されています。ブラウザまたはiOSの設定から通知を許可してください。
            </p>
            <p className="text-xs text-red-600 mt-2">
              iOS: 設定 → Safari → Webサイトの設定 → 通知
            </p>
          </div>
        )}
        {fcm.notificationPermission === 'granted' && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm text-green-800">
              パートナーからメッセージや予定が届くとプッシュ通知でお知らせします。
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
