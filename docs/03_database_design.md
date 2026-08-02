# データベース設計書

PostgreSQLを想定。命名は英語スネークケース、日本語は値（データ）として保存する。

## 1. ER図（概念）

```
life_philosophy (理念)  ※常に1件のみ更新していく想定

categories (テーマ: AI/筋トレ/読書/写真/コーヒー/歌)
      │
      │ 1:N
      ▼
goals (理念以下の階層目標: vision/year/quarter/month/week)
   │ self-reference (parent_goal_id)
   │ 1:N
   ▼
tasks (今日のタスク) ──── N:1 ──── categories
   │
   │ 1:1 (nullable)
   ▼
google_calendar_links (カレンダーイベントとの紐付け)

reflections (毎日の振り返り) ── 1:1 ── ai_suggestions (振り返り分析結果)
                                              │ 1:N
                                              ▼
                                    ai_calendar_proposals (カレンダー変更案)
```

## 2. テーブル定義

### 2.1 `life_philosophy`（人生理念）

理念は頻繁には変わらないが、変更履歴を残したいため「常に新規INSERTし、最新1件を採用」する方式にする。

| カラム | 型 | 説明 |
|---|---|---|
| id | uuid (PK) | |
| content | text | 理念の本文 |
| created_at | timestamptz | 作成日時 |

> 設計意図：UPDATEで上書きすると過去の理念が消える。人生理念は「変わっていく過程」自体に価値があるため、
> 履歴として残せるInsert-onlyにしている。

### 2.2 `visions`（3〜5年後の人物像）

| カラム | 型 | 説明 |
|---|---|---|
| id | uuid (PK) | |
| content | text | どんな人になっていたいかの記述 |
| target_year | int | 目標年（例: 2030） |
| status | text | active / archived |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### 2.3 `categories`（優先テーマ）

| カラム | 型 | 説明 |
|---|---|---|
| id | uuid (PK) | |
| name | text | AI / 筋トレ / 読書 / 写真 / コーヒー / 歌 など |
| type | text | `pillar`（柱）/ `daily_touch`（毎日少し触れる） |
| priority_order | int | 表示順（1〜6） |
| created_at | timestamptz | |

> 設計意図：要件定義にある「柱」と「毎日少しでも触れる」の区別を `type` で持たせる。
> これにより、後で「柱のテーマだけロードマップに階層目標を作る」「daily_touchは今日のタスクの
> 継続チェックのみ」といった画面側の出し分けができる。

### 2.4 `goals`（階層目標：年／四半期／月／週）

| カラム | 型 | 説明 |
|---|---|---|
| id | uuid (PK) | |
| vision_id | uuid (FK → visions.id, nullable) | どの人物像に紐づくか |
| parent_goal_id | uuid (FK → goals.id, nullable) | 自己参照で階層を表現 |
| category_id | uuid (FK → categories.id, nullable) | どのテーマの目標か（AI/筋トレ等） |
| level | text | `year` / `quarter` / `month` / `week` |
| title | text | 目標タイトル |
| description | text | 詳細 |
| start_date | date | |
| end_date | date | |
| status | text | `not_started` / `in_progress` / `done` / `abandoned` |
| created_at | timestamptz | |
| updated_at | timestamptz | |

> 設計意図：年・四半期・月・週を別テーブルに分けず`goals`1本にまとめ、`level`と
> `parent_goal_id`で階層を表す。テーブルが1つなので「階層を1段増やす／減らす」といった
> 将来の仕様変更（例：四半期を廃止して半期にする）にコード変更なしで対応できる。

### 2.5 `tasks`（今日のタスク）

| カラム | 型 | 説明 |
|---|---|---|
| id | uuid (PK) | |
| goal_id | uuid (FK → goals.id, nullable) | どの週目標等に紐づくか（紐づかない単発タスクも許容） |
| category_id | uuid (FK → categories.id, nullable) | |
| title | text | |
| description | text | |
| date | date | 実施日 |
| planned_start_time | time (nullable) | ルーティンの開始時刻 |
| planned_end_time | time (nullable) | |
| status | text | `not_started` / `in_progress` / `done` / `skipped` |
| is_routine | boolean | 固定ルーティン由来か、前日に追加した予定か |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### 2.6a `google_calendar_tokens`（Google OAuthトークン）

本人専用アプリのため1行のみを想定（複数ユーザー対応はスコープ外）。

| カラム | 型 | 説明 |
|---|---|---|
| id | uuid (PK) | |
| access_token | text | Google APIを呼ぶための短期トークン |
| refresh_token | text | access_tokenが切れたときに再取得するためのトークン |
| expiry | timestamptz | access_tokenの有効期限 |
| calendar_id | text | 同期対象のカレンダーID（既定は`primary`） |
| created_at | timestamptz | |
| updated_at | timestamptz | |

