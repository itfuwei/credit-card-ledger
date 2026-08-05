-- 信用卡管理系统 - 初始数据库结构
-- 使用方法：登录 Supabase 控制台 → SQL Editor → 粘贴本文件全部内容 → Run
-- 包含 5 张业务表、外键约束、Row Level Security 策略和自动注入 user_id 的触发器。

-- =============================================================================
-- 1. cards 信用卡表
-- =============================================================================
create table if not exists public.cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  bank text not null,
  name text not null,
  last4 char(4) not null,
  limit_fen bigint not null check (limit_fen >= 0),
  statement_day smallint not null check (statement_day >= 1 and statement_day <= 31),
  payment_day smallint not null check (payment_day >= 1 and payment_day <= 31),
  color text not null default '#3f6fb6',
  status text not null default 'active' check (status in ('active', 'inactive')),
  has_check_in boolean not null default false,
  points_rating text not null default 'average' check (points_rating in ('good', 'average', 'poor')),
  points_redemption_path text not null default '',
  created_at timestamptz not null default now()
);

-- =============================================================================
-- 2. transactions 交易流水表
-- =============================================================================
create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  card_id uuid not null references public.cards(id) on delete restrict,
  date date not null,
  amount_fen bigint not null check (amount_fen >= 0),
  fee_fen bigint not null default 0 check (fee_fen >= 0),
  note text not null default '',
  created_at timestamptz not null default now()
);

-- =============================================================================
-- 3. repayments 还款记录表
-- =============================================================================
create table if not exists public.repayments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  card_id uuid not null references public.cards(id) on delete restrict,
  date date not null,
  amount_fen bigint not null check (amount_fen >= 0),
  created_at timestamptz not null default now()
);

-- =============================================================================
-- 4. activities 信用卡活动表
-- =============================================================================
create table if not exists public.activities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  card_id uuid not null references public.cards(id) on delete cascade,
  title text not null,
  start_date date not null,
  end_date date not null,
  threshold_fen bigint not null check (threshold_fen >= 0),
  reward_type text not null default 'points' check (reward_type in ('points', 'cash', 'coupon', 'gift', 'other')),
  reward_description text not null default '',
  claim_path text not null default '',
  claim_start_date date,
  claim_end_date date,
  claimed boolean not null default false,
  claimed_at date,
  created_at timestamptz not null default now()
);

-- =============================================================================
-- 5. points_products 积分商品表
-- =============================================================================
create table if not exists public.points_products (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  card_id uuid not null references public.cards(id) on delete cascade,
  name text not null,
  points_cost integer not null check (points_cost > 0),
  cash_value_fen bigint not null default 0 check (cash_value_fen >= 0),
  note text not null default '',
  created_at timestamptz not null default now()
);

-- =============================================================================
-- 索引
-- =============================================================================
create index if not exists idx_cards_user_id on public.cards(user_id);
create index if not exists idx_transactions_user_id on public.transactions(user_id);
create index if not exists idx_transactions_card_id on public.transactions(card_id);
create index if not exists idx_repayments_user_id on public.repayments(user_id);
create index if not exists idx_repayments_card_id on public.repayments(card_id);
create index if not exists idx_activities_user_id on public.activities(user_id);
create index if not exists idx_activities_card_id on public.activities(card_id);
create index if not exists idx_points_products_user_id on public.points_products(user_id);
create index if not exists idx_points_products_card_id on public.points_products(card_id);

-- =============================================================================
-- Row Level Security
-- =============================================================================
alter table public.cards enable row level security;
alter table public.transactions enable row level security;
alter table public.repayments enable row level security;
alter table public.activities enable row level security;
alter table public.points_products enable row level security;

-- cards 策略
create policy "cards_select_own" on public.cards for select using (auth.uid() = user_id);
create policy "cards_insert_own" on public.cards for insert with check (auth.uid() = user_id);
create policy "cards_update_own" on public.cards for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "cards_delete_own" on public.cards for delete using (auth.uid() = user_id);

-- transactions 策略
create policy "tx_select_own" on public.transactions for select using (auth.uid() = user_id);
create policy "tx_insert_own" on public.transactions for insert with check (auth.uid() = user_id);
create policy "tx_update_own" on public.transactions for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "tx_delete_own" on public.transactions for delete using (auth.uid() = user_id);

-- repayments 策略
create policy "repay_select_own" on public.repayments for select using (auth.uid() = user_id);
create policy "repay_insert_own" on public.repayments for insert with check (auth.uid() = user_id);
create policy "repay_update_own" on public.repayments for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "repay_delete_own" on public.repayments for delete using (auth.uid() = user_id);

-- activities 策略
create policy "act_select_own" on public.activities for select using (auth.uid() = user_id);
create policy "act_insert_own" on public.activities for insert with check (auth.uid() = user_id);
create policy "act_update_own" on public.activities for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "act_delete_own" on public.activities for delete using (auth.uid() = user_id);

-- points_products 策略
create policy "pp_select_own" on public.points_products for select using (auth.uid() = user_id);
create policy "pp_insert_own" on public.points_products for insert with check (auth.uid() = user_id);
create policy "pp_update_own" on public.points_products for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "pp_delete_own" on public.points_products for delete using (auth.uid() = user_id);

-- =============================================================================
-- 自动注入 user_id 的触发器
-- 前端 SDK insert 时不传 user_id，由数据库自动填充当前登录用户。
-- =============================================================================
create or replace function public.set_user_id()
returns trigger
language plpgsql
security definer
as $$
begin
  new.user_id := auth.uid();
  return new;
end;
$$;

create trigger trg_cards_set_user_id
  before insert on public.cards
  for each row execute function public.set_user_id();

create trigger trg_transactions_set_user_id
  before insert on public.transactions
  for each row execute function public.set_user_id();

create trigger trg_repayments_set_user_id
  before insert on public.repayments
  for each row execute function public.set_user_id();

create trigger trg_activities_set_user_id
  before insert on public.activities
  for each row execute function public.set_user_id();

create trigger trg_points_products_set_user_id
  before insert on public.points_products
  for each row execute function public.set_user_id();
