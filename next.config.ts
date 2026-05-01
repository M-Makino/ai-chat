import type { NextConfig } from "next";

// ビルド時はスキップ、dev/start 時に未設定を警告
const isProductionBuild = process.env.NEXT_PHASE === 'phase-production-build';
if (!isProductionBuild) {
  const missing = ['ANTHROPIC_API_KEY', 'MONGODB_URI'].filter((k) => !process.env[k]);
  if (missing.length > 0) {
    console.warn(
      `\n⚠️  必須環境変数が未設定: ${missing.join(', ')}\n   .env.local を確認してください。\n`,
    );
  }
}

const nextConfig: NextConfig = {};
export default nextConfig;
