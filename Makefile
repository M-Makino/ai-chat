.PHONY: help install dev build start lint deploy deploy-prod

help:
	@echo "Usage: make <target>"
	@echo ""
	@echo "  install      依存パッケージのインストール"
	@echo "  dev          開発サーバー起動 (http://localhost:3000)"
	@echo "  build        本番ビルド"
	@echo "  start        本番サーバー起動 (buildが必要)"
	@echo "  lint         ESLint実行"
	@echo "  deploy       Vercelにプレビューデプロイ"
	@echo "  deploy-prod  Vercelに本番デプロイ"

install:
	npm install

dev:
	npm run dev

build:
	npm run build

start:
	npm run start

lint:
	npm run lint

deploy:
	npx vercel

deploy-prod:
	npx vercel --prod
