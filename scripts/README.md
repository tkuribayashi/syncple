# ビルドスクリプト

## generate-sw.js

Firebase Messaging Service Worker を環境変数から自動生成します。

### 動作タイミング
- `npm run dev` 実行前 (predev)
- `npm run build` 実行前 (prebuild)

### 必要な環境変数
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`

### ローカル開発
1. `.env.example` を `.env.local` にコピー
2. 実際の値を設定
3. `npm run dev` を実行

### Vercel デプロイ
環境変数が Vercel に設定されていれば、自動的に生成されます。
