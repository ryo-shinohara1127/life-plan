create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  goal_id uuid references goals(id) on delete set null,
  category_id uuid references categories(id) on delete set null,
  title text not null,
  description text,
  date date not null,
  planned_start_time time,
  planned_end_time time,
  status text not null default 'not_started' check (status in ('not_started', 'in_progress', 'done', 'skipped')),
  is_routine boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_tasks_date on tasks(date);
