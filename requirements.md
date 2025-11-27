# 夫婦連絡Webアプリ 要件定義書

## 概要

夫婦間の日常コミュニケーションに特化したWebアプリケーション。
予定共有とクイックメッセージ機能により、シンプルかつ効率的な連絡を実現する。

---

## 機能要件

### 1. ユーザー管理・認証

- ユーザー登録（メールアドレス + パスワード）
- ログイン / ログアウト
- パートナー招待機能（招待リンクまたはペアリングコード）
- 二人一組のペア管理

### 2. スケジュール共有

#### 2.1 予定の登録・編集・削除

- 入力項目
  - 日付（必須）
  - タイトル（必須）
  - カテゴリ（必須、選択式）
  - メモ（任意）
  - 終日 or 時間指定
- カテゴリのプリセット
  - 在宅勤務
  - 出社
  - 出張
  - 休暇
  - 外出
  - その他

#### 2.2 繰り返し予定

- 繰り返しパターン：毎日、毎週、毎月
- 例：「毎週水曜日は在宅勤務」
- 実装方式: 繰り返しルールとして保存し、表示時にクライアント側で展開

#### 2.3 カレンダー表示

- 週表示 / 月表示の切り替え
- 自分とパートナーの予定を色分けして並列表示
- 今日の予定をホーム画面に表示

### 3. クイックメッセージ

#### 3.1 定型メッセージ送信

- ワンタッチで定型文を送信
- プリセット定型文
  - 「{分}分後に帰ります」（分数は入力）
  - 「今から帰ります」
  - 「遅くなります」
  - 「ご飯炊いておいて」
  - 「買い物ある？」
  - 「了解」
  - 「ありがとう」

#### 3.2 定型文カスタマイズ

- ユーザーが定型文を追加・編集・削除可能
- 変数プレースホルダー対応（{分}、{時間}など）
- 表示順の並び替え

#### 3.3 フリーテキストメッセージ

- 定型文以外のメッセージも送信可能
- シンプルなテキスト入力

### 4. 通知システム

#### 4.1 プッシュ通知

- メッセージ受信時に即座にプッシュ通知
- 通知タップでアプリを開く

#### 4.2 予定リマインダー

- 翌日の予定を前日夜（設定可能な時刻）に通知
- 当日朝のリマインダー（オプション）

### 5. 買い物リスト共有

- 共有買い物リストの作成
- アイテムの追加・削除
- 購入済みチェック（どちらがチェックしたかわかる）
- 「帰りに買ってきて」ボタンで相手に通知付きで依頼

### 6. ステータス表示

- 現在のステータスを設定
  - 手が空いてる
  - 会議中
  - 移動中
  - 集中作業中
  - 休憩中
- ホーム画面でお互いのステータスを表示
- ステータス変更時の通知（オプション）

### 7. ホーム画面（ダッシュボード）

- お互いの今日の予定を表示
- お互いの現在のステータスを表示
- 最新のメッセージを表示
- クイックメッセージボタンへのアクセス

---

## 非機能要件

### パフォーマンス

- メッセージ送信から通知到達まで: 3秒以内
- 初回ページロード: 3秒以内
- 画面遷移: 1秒以内
- Firestoreのリアルタイムリスナーによる即時データ同期

### セキュリティ

- 全通信のHTTPS暗号化（Firebase Hostingで自動対応）
- Firebase Authenticationによる認証管理
- Firestore Security Rulesによるデータアクセス制御
- ペア以外のユーザーからのデータアクセス遮断

### 可用性

- Firebase の SLA に準拠（99.95%）
- プッシュ通知の高い到達率（FCM）

### ユーザビリティ

- PWA対応（ホーム画面への追加、オフライン対応）
- スマートフォンファースト設計
- 片手操作を考慮したUI
- クイックメッセージ送信: 2タップ以内で完了
- 予定登録: 4タップ以内で完了

### 運用・保守

- Firestoreの自動バックアップ設定
- Firebase Crashlyticsによるエラー監視
- Cloud Functionsのログ監視

### スケーラビリティ

- 当面は単一ペア（2ユーザー）専用として設計
- 将来的なマルチテナント化は考慮するが優先度低

---

## 技術スタック

### アーキテクチャ概要

```
┌─────────────────────────────────────────────────┐
│                    Frontend                      │
│        Next.js 14 + React + TypeScript          │
│              (Firebase Hosting)                  │
└─────────────────────┬───────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────┐
│                Firebase Services                 │
├─────────────────────────────────────────────────┤
│  Authentication    │ メール/パスワード認証       │
│  Firestore         │ NoSQLデータベース           │
│  Cloud Functions   │ プッシュ通知送信など        │
│  Cloud Messaging   │ プッシュ通知 (FCM)          │
│  Hosting           │ 静的サイトホスティング       │
└─────────────────────────────────────────────────┘
```

### フロントエンド

| 項目 | 技術 |
|------|------|
| フレームワーク | Next.js 14 (App Router) |
| 言語 | TypeScript |
| スタイリング | Tailwind CSS |
| 状態管理 | React hooks + Context |
| Firebase SDK | firebase, react-firebase-hooks |
| PWA | next-pwa |
| フォーム | React Hook Form + Zod |
| 日付操作 | date-fns |
| カレンダーUI | react-calendar または自作 |

### バックエンド（Firebase）

| 項目 | 技術 |
|------|------|
| 認証 | Firebase Authentication |
| データベース | Cloud Firestore |
| サーバーサイド処理 | Cloud Functions for Firebase (TypeScript) |
| プッシュ通知 | Firebase Cloud Messaging (FCM) |
| ホスティング | Firebase Hosting |
| ストレージ | Cloud Storage for Firebase（将来の拡張用） |

### 開発環境

| 項目 | 技術 |
|------|------|
| Node.js | 20+ |
| パッケージマネージャ | pnpm |
| コード品質 | ESLint + Prettier |
| テスト | Vitest（ユニット）、Playwright（E2E） |
| Firebase エミュレータ | ローカル開発用 |

---

## Firestore データモデル（コレクション設計）

### コレクション構造

```
/users/{userId}
/pairs/{pairId}
/pairs/{pairId}/schedules/{scheduleId}
/pairs/{pairId}/messages/{messageId}
/pairs/{pairId}/quickMessages/{quickMessageId}
/pairs/{pairId}/shoppingItems/{itemId}
```

### users コレクション

