-- ============================================
-- バスシリカ サンプル配布管理アプリ DB Schema
-- 既存のsilica-tour Supabaseプロジェクトに同居するため bath_ プレフィックス付き
-- ============================================

-- 店舗テーブル
create table if not exists bath_stores (
  id uuid primary key default gen_random_uuid(),
  store_id text unique not null,
  name text not null,
  password text not null,
  max_samples int not null default 240,
  is_admin boolean not null default false,
  display_order int not null default 0,
  created_at timestamptz not null default now()
);

-- 顧客テーブル（サンプル配布記録）
create table if not exists bath_customers (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references bath_stores(id) on delete cascade,
  name text not null,
  gender text,
  age_group text,
  age int,
  contracted boolean not null default false,
  contracted_at timestamptz,
  distributed_at timestamptz not null default now(),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists bath_customers_store_id_idx on bath_customers(store_id);
create index if not exists bath_customers_contracted_idx on bath_customers(contracted);
create index if not exists bath_customers_distributed_at_idx on bath_customers(distributed_at desc);

-- updated_at自動更新
create or replace function bath_set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_bath_customers_updated_at on bath_customers;
create trigger set_bath_customers_updated_at
  before update on bath_customers
  for each row execute function bath_set_updated_at();

-- Realtime有効化
alter publication supabase_realtime add table bath_customers;
alter publication supabase_realtime add table bath_stores;

-- 初期データ投入
insert into bath_stores (store_id, name, password, max_samples, is_admin, display_order) values
  ('amarie',  'amarie',  'pass14', 240, false, 1),
  ('akiko',   'akiko',   'pass14', 240, false, 2),
  ('kayaba',  'kayaba',  'pass14', 240, false, 3),
  ('mayumi',  'mayumi',  'pass14', 240, false, 4),
  ('ushi',    '総合管理',  'pass14', 0,   true,  99)
on conflict (store_id) do nothing;

-- RLS（簡易）: anonキーからのアクセスは禁止。全てサーバーロールキー経由で操作する
alter table bath_stores enable row level security;
alter table bath_customers enable row level security;
-- ポリシー無し = anonからは何もできない。サーバー側でservice roleを使う。
