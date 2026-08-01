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

reflections (毎日の振り返り) ── 1:N ── ai_suggestions (AI改善提案)
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

### 2.8 `ai_suggestions`（AIによる改善提案）

| カラム | 型 | 説明 |
|---|---|---|
| id | uuid (PK) | |
| reflection_id | uuid (FK → reflections.id) | どの振り返りから生成されたか |
| suggestion_content | text | AIが生成した提案本文 |
| suggested_goal_changes | jsonb (nullable) | 目標やタスクへの具体的な変更提案（構造化） |
| status | text | `proposed` / `accepted` / `rejected` |
| created_at | timestamptz | |
| reviewed_at | timestamptz (nullable) | |

> 設計意図：`suggested_goal_changes`をjsonbにしておくことで、「翌日のタスクをこう変える」
> 「週目標をこう調整する」といった多様な提案パターンをテーブル構造を変えずに表現できる。
> MVPでは人が見て手動反映する運用とし、精度が上がってきたら自動反映（ロードマップの自動更新）
> に拡張する。

## 3. インデックス方針（初期案）

- `tasks(date)`：今日のタスク一覧表示で頻繁に使うため
- `reflections(date)`：日付検索・履歴表示のため
- `goals(parent_goal_id)`：階層をたどるツリー表示のため

## 4. 今後の拡張候補（MVP外）

- `habits` テーブル：写真／コーヒー／歌のような継続系ログを`tasks`と分離し、
  連続日数（ストリーク）管理をしやすくする
- `analytics_snapshots` テーブル：週次・月次の集計結果をキャッシュし、分析画面を高速化する
