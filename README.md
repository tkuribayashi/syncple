# Syncple - 夫婦連絡アプリ

夫婦間の日常コミュニケーションに特化したWebアプリケーション。予定共有とクイックメッセージ機能により、シンプルかつ効率的な連絡を実現します。

## 主な機能

### 認証・ペアリング
- ✅ ユーザー登録・ログイン（Firebase Authentication）
- ✅ ペア作成・招待機能（招待コード方式）

### カレンダー・予定管理
- ✅ スケジュール共有（個人予定・共有予定）
- ✅ 複数日にまたがる予定
- ✅ カテゴリー管理・カスタマイズ（色・アイコン設定）
- ✅ 複数カレンダー表示形式（4週間・日別・祝日表示）

### メッセージング
- ✅ リアルタイムメッセージング
- ✅ クイックメッセージ送信・カスタマイズ
- ✅ テンプレート変数展開（例: `{分}分後に帰ります`）
- ✅ 既読管理

### その他
- ✅ 晩ご飯ステータス共有
- ✅ プッシュ通知（Firebase Cloud Messaging）
- ✅ PWA対応（オフライン動作・ホーム画面追加）

## 技術スタック

### フロントエンド
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- React Hooks & Context API
- Firebase SDK (v10.9.0+)
- date-fns (日付処理)
- react-datepicker (日付選択UI)
- react-hook-form + zod (フォーム管理・バリデーション)
- PWA (Service Worker, Web App Manifest)

### バックエンド
- Firebase Authentication (メール/パスワード認証)
- Cloud Firestore (NoSQLデータベース)
- Cloud Functions for Firebase (サーバーサイド処理)
- Firebase Cloud Messaging (プッシュ通知)
- Firebase Hosting (静的ホスティング)

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

#### 環境の種類
- **local**: ローカル開発環境（`.env.local`）
- **staging**: ステージング環境（`.env.staging`）
- **production**: 本番環境

**重要**: staging環境とproduction環境は同じFirebaseプロジェクトを共有しています。staging環境での操作には十分注意してください。

#### 設定手順

`.env.example` をコピーして `.env.local` を作成し、Firebase の設定情報を入力：

```bash
cp .env.example .env.local
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
NEXT_PUBLIC_FIREBASE_VAPID_KEY=your-vapid-key
NEXT_PUBLIC_ENV=local
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
│   │   ├── (auth)/             # 認証関連ページ（ログイン・登録・招待）
│   │   └── (main)/             # メイン機能ページ（カレンダー・メッセージ・設定）
│   ├── components/             # 共通UIコンポーネント
│   │   └── ui/                 # UI基盤コンポーネント（Toast、Dialog等）
│   ├── hooks/                  # カスタムフック（Firestoreアクセス層）
│   ├── lib/                    # 純粋関数・Firebase初期化
│   ├── utils/                  # ビジネスロジック関連ヘルパー
│   ├── constants/              # 定数定義（制限値、デフォルト値等）
│   ├── types/                  # TypeScript型定義
│   └── contexts/               # React Context（認証等）
├── functions/                  # Cloud Functions
├── public/                     # 静的ファイル（PWA manifest、アイコン等）
├── scripts/                    # ビルドスクリプト（Service Worker生成等）
├── firebase.json               # Firebase設定
├── firestore.rules             # Firestore Security Rules
└── firestore.indexes.json      # Firestoreインデックス定義
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
3. 必要に応じて以下を設定:
   - 時間指定（終日予定 or 時間指定予定）
   - 共有設定（個人予定 or 共有予定）
   - 複数日予定（開始日と終了日を指定）
   - メモ

### 4. メッセージの送信

1. メッセージ画面を開く
2. クイックメッセージボタンをタップ、または自由にテキストを入力
3. 送信ボタンをクリック

**クイックメッセージのカスタマイズ:**
- 設定画面でクイックメッセージの追加・編集・並び替えが可能
- `{分}` などの変数を使用して動的なメッセージを作成可能

### 5. 晩ご飯ステータスの設定

1. ホーム画面で晩ご飯ステータスカードを選択
2. 4つのステータスから選択:
   - 一人で食べる
   - 作って待ってる
   - 一緒に作る
   - まだ決めてない

## セキュリティ

- すべての通信はHTTPSで暗号化
- Firebase Authenticationによる認証管理
- Firestore Security Rulesによるデータアクセス制御
- すべてのデータは `pairId` でスコープされ、ペア以外のユーザーからのアクセスを完全に遮断
- 認証の永続化により、PWAでの安全なログイン状態を維持

## PWA対応

Syncpleは Progressive Web App として動作し、以下の機能を提供します:

- **オフライン対応**: Service Workerによるキャッシング
- **ホーム画面追加**: モバイルデバイスのホーム画面にアプリアイコンを追加可能
- **プッシュ通知**: Firebase Cloud Messagingによるリアルタイム通知
- **アプリライクな体験**: ネイティブアプリのようなUX

### PWAとしてインストール

#### iOS (Safari):
1. Safariでアプリを開く
2. 共有ボタンをタップ
3. 「ホーム画面に追加」を選択

#### Android (Chrome):
1. Chromeでアプリを開く
2. メニューから「ホーム画面に追加」を選択

#### デスクトップ (Chrome):
1. アドレスバーの右側にあるインストールアイコンをクリック
2. 「インストール」を選択

## ライセンス

MIT

## サポート

問題が発生した場合は、Issueを作成してください。
