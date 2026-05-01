# CLAUDE.md

## プロジェクト概要

個人向けAIチャットボット（一般的な会話・Q&A用途）。Claude APIを使ったチャット画面を持つ、シングルユーザー向けアプリケーション。

## 技術スタック

- **フレームワーク**: Next.js（App Router）+ TypeScript
- **スタイリング**: Tailwind CSS
- **AI**: Anthropic Claude API（`@anthropic-ai/sdk`）
- **データベース**: MongoDB（Mongoose経由）— 会話履歴を保存
- **ランタイム**: Node.js

## アーキテクチャ

```
app/
  api/
    chat/route.ts          # POST /api/chat — Claudeのレスポンスをストリーミング
    conversations/
      route.ts             # GET（一覧取得）、POST（新規作成）
      [id]/route.ts        # GET、DELETE（特定の会話）
      [id]/messages/route.ts  # GET（特定会話のメッセージ一覧）
  layout.tsx
  page.tsx                 # ルート: /chat にリダイレクト
  chat/
    page.tsx               # メインチャット画面
    [id]/page.tsx          # 特定会話のチャット画面

components/
  Sidebar.tsx              # 会話履歴一覧（サイドバー）
  ChatWindow.tsx           # メッセージスレッド
  MessageInput.tsx         # テキスト入力 + 送信ボタン

lib/
  mongodb.ts               # MongoDB接続シングルトン
  claude.ts                # Anthropicクライアントシングルトン

models/
  Conversation.ts          # Mongooseスキーマ: { title, createdAt, updatedAt }
  Message.ts               # Mongooseスキーマ: { conversationId, role, content, createdAt }
```

## 主な動作仕様

- サイドバーには全会話が最終更新日時の降順で表示される。
- 会話を選択すると、その会話のメッセージ履歴が全件読み込まれる。
- アクティブな会話がない状態で最初のメッセージを送信すると、新しい会話が自動作成される。
- Claude APIの呼び出し時には、アクティブな会話のメッセージ履歴を全件コンテキストとして渡す。
- レスポンスはVercel AI SDKまたはネイティブのReadableStreamを使ってUIにストリーミングする。
- 認証なし — 個人利用・ローカル環境専用。

## 環境変数

```
ANTHROPIC_API_KEY=       # Claude APIキー
MONGODB_URI=             # MongoDB接続文字列（例: mongodb://localhost:27017/ai-chat）
```

`.env.local` に記載すること（このファイルは絶対にコミットしない）。

## コマンド

```bash
npm install       # 依存パッケージのインストール
npm run dev       # 開発サーバー起動（http://localhost:3000）
npm run build     # 本番ビルド
npm run lint      # ESLint実行
```

## コーディング規約

- Pages RouterではなくApp Router（`app/` ディレクトリ）を使用する。
- APIルートは `pages/api/` ではなくRoute Handler（`route.ts`）で実装する。
- Claude APIの呼び出しは必ず `lib/claude.ts` 経由で行う（ルートハンドラー内で `Anthropic` を直接インスタンス化しない）。
- MongoDBへのアクセスは必ず `lib/mongodb.ts` 経由で行う（開発環境での接続リーク防止のため接続シングルトンを使う）。
- TypeScriptのstrictモードを有効にする — `any` は使わない。
- 特殊機能は不要: ファイルアップロード・RAG・認証は実装しない。