> 設計意図：トークンは`.env`のような静的な設定ファイルではなくDBに保存する。理由は、
> OAuthのaccess_tokenは短時間（通常1時間程度）で失効し、refresh_tokenを使って
> バックエンドが自動的に更新し続ける必要があるため、実行時に書き換え可能なDBが適している。

### 2.6 `google_calendar_links`（タスクとカレンダーイベントの紐付け）

| カラム | 型 | 説明 |
|---|---|---|
| id | uuid (PK) | |
| task_id | uuid (FK → tasks.id) | |
| google_event_id | text | Google Calendar側のイベントID |
| calendar_id | text | 対象カレンダーID |
| sync_status | text | `synced` / `pending` / `error` |
| last_synced_at | timestamptz | |

> 設計意図：`tasks`に直接カレンダー用カラムを持たせず別テーブルにすることで、
> 「カレンダー連携なしでタスクだけ使う」という将来のケースにも対応しやすくする。

### 2.7 `reflections`（毎日の振り返り）

| カラム | 型 | 説明 |
|---|---|---|
| id | uuid (PK) | |
| date | date (unique) | 振り返り対象日（1日1件） |
| achieved | text | できたこと |
| not_achieved | text | できなかったこと |
| reason | text | できなかった理由 |
| learning | text | 今日の学び |
| improvement_idea | text | 自分で考えた改善案 |
| mood | int | 気分（1〜5） |
| focus_level | int | 集中度（1〜5） |
| sleep_hours | numeric | 睡眠時間 |
| created_at | timestamptz | |

### 2.8 `ai_suggestions`（AIによる振り返り分析結果）

1回の振り返りに対して、AIが生成する分析結果をまとめて1件保存する
（要約・課題・原因の仮説・改善案・継続すべきこと）。カレンダーの変更案だけは、
1件ずつ個別に承認/却下したいため、別テーブル`ai_calendar_proposals`に分離する（2.9参照）。

| カラム | 型 | 説明 |
|---|---|---|
| id | uuid (PK) | |
| reflection_id | uuid (FK → reflections.id, unique) | どの振り返りから生成されたか（1振り返り1件） |
| summary | text | 今日の要約 |
| issues | text | 検出された課題 |
| hypothesis | text | 原因の仮説 |
| improvements | jsonb | 明日の改善案（最大3件の配列） |
| continue_items | text | 継続すべきこと |
| ai_provider | text | 生成に使ったAI（例: `claude`） |
| created_at | timestamptz | |

> 設計意図：要約・課題・改善案などはユーザーが「承認/却下」する対象ではなく、あくまで
> 読んで参考にする情報のため、ステータス管理は不要と判断し、テキスト＋jsonbのシンプルな
> 構成にしている。`improvements`をjsonbにしているのは、3件までという可変長のリストを
> 1カラムで表現するため。

### 2.9 `ai_calendar_proposals`（AIによるカレンダー変更案）

| カラム | 型 | 説明 |
|---|---|---|
| id | uuid (PK) | |
| ai_suggestion_id | uuid (FK → ai_suggestions.id) | どの振り返り分析から生まれた提案か |
| description | text | 提案内容の説明（人が読む用） |
| proposed_change | jsonb | 変更内容の構造化データ（対象イベント・日時・種別など） |
| reason | text | AIがこの変更を提案する理由 |
| status | text | `proposed` / `approved` / `rejected` |
| reviewed_at | timestamptz (nullable) | ユーザーが承認/却下した日時 |
| applied_at | timestamptz (nullable) | 実際にGoogleカレンダーへ反映した日時 |
| created_at | timestamptz | |

> 設計意図：カレンダー変更は「ユーザーが承認した分だけ実際に反映される」という
> 要件があるため、提案（proposed）→承認/却下（reviewed_at）→実際の反映（applied_at）を
> 別々のタイミングの出来事として記録できるようにしている。`status`が`rejected`のまま
> 残る、という要件（却下した結果も記録する）もこの設計で満たせる。AIはこのテーブルに
> レコードを作るところまでしか行わず、`google_calendar_links`や実際のカレンダーへの
> 書き込みは、ユーザーが承認した後にバックエンドが行う。

## 3. インデックス方針（初期案）

- `tasks(date)`：今日のタスク一覧表示で頻繁に使うため
- `reflections(date)`：日付検索・履歴表示のため
- `goals(parent_goal_id)`：階層をたどるツリー表示のため
- `ai_calendar_proposals(ai_suggestion_id)`：振り返り単位で提案一覧を出すため

## 4. 今後の拡張候補（MVP外）

- `habits` テーブル：写真／コーヒー／歌のような継続系ログを`tasks`と分離し、
  連続日数（ストリーク）管理をしやすくする
- `analytics_snapshots` テーブル：週次・月次の集計結果をキャッシュし、分析画面を高速化する
