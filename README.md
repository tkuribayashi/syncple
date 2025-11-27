# Syncple - 夫婦連絡アプリ

夫婦間の日常コミュニケーションに特化したWebアプリケーション。予定共有とクイックメッセージ機能により、シンプルかつ効率的な連絡を実現します。

## 主な機能（MVP）

- ✅ ユーザー登録・ログイン（Firebase Authentication）
- ✅ ペア作成・招待機能
- ✅ スケジュール共有（カレンダー表示・予定登録）
- ✅ クイックメッセージ送信
- ✅ リアルタイムメッセージング
- ✅ プッシュ通知（Firebase Cloud Messaging）

## 技術スタック

### フロントエンド
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- React Hooks & Context API
- Firebase SDK
- date-fns

### バックエンド
- Firebase Authentication
- Cloud Firestore
- Cloud Functions for Firebase
- Firebase Cloud Messaging
- Firebase Hosting

## セットアップ

### 前提条件

- Node.js 18以上
- Firebase プロジェクト

### 1. リポジトリのクローン

```bash
git clone <repository-url>
cd syncple
```

### 2. 依存関係のインストール

```bash
npm install
cd functions && npm install && cd ..
```

### 3. Firebase プロジェクトの設定

1. [Firebase Console](https://console.firebase.google.com/) で新しいプロジェクトを作成
2. Authentication を有効化（メール/パスワード認証）
3. Firestore Database を作成
4. Cloud Messaging を有効化
5. Firebase 設定情報を取得

### 4. 環境変数の設定

`.env.local.example` をコピーして `.env.local` を作成し、Firebase の設定情報を入力：

```bash
cp .env.local.example .env.local
```

`.env.local` を編集：

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-auth-domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-storage-bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your-measurement-id
```

### 5. Firebase の初期化

```bash
# Firebase CLI のインストール（未インストールの場合）
npm install -g firebase-tools

# Firebase にログイン
firebase login

# Firebase プロジェクトを選択
firebase use --add
```

### 6. Firestore のルールとインデックスをデプロイ

```bash
firebase deploy --only firestore:rules,firestore:indexes
```

### 7. 開発サーバーの起動

```bash
npm run dev
```

http://localhost:3000 でアプリケーションが起動します。

## Cloud Functions のデプロイ

```bash
# Functions をビルド
cd functions
npm run build

# Functions をデプロイ
firebase deploy --only functions
```

## Firebase Emulator での開発（推奨）

```bash
# Emulator を起動
firebase emulators:start

# 別のターミナルで Next.js 開発サーバーを起動
npm run dev
```

## ビルドとデプロイ

### 本番ビルド

```bash
npm run build
```

### Firebase Hosting へのデプロイ

```bash
# Next.js の静的エクスポート設定が必要
npm run build
firebase deploy --only hosting
```

## ディレクトリ構成

```
/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/             # 認証関連ページ
│   │   └── (main)/             # メイン機能ページ
│   ├── components/             # Reactコンポーネント
│   ├── hooks/                  # カスタムフック
│   ├── lib/                    # ユーティリティ・Firebase初期化
│   ├── types/                  # 型定義
│   └── contexts/               # React Context
├── functions/                  # Cloud Functions
├── public/                     # 静的ファイル
├── firebase.json               # Firebase設定
├── firestore.rules             # Security Rules
└── firestore.indexes.json      # インデックス定義
```

## 使い方

### 1. アカウント作成

1. 新規登録画面でメールアドレスとパスワードを入力
2. 表示名を設定

### 2. ペアの設定

#### ペアを作成する場合:
1. 「ペアを作成」を選択
2. 招待コードが生成される
3. 招待コードをパートナーに共有

#### ペアに参加する場合:
1. 「ペアに参加」を選択
2. パートナーから受け取った招待コードを入力

### 3. 予定の登録

1. カレンダー画面で「+ 予定を追加」をクリック
2. 日付、タイトル、カテゴリを入力
3. 必要に応じて時間やメモを追加

### 4. メッセージの送信

1. メッセージ画面を開く
2. クイックメッセージボタンをタップ、または自由にテキストを入力
3. 送信ボタンをクリック

## セキュリティ

- すべての通信はHTTPSで暗号化
- Firebase Authenticationによる認証管理
- Firestore Security Rulesによるデータアクセス制御
- ペア以外のユーザーからのデータアクセスを遮断

## ライセンス

MIT

## サポート

問題が発生した場合は、Issueを作成してください。
