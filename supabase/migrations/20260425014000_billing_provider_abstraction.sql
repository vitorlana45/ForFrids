-- ============================================================
-- Eterno Pet - provider-neutral billing columns
-- Safe to run more than once.
-- ============================================================

alter table public.subscriptions
  add column if not exists provider text not null default 'stripe',
  add column if not exists provider_customer_id text,
  add column if not exists provider_subscription_id text,
  add column if not exists provider_checkout_id text,
  add column if not exists canceled_at timestamptz;

update public.subscriptions
set
  provider = coalesce(provider, 'stripe'),
  provider_customer_id = coalesce(provider_customer_id, stripe_customer_id),
  provider_subscription_id = coalesce(provider_subscription_id, stripe_subscription_id)
where provider = 'stripe';

create index if not exists idx_subscriptions_provider_customer_id
  on public.subscriptions(provider, provider_customer_id);

create index if not exists idx_subscriptions_provider_profile_id
  on public.subscriptions(provider, profile_id);

create unique index if not exists idx_subscriptions_provider_subscription_id
  on public.subscriptions(provider, provider_subscription_id)
  where provider_subscription_id is not null;
