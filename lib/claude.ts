import Anthropic from '@anthropic-ai/sdk';

export const SYSTEM_PROMPT =
  'あなたは親切で誠実なAIアシスタントです。ユーザーの質問に対して正確で役立つ回答を提供してください。コードを含む回答ではMarkdown形式を使用してください。';

let _client: Anthropic | null = null;

export function getAnthropicClient(): Anthropic {
  if (_client) return _client;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('環境変数 ANTHROPIC_API_KEY が設定されていません');
  _client = new Anthropic({ apiKey });
  return _client;
}

// 新規会話の最初のメッセージからタイトルを生成する（Haiku使用で高速）
export async function generateTitle(firstUserMessage: string): Promise<string> {
  try {
    const response = await getAnthropicClient().messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 30,
      messages: [
        {
          role: 'user',
          content: `次のメッセージの内容を表す短いタイトルを、15文字以内の日本語で生成してください。タイトルのみを返してください。\n\n${firstUserMessage.slice(0, 200)}`,
        },
      ],
    });
    const text = response.content[0].type === 'text' ? response.content[0].text.trim() : '';
    return text.slice(0, 30) || firstUserMessage.trim().slice(0, 30);
  } catch {
    // タイトル生成失敗は非致命的 — フォールバックとして先頭30文字を使う
    return firstUserMessage.trim().slice(0, 30);
  }
}
