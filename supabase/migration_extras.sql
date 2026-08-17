-- מיגרציה: רשימות מיוחדות + רעיונות לארוחה
-- הרץ ב-Supabase Dashboard -> SQL Editor -> New query

create table if not exists custom_lists (
  id uuid primary key default uuid_generate_v4(),
  household_id uuid references households(id) on delete cascade,
  name text not null,
  created_at timestamptz default now()
);

create table if not exists custom_list_items (
  id uuid primary key default uuid_generate_v4(),
  list_id uuid references custom_lists(id) on delete cascade,
  text text not null,
  checked boolean default false,
  created_at timestamptz default now()
);

create table if not exists meal_ideas (
  id uuid primary key default uuid_generate_v4(),
  household_id uuid references households(id) on delete cascade,
  title text not null,
  notes text,
  ingredients_text text,
  created_at timestamptz default now()
);

alter table custom_lists enable row level security;
alter table custom_list_items enable row level security;
alter table meal_ideas enable row level security;

create policy "custom lists access" on custom_lists
  for all using (household_id = get_my_household_id())
  with check (household_id = get_my_household_id());

create policy "custom list items access" on custom_list_items
  for all using (
    list_id in (select id from custom_lists where household_id = get_my_household_id())
  )
  with check (
    list_id in (select id from custom_lists where household_id = get_my_household_id())
  );

create policy "meal ideas access" on meal_ideas
  for all using (household_id = get_my_household_id())
  with check (household_id = get_my_household_id());

alter publication supabase_realtime add table custom_lists;
alter publication supabase_realtime add table custom_list_items;
alter publication supabase_realtime add table meal_ideas;