```typescript
interface User {
  // ドキュメントID = Firebase Auth UID
  email: string;
  displayName: string;
  pairId: string | null;        // 所属するペアのID
  fcmTokens: string[];          // プッシュ通知用トークン（複数デバイス対応）
  status: 'available' | 'in_meeting' | 'commuting' | 'focusing' | 'break';
  statusUpdatedAt: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### pairs コレクション

```typescript
interface Pair {
  // ドキュメントID = 自動生成
  user1Id: string;              // Firebase Auth UID
  user2Id: string | null;       // パートナー未参加の場合はnull
  inviteCode: string;           // 6桁の招待コード
  inviteCodeExpiresAt: Timestamp;
  createdAt: Timestamp;
}
```

### schedules サブコレクション（/pairs/{pairId}/schedules）

```typescript
interface Schedule {
  // ドキュメントID = 自動生成
  userId: string;               // 予定の所有者
  date: string;                 // "YYYY-MM-DD" 形式（範囲クエリ用）
  title: string;
  category: 'remote' | 'office' | 'business_trip' | 'vacation' | 'outing' | 'other';
  memo: string | null;
  isAllDay: boolean;
  startTime: string | null;     // "HH:mm" 形式
  endTime: string | null;       // "HH:mm" 形式
  // 繰り返し設定
  repeat: {
    pattern: 'none' | 'daily' | 'weekly' | 'monthly';
    dayOfWeek?: number;         // weekly の場合: 0(日)〜6(土)
    dayOfMonth?: number;        // monthly の場合: 1〜31
    endDate?: string;           // 繰り返し終了日 "YYYY-MM-DD"
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### messages サブコレクション（/pairs/{pairId}/messages）

```typescript
interface Message {
  // ドキュメントID = 自動生成
  senderId: string;             // 送信者のUID
  content: string;
  isRead: boolean;
  createdAt: Timestamp;
}
```

### quickMessages サブコレクション（/pairs/{pairId}/quickMessages）

```typescript
interface QuickMessage {
  // ドキュメントID = 自動生成
  userId: string | null;        // nullの場合はプリセット（共有）
  content: string;              // "{分}分後に帰ります" など
  order: number;                // 表示順
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### shoppingItems サブコレクション（/pairs/{pairId}/shoppingItems）

```typescript
interface ShoppingItem {
  // ドキュメントID = 自動生成
  name: string;
  isPurchased: boolean;
  purchasedBy: string | null;   // 購入者のUID
  purchasedAt: Timestamp | null;
  createdBy: string;            // 追加者のUID
  createdAt: Timestamp;
}
```

---

## Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // ユーザードキュメント: 本人のみ読み書き可能
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // ペアドキュメント: ペアのメンバーのみアクセス可能
    match /pairs/{pairId} {
      allow read: if request.auth != null &&
        (resource.data.user1Id == request.auth.uid ||
         resource.data.user2Id == request.auth.uid);
      allow create: if request.auth != null;
      allow update: if request.auth != null &&
        (resource.data.user1Id == request.auth.uid ||
         resource.data.user2Id == request.auth.uid);

      // サブコレクション: ペアのメンバーのみアクセス可能
      match /{subcollection}/{docId} {
        allow read, write: if request.auth != null &&
          get(/databases/$(database)/documents/pairs/$(pairId)).data.user1Id == request.auth.uid ||
          get(/databases/$(database)/documents/pairs/$(pairId)).data.user2Id == request.auth.uid;
      }
    }
  }
}
```

---

## Cloud Functions

### 実装する関数

```typescript
// 1. メッセージ送信時のプッシュ通知
export const onMessageCreated = functions.firestore
  .document('pairs/{pairId}/messages/{messageId}')
  .onCreate(async (snapshot, context) => {
    // 相手のFCMトークンを取得してプッシュ通知送信
  });

// 2. 買い物依頼時のプッシュ通知
export const onShoppingRequest = functions.https.onCall(async (data, context) => {
  // 「帰りに買ってきて」通知を送信
});

// 3. 予定リマインダー（スケジュール実行）
export const sendScheduleReminder = functions.pubsub
  .schedule('0 21 * * *')  // 毎日21時に実行
  .timeZone('Asia/Tokyo')
  .onRun(async (context) => {
    // 翌日の予定をチェックして通知
  });

// 4. 招待コード検証・ペア参加
export const joinPair = functions.https.onCall(async (data, context) => {
  // 招待コードを検証してペアに参加
});

// 5. ステータス変更通知（オプション）
export const onStatusChanged = functions.firestore
  .document('users/{userId}')
  .onUpdate(async (change, context) => {
    // ステータスが変更されたら相手に通知
  });
```

---

## 画面一覧

1. **ログイン画面** - メールアドレス・パスワードでログイン
2. **新規登録画面** - アカウント作成
3. **パートナー招待画面** - 招待コード表示 / 入力
4. **ホーム画面** - ダッシュボード（予定・ステータス・メッセージ概要）
5. **カレンダー画面** - 週表示 / 月表示の予定一覧
6. **予定登録画面** - 新規予定の入力フォーム
7. **予定詳細画面** - 予定の詳細表示・編集・削除
8. **メッセージ画面** - メッセージ履歴とクイックメッセージボタン
9. **定型文管理画面** - 定型文の追加・編集・削除・並び替え
10. **買い物リスト画面** - 共有買い物リスト
11. **設定画面** - 通知設定、プロフィール編集、ログアウト

---

## ディレクトリ構成

```
/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/             # 認証関連ページ
│   │   │   ├── login/
│   │   │   ├── register/
│   │   │   └── invite/
│   │   ├── (main)/             # メイン機能ページ
│   │   │   ├── page.tsx        # ホーム（ダッシュボード）
│   │   │   ├── calendar/
│   │   │   ├── messages/
│   │   │   ├── shopping/
│   │   │   └── settings/
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── ui/                 # 汎用UIコンポーネント
│   │   ├── calendar/           # カレンダー関連
│   │   ├── messages/           # メッセージ関連
│   │   └── shopping/           # 買い物リスト関連
│   ├── hooks/                  # カスタムフック
│   │   ├── useAuth.ts
│   │   ├── usePair.ts
│   │   ├── useSchedules.ts
│   │   ├── useMessages.ts
│   │   └── useShoppingList.ts
│   ├── lib/
│   │   ├── firebase.ts         # Firebase初期化
│   │   └── utils.ts
│   ├── types/                  # 型定義
│   │   └── index.ts
│   └── contexts/               # React Context
│       └── AuthContext.tsx
├── functions/                  # Cloud Functions
│   ├── src/
│   │   ├── index.ts
│   │   ├── notifications.ts
│   │   └── pair.ts
│   ├── package.json
│   └── tsconfig.json
├── public/
│   ├── manifest.json           # PWA マニフェスト
│   └── sw.js                   # Service Worker
├── firebase.json               # Firebase設定
├── firestore.rules             # Security Rules
├── firestore.indexes.json      # インデックス定義
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── next.config.js
```

---

## 優先度（実装順序）

### Phase 1: MVP（最小限の機能）

1. Firebase プロジェクトセットアップ
2. ユーザー登録・ログイン（Firebase Auth）
3. ペア作成・招待
4. 予定登録・表示（カレンダー）
5. クイックメッセージ送信（プリセットのみ）
6. プッシュ通知（FCM）

### Phase 2: 拡張機能

7. 定型文カスタマイズ
8. 買い物リスト
9. ステータス表示
10. 繰り返し予定

### Phase 3: 改善

11. UIの洗練
12. 通知設定の細かいカスタマイズ
13. オフライン対応強化
14. パフォーマンス最適化

---

## Firebase プロジェクト初期設定

### 1. Firebase Console での設定

1. 新規プロジェクト作成
2. Authentication 有効化（メール/パスワード）
3. Firestore Database 作成（本番モード）
4. Cloud Messaging 有効化
5. Hosting 有効化

### 2. ローカル環境セットアップ

```bash
# Firebase CLI インストール
npm install -g firebase-tools

# ログイン
firebase login

# プロジェクト初期化
firebase init

# 選択する機能:
# - Firestore
# - Functions
# - Hosting
# - Emulators
```

### 3. 必要なインデックス（firestore.indexes.json）

```json
{
  "indexes": [
    {
      "collectionGroup": "schedules",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "date", "order": "ASCENDING" },
        { "fieldPath": "userId", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "messages",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    }
  ]
}
```

---

## 補足事項

- 開発環境: Node.js 20+
- パッケージマネージャ: pnpm 推奨
- コード品質: ESLint + Prettier
- テスト: Vitest（ユニットテスト）、Playwright（E2Eテスト）
- Firebaseエミュレータを使ってローカル開発を推奨
