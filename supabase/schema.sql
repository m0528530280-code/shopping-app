-- ============================================================
-- סכמת מסד נתונים: אפליקציית קניות משותפת
-- הרץ את כל הקובץ הזה ב-Supabase Dashboard -> SQL Editor -> New query
-- ============================================================

create extension if not exists "uuid-ossp";

-- ---------- טבלאות ----------

create table households (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  created_at timestamptz default now()
);

create table users (
  id uuid primary key references auth.users(id) on delete cascade,
  household_id uuid references households(id) on delete cascade,
  name text not null,
  created_at timestamptz default now()
);

create table products (
  id uuid primary key default uuid_generate_v4(),
  household_id uuid references households(id) on delete cascade,
  name text not null,
  category text default 'אחר',
  default_price numeric,
  active boolean default true,
  created_at timestamptz default now()
);

-- מצב "צריך לקנות" - הרשימה הפעילה המשותפת
create table shopping_list_items (
  id uuid primary key default uuid_generate_v4(),
  household_id uuid references households(id) on delete cascade,
  product_id uuid references products(id) on delete cascade,
  needed boolean default true,
  qty numeric default 1,
  added_by uuid references users(id),
  added_at timestamptz default now(),
  unique(household_id, product_id)
);

-- סבבי קנייה
create table shopping_sessions (
  id uuid primary key default uuid_generate_v4(),
  household_id uuid references households(id) on delete cascade,
  status text default 'active', -- active | completed
  started_at timestamptz default now(),
  completed_at timestamptz,
  total_amount numeric default 0,
  completed_by uuid references users(id)
);

-- פריטים בתוך קנייה ספציפית - כאן "נקנה" + מחיר
create table shopping_session_items (
  id uuid primary key default uuid_generate_v4(),
  shopping_session_id uuid references shopping_sessions(id) on delete cascade,
  product_id uuid references products(id) on delete cascade,
  purchased boolean default false,
  price numeric,
  updated_by uuid references users(id),
  updated_at timestamptz default now()
);

-- ---------- אבטחה (RLS) ----------

alter table households enable row level security;
alter table users enable row level security;
alter table products enable row level security;
alter table shopping_list_items enable row level security;
alter table shopping_sessions enable row level security;
alter table shopping_session_items enable row level security;

create or replace function get_my_household_id()
returns uuid as $$
  select household_id from users where id = auth.uid()
$$ language sql stable security definer;

create policy "view own household" on households
  for select using (id = get_my_household_id());

create policy "view household members" on users
  for select using (household_id = get_my_household_id());
create policy "update own user row" on users
  for update using (id = auth.uid());

create policy "products access" on products
  for all using (household_id = get_my_household_id())
  with check (household_id = get_my_household_id());

create policy "list items access" on shopping_list_items
  for all using (household_id = get_my_household_id())
  with check (household_id = get_my_household_id());

create policy "sessions access" on shopping_sessions
  for all using (household_id = get_my_household_id())
  with check (household_id = get_my_household_id());

create policy "session items access" on shopping_session_items
  for all using (
    shopping_session_id in (select id from shopping_sessions where household_id = get_my_household_id())
  )
  with check (
    shopping_session_id in (select id from shopping_sessions where household_id = get_my_household_id())
  );

-- ---------- הפעלת Realtime ----------

alter publication supabase_realtime add table shopping_list_items;
alter publication supabase_realtime add table shopping_sessions;
alter publication supabase_realtime add table shopping_session_items;

-- ============================================================
-- שלב ידני אחרי הרצת הקובץ:
-- 1. Authentication -> Add user (עבור שניכם, עם מייל וסיסמה)
-- 2. הרץ את השאילתות הבאות עם ה-UUID של כל משתמש (מופיע בטבלת auth.users):
--
-- insert into households (id, name) values ('<בחר-uuid-חדש-או-השאר-ריק>', 'משק הבית שלנו');
-- -- לדוגמה, עם UUID אוטומטי:
-- insert into households (name) values ('משק הבית שלנו') returning id;
-- -- קח את ה-id שהתקבל והשתמש בו כאן:
-- insert into users (id, household_id, name) values ('<auth-user-id-1>', '<household-id>', 'משה');
-- insert into users (id, household_id, name) values ('<auth-user-id-2>', '<household-id>', 'אשתי');
-- ============================================================
