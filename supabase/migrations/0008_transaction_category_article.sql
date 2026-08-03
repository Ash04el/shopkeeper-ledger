-- 0008: Add category and article_name columns to transactions table
-- Supports the category/article selector in the credit transaction modal

ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS article_name TEXT;

-- Grant permissions to authenticated role
GRANT ALL ON public.transactions TO authenticated;