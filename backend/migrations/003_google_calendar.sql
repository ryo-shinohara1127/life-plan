-- 本人専用アプリのため1行のみを想定（複数ユーザー対応はスコープ外）
create table if not exists google_calendar_tokens (
  id uuid primary key default gen_random_uuid(),
  access_token text not null,
  refresh_token text not null,
  expiry timestamptz not null,
  calendar_id text not null default 'primary',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists google_calendar_links (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references tasks(id) on delete cascade,
  google_event_id text not null,
  calendar_id text not null default 'primary',
  sync_status text not null default 'synced' check (sync_status in ('synced', 'pending', 'error')),
  last_synced_at timestamptz not null default now()
);

create index if not exists idx_google_calendar_links_task_id on google_calendar_links(task_id);
