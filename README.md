# English Learning App

ロンズデールの原理原則に基づいたOxford 3000単語学習アプリ

## 機能

### 1. Image Connect Mode (イメージ直接結合)
- 単語と画像を直接結びつける学習
- 日本語訳を使わない
- Web Speech APIで発音を再生

### 2. Brain Soaking Mode (大量リスニング)
- 単語を連続で自動再生
- 速度調整（0.5x〜1.5x）
- リズムとパターンを聞き取る

### 3. Word Mixing Game (混ぜ合わせ)
- 動詞 + 名詞 + 形容詞を組み合わせ
- 文を作る練習
- スコア機能付き

### 4. 進捗管理
- 間隔反復法（Spaced Repetition）
- 1000語/3000語の達成率
- レベル分布表示

## 技術スタック

- **Frontend**: React + TypeScript + Vite
- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL + Prisma
- **画像**: Unsplash API
- **音声**: Web Speech API

## セットアップ

### 必要条件
- Node.js 18+
- PostgreSQL 14+
- npm or yarn

### 1. データベースのセットアップ

```bash
# PostgreSQLでデータベースを作成
createdb english_learn_app

# または psql で
psql -c "CREATE DATABASE english_learn_app;"
```

### 2. バックエンドのセットアップ

```bash
cd backend

# 依存関係のインストール
npm install

# 環境変数の設定
cp .env.example .env
# .env を編集して DATABASE_URL を設定

# Prismaのセットアップ
npx prisma db push

# Oxford 3000単語をインポート
npm run db:seed

# 開発サーバーの起動
npm run dev
```

### 3. フロントエンドのセットアップ

```bash
cd frontend

# 依存関係のインストール
npm install

# 環境変数の設定（オプション: Unsplash APIキー）
# .env ファイルを編集

# 開発サーバーの起動
npm run dev
```

### 4. アプリへのアクセス

- Frontend: http://localhost:5173
- Backend API: http://localhost:3001

## 環境変数

### Backend (.env)
```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/english_learn_app"
PORT=3001
```

### Frontend (.env)
```
VITE_API_URL=http://localhost:3001/api
VITE_UNSPLASH_ACCESS_KEY=your_unsplash_access_key
```

## Unsplash API (オプション)

画像を表示するには、Unsplash APIキーが必要です：

1. https://unsplash.com/developers でアカウント作成
2. 新しいアプリケーションを作成
3. Access Keyを取得
4. `frontend/.env` に `VITE_UNSPLASH_ACCESS_KEY` を設定

APIキーがない場合はプレースホルダー画像が表示されます。

## ロンズデールの原則

このアプリは、クリス・ロンズデールの「6ヶ月で言語を習得する方法」に基づいています：

### 5つの原則
1. 関連性のある内容に集中
2. 初日からツールとして使う
3. 理解可能なインプット
4. 生理的トレーニング
5. 適切な心理状態

### 7つの行動
1. 大量に聞く (Brain Soaking)
2. 言葉より先に意味を理解
3. 混ぜ合わせる (Start Mixing)
4. 核心に集中（高頻度語彙）
5. 言語の親を見つける
6. 顔を真似る
7. 直接的な結びつけ (Direct Connect)

## License

MIT
