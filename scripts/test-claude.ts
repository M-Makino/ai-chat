/**
 * Claude APIのストリーミング動作確認スクリプト
 * 実行: npx tsx scripts/test-claude.ts
 */
import { getAnthropicClient } from '../lib/claude';

async function main() {
  console.log('ストリーミングテスト開始...\n');

  const stream = getAnthropicClient().messages.stream({
    model: 'claude-sonnet-4-6',
    max_tokens: 256,
    messages: [{ role: 'user', content: 'こんにちは！一言で自己紹介してください。' }],
  });

  stream.on('text', (text) => process.stdout.write(text));

  const finalMessage = await stream.finalMessage();

  console.log('\n\n--- 使用トークン ---');
  console.log(`入力: ${finalMessage.usage.input_tokens}`);
  console.log(`出力: ${finalMessage.usage.output_tokens}`);
  console.log('\n✓ ストリーミング動作確認完了');
}

main().catch((err) => {
  console.error('エラー:', err);
  process.exit(1);
});
