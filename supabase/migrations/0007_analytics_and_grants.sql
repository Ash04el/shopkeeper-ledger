-- 0007: Analytics function + missing GRANTs for views/tables created in 0004-0006

-- ====================================================================
-- GRANTs for objects created in earlier migrations
-- (Missing GRANTs cause "permission denied" even with correct RLS)
-- ====================================================================

-- From 0004/0005: customer_balances view
GRANT SELECT ON public.customer_balances TO authenticated;

-- From 0006: reminders_log table
GRANT SELECT, INSERT ON public.reminders_log TO authenticated;

-- ====================================================================
-- Analytics function: returns aggregated metrics scoped to auth.uid()
-- Uses SECURITY INVOKER so RLS policies on underlying tables apply.
-- ====================================================================

CREATE OR REPLACE FUNCTION public.get_shop_analytics()
RETURNS TABLE (
  total_active_customers bigint,
  total_outstanding_credit numeric,
  total_payments_all_time numeric,
  active_debtors_count bigint
)
SECURITY INVOKER
SET search_path = ''
LANGUAGE sql
STABLE
AS $$
  SELECT
    COUNT(*) FILTER (WHERE is_archived = false)::bigint AS total_active_customers,
    COALESCE(SUM(balance) FILTER (WHERE balance > 0 AND is_archived = false), 0) AS total_outstanding_credit,
    COALESCE(
      (SELECT SUM(t.amount)
       FROM public.transactions t
       WHERE t.type = 'payment'
         AND t.user_id = auth.uid()
      ),
      0
    ) AS total_payments_all_time,
    COUNT(*) FILTER (WHERE balance > 0 AND is_archived = false)::bigint AS active_debtors_count
  FROM public.customer_balances
  WHERE user_id = auth.uid();
$$;

GRANT EXECUTE ON FUNCTION public.get_shop_analytics() TO authenticated;