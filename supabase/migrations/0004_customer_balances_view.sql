-- 0004: customer_balances aggregated view + performance index
-- Replaces the N+1 RPC pattern in /api/customers with a single view query.

-- Performance index for transaction lookups by customer
CREATE INDEX IF NOT EXISTS idx_transactions_customer_created
ON public.transactions(customer_id, created_at DESC);

-- Materialized aggregation view: one row per customer with pre-computed balance
-- security_invoker = true ensures the view runs with the caller's privileges,
-- so RLS policies on the underlying tables (customers, transactions) are enforced.
CREATE OR REPLACE VIEW public.customer_balances
WITH (security_invoker = true)
AS
SELECT
  c.id AS customer_id,
  c.user_id,
  c.name,
  c.phone,
  c.note,
  c.created_at,
  COALESCE(SUM(CASE WHEN t.type = 'credit' THEN t.amount ELSE 0 END), 0) -
  COALESCE(SUM(CASE WHEN t.type = 'payment' THEN t.amount ELSE 0 END), 0) AS balance
FROM public.customers c
LEFT JOIN public.transactions t ON t.customer_id = c.id
GROUP BY c.id, c.user_id, c.name, c.phone, c.note, c.created_at;