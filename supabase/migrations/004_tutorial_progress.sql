-- Tutorial progress table
create table tutorial_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null unique,
  steps_completed jsonb not null default '{}',
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

-- RLS
alter table tutorial_progress enable row level security;

create policy "Users can view own tutorial progress"
  on tutorial_progress for select
  using (auth.uid() = user_id);

create policy "Users can update own tutorial progress"
  on tutorial_progress for update
  using (auth.uid() = user_id);

create policy "Users can insert own tutorial progress"
  on tutorial_progress for insert
  with check (auth.uid() = user_id);
