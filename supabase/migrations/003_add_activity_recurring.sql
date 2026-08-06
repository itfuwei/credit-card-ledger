-- =============================================================================
-- 补充：activities 表增加 is_recurring 循环活动标记
-- 循环活动每月自动重置，活动时间和领取时间默认为当月1号至月末
-- =============================================================================
alter table public.activities
  add column if not exists is_recurring boolean not null default false;
