create table if not exists ai_suggestions (
  id uuid primary key default gen_random_uuid(),
  reflection_id uuid not null unique references reflections(id) on delete cascade,
  summary text not null,
  issues text,
  hypothesis text,
  improvements jsonb not null default '[]',
  continue_items text,
  ai_provider text not null default 'claude',
  created_at timestamptz not null default now()
);
