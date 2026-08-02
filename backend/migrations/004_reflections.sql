create table if not exists reflections (
  id uuid primary key default gen_random_uuid(),
  date date not null unique,
  achieved text,
  not_achieved text,
  reason text,
  learning text,
  improvement_idea text,
  mood int check (mood between 1 and 5),
  focus_level int check (focus_level between 1 and 5),
  sleep_hours numeric,
  created_at timestamptz not null default now()
);

create index if not exists idx_reflections_date on reflections(date);
