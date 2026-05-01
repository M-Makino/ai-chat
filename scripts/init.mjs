import { existsSync, writeFileSync } from 'fs';

const ENV_FILE = '.env.local';
const TEMPLATE = 'ANTHROPIC_API_KEY=\nMONGODB_URI=mongodb://localhost:27017/ai-chat\n';

if (existsSync(ENV_FILE)) {
  console.log('.env.local はすでに存在します。スキップしました。');
} else {
  writeFileSync(ENV_FILE, TEMPLATE);
  console.log('.env.local を作成しました。ANTHROPIC_API_KEY を設定してください。');
}
