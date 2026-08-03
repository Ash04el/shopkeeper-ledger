-- 0005: Add is_archived column to customers (soft hide, not delete)

ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS is_archived BOOLEAN NOT NULL DEFAULT FALSE;

-- Update the customer_balances view to include is_archived
CREATE OR REPLACE VIEW public.customer_balances
WITH (security_invoker = true)
AS
SELECT
  c.id AS customer_id,
  c.user_id,
  c.name,
  c.phone,
  c.note,
  c.is_archived,
  c.created_at,
  COALESCE(SUM(CASE WHEN t.type = 'credit' THEN t.amount ELSE 0 END), 0) -
  COALESCE(SUM(CASE WHEN t.type = 'payment' THEN t.amount ELSE 0 END), 0) AS balance
FROM public.customers c
LEFT JOIN public.transactions t ON t.customer_id = c.id
GROUP BY c.id, c.user_id, c.name, c.phone, c.note, c.is_archived, c.created_at;