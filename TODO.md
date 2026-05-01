# 実行計画 TODO

## フェーズ1: プロジェクトセットアップ

- [x] `create-next-app` でプロジェクト初期化（TypeScript・Tailwind・App Router を選択）
- [x] 依存パッケージのインストール
  - [x] `@anthropic-ai/sdk`
  - [x] `mongoose`
  - [x] `ai`（Vercel AI SDK — ストリーミング用）
- [x] `.env.local` を作成し `ANTHROPIC_API_KEY` と `MONGODB_URI` を設定
- [x] `.gitignore` に `.env.local` が含まれていることを確認

---

## フェーズ2: データベース層

- [x] `lib/mongodb.ts` — MongoDB接続シングルトンを実装
- [x] `models/Conversation.ts` — Mongooseスキーマを定義
  - フィールド: `title`, `createdAt`, `updatedAt`
- [x] `models/Message.ts` — Mongooseスキーマを定義
  - フィールド: `conversationId`, `role`（`user` | `assistant`）, `content`, `createdAt`

---

## フェーズ3: Claude APIクライアント

- [x] `lib/claude.ts` — Anthropicクライアントシングルトンを実装
- [x] ストリーミングレスポンスの動作確認（単体テスト or 簡易スクリプト）

---

## フェーズ4: APIルート実装

- [x] `app/api/conversations/route.ts`
  - [x] `GET` — 会話一覧を最終更新日時の降順で返す
  - [x] `POST` — 新しい会話を作成して返す
- [x] `app/api/conversations/[id]/route.ts`
  - [x] `GET` — 特定の会話を返す
  - [x] `DELETE` — 特定の会話とそのメッセージを削除する
- [x] `app/api/conversations/[id]/messages/route.ts`
  - [x] `GET` — 特定会話のメッセージ一覧を返す
- [x] `app/api/chat/route.ts`
  - [x] `POST` — ユーザーメッセージをDBに保存 → Claude APIをストリーミングで呼び出す → アシスタントの返答をDBに保存

---

## フェーズ5: UIコンポーネント実装

- [x] `components/Sidebar.tsx`
  - [x] 会話一覧の表示（最終更新日時順）
  - [x] 会話の選択（アクティブ状態のハイライト）
  - [x] 新規会話ボタン
  - [x] 会話の削除ボタン
- [x] `components/ChatWindow.tsx`
  - [x] メッセージ一覧の表示（`user` / `assistant` で左右に分ける）
  - [x] ストリーミング中のメッセージ表示（逐次表示）
  - [x] 最新メッセージへの自動スクロール
- [x] `components/MessageInput.tsx`
  - [x] テキストエリア入力
  - [x] 送信ボタン（Enter キーでも送信）
  - [x] 送信中はボタンを非活性化

---

## フェーズ6: ページ実装

- [x] `app/page.tsx` — `/chat` へリダイレクト
- [x] `app/chat/page.tsx` — 新規会話開始ページ
- [x] `app/chat/[id]/page.tsx` — 特定会話のチャットページ
- [x] `app/layout.tsx` — サイドバーを全ページに共通配置

---

## フェーズ7: 動作確認・調整

- [x] 新規会話の作成から送受信までの一連フローを確認
- [x] ストリーミングが正しく表示されることを確認
- [x] サイドバーの会話一覧がリアルタイムで更新されることを確認
- [x] 会話の削除が正しく動作することを確認
- [x] ページリロード後も会話履歴が復元されることを確認
- [x] レスポンシブデザインの確認（モバイル表示）

---

## 備考

- 各フェーズは上から順に進める（依存関係あり）
- フェーズ4のAPIルートはフェーズ2・3が完了してから着手する
- フェーズ5・6はフェーズ4と並行して進めることも可能

---

## 残タスク（コードレビューで発見）

> フェーズ7完了後に実施するコードレビューで洗い出した未実装・改善点。
> 優先度 🔴 高 / 🟡 中 / 🟢 低 で分類。

### バグ修正

- [x] 🔴 **IME確定Enter誤送信** — `components/MessageInput.tsx`
  - `isComposingRef` + `onCompositionStart/End` で制御済み

- [x] 🔴 **不正ObjectIdでの500エラー** — `app/api/conversations/[id]/route.ts`、`app/api/conversations/[id]/messages/route.ts`
  - `mongoose.isValidObjectId(id)` で400を返すよう修正済み

- [x] 🔴 **アンマウント後のストリーム読み込み（メモリリーク）** — `hooks/useChat.ts`
  - `AbortController` を導入し `fetch` の `signal` に渡すよう修正済み

- [x] 🔴 **ストリームのエラー未処理** — `app/api/chat/route.ts`
  - `stream.on('error', ...)` + `start()` 内の `try/catch` + `controller.error()` を実装済み

- [x] 🟡 **DELETE非トランザクション問題** — `app/api/conversations/[id]/route.ts`
  - メッセージを先に削除してから会話を削除する順序に変更済み

---

### UX改善

- [x] 🔴 **Markdownレンダリング** — `components/ChatWindow.tsx`
  - `react-markdown` + `remark-gfm` を導入、アシスタントメッセージをMarkdownレンダリング済み

- [x] 🔴 **エラーUI** — `hooks/useChat.ts`、`components/Sidebar.tsx`
  - `error` stateを追加し、ChatWindow・Sidebarにエラー表示を実装済み

- [x] 🟡 **ローディング状態** — `components/Sidebar.tsx`、`hooks/useChat.ts`
  - Sidebar・メッセージ読み込み時のスケルトンローダーを実装済み

- [x] 🟡 **ストリーム停止ボタン** — `components/MessageInput.tsx`
  - `isStreaming` 中は「停止」ボタンを表示、`AbortController.abort()` でキャンセル済み

- [x] 🟡 **削除確認ダイアログ** — `components/Sidebar.tsx`
  - `window.confirm` による確認ステップを追加済み

- [x] 🟢 **メッセージコピーボタン** — `components/ChatWindow.tsx`
  - アシスタントメッセージのホバー時にコピーボタンを表示済み

---

### 機能追加

- [x] 🔴 **システムプロンプト設定** — `lib/claude.ts`、`app/api/chat/route.ts`
  - `SYSTEM_PROMPT` 定数を `lib/claude.ts` に定義し Claude 呼び出し時に渡すよう実装済み

- [x] 🟡 **コンテキストウィンドウの上限管理** — `app/api/chat/route.ts`
  - 直近50件に制限するよう実装済み（`allHistory.slice(-50)`）

- [x] 🟡 **会話タイトルの編集UI** — `components/Sidebar.tsx`
  - ダブルクリックでインライン編集 + `PATCH /api/conversations/[id]` エンドポイントを実装済み

- [x] 🟡 **自動タイトル生成の改善** — `lib/claude.ts`、`app/api/chat/route.ts`
  - `generateTitle()` (claude-haiku-4-5-20251001) で短いタイトルを生成し、'done'送信前にDB更新済み

- [x] 🟢 **起動時環境変数バリデーション** — `next.config.ts`
  - `dev`/`start` 時に未設定の必須環境変数を `console.warn` で警告するよう実装済み

- [x] 🟢 **会話の検索・フィルタ** — `components/Sidebar.tsx`
  - サイドバー上部に検索ボックスを追加してタイトルでフィルタリング済み

- [x] 🟢 **メッセージのページネーション** — `app/api/conversations/[id]/messages/route.ts`、`hooks/useChat.ts`、`components/ChatWindow.tsx`
  - API: `?limit=50&before=<messageId>` でカーソルページネーション対応済み
  - UI: 初回ロードは直近50件、「過去のメッセージを読み込む」ボタンで遡り読み可能
