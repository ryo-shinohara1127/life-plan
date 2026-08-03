# 人生設計図

「何をするか」ではなく「どんな人になりたいか」を軸に、人生の設計図を作り、
その設計図に沿って毎日成長するための個人専用アプリ。

人生の目標 → ロードマップ → 今日やること → 振り返り → AI改善提案、というサイクルを1つのアプリで回す。

## 人生理念

> 知識・健康・感性を磨き、AIを活用しながら社会へ価値を提供できる人になる。
> お金や自由は目的ではなく、価値提供の結果として得られるもの。

## 優先テーマ

AI ＞ 筋トレ ＞ 読書（柱） ／ 写真・コーヒー・歌（毎日少しでも触れる）

## 機能

- 人生理念の管理（変更履歴つき）
- ロードマップ（3〜5年後の人物像〜週目標の階層管理）
- 今日のタスク（固定ルーティンの自動生成、Googleカレンダー予定の表示）
- Googleカレンダー連携（OAuth、当日予定の読み取り）
- 毎日の振り返り
- AIによる改善提案（要約・課題・改善案・カレンダー変更案を生成し、
  ユーザーが承認した変更のみカレンダーへ反映）

## 構成

- `frontend/`：React + TypeScript（Vite）
- `backend/`：Node.js + Express + TypeScript
- DB：PostgreSQL（Supabase）
- AI：`AIProvider`インターフェースにより差し替え可能（既定はGemini無料枠、Claudeにも対応）

## ドキュメント

- [要件定義](docs/01_requirements.md)
- [システム構成](docs/02_architecture.md)
- [DB設計](docs/03_database_design.md)
- [画面設計](docs/04_screen_design.md)
- [開発ロードマップ](docs/05_roadmap.md)

## セットアップ（ローカル開発）

```bash
# backend
cd backend
npm install
cp .env.example .env   # DATABASE_URL / GOOGLE_CLIENT_ID等 / GEMINI_API_KEY を設定
npm run migrate
npm run dev

# frontend（別ターミナル）
cd frontend
npm install
npm run dev
```

## 本番環境

- フロントエンド：https://life-plan-ecru.vercel.app
- バックエンド：https://life-plan-backend.onrender.com （Render Free、非アクセス時はスリープします）

## ステータス

MVP（Phase 0〜7）完成。運用開始。
