create table if not exists ai_calendar_proposals (
  id uuid primary key default gen_random_uuid(),
  ai_suggestion_id uuid not null references ai_suggestions(id) on delete cascade,
  task_id uuid references tasks(id) on delete set null,
  description text not null,
  proposed_change jsonb not null,
  reason text,
  status text not null default 'proposed' check (status in ('proposed', 'approved', 'rejected')),
  reviewed_at timestamptz,
  applied_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_ai_calendar_proposals_suggestion_id on ai_calendar_proposals(ai_suggestion_id);
