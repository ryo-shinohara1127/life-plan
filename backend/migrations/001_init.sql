create extension if not exists "pgcrypto";

create table if not exists life_philosophy (
  id uuid primary key default gen_random_uuid(),
  content text not null,
  created_at timestamptz not null default now()
);

create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null check (type in ('pillar', 'daily_touch')),
  priority_order int not null,
  created_at timestamptz not null default now()
);

create table if not exists visions (
  id uuid primary key default gen_random_uuid(),
  content text not null,
  target_year int,
  status text not null default 'active' check (status in ('active', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists goals (
  id uuid primary key default gen_random_uuid(),
  vision_id uuid references visions(id) on delete set null,
  parent_goal_id uuid references goals(id) on delete cascade,
  category_id uuid references categories(id) on delete set null,
  level text not null check (level in ('year', 'quarter', 'month', 'week')),
  title text not null,
  description text,
  start_date date,
  end_date date,
  status text not null default 'not_started' check (status in ('not_started', 'in_progress', 'done', 'abandoned')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_goals_parent_goal_id on goals(parent_goal_id);

insert into categories (name, type, priority_order)
select * from (values
  ('AI', 'pillar', 1),
  ('筋トレ', 'pillar', 2),
  ('読書', 'pillar', 3),
  ('写真', 'daily_touch', 4),
  ('コーヒー', 'daily_touch', 5),
  ('歌', 'daily_touch', 6)
) as seed(name, type, priority_order)
where not exists (select 1 from categories);
