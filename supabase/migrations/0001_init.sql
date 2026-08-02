-- تفعيل الامتداد للأرقام العشوائية
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. جدول أصحاب المحلات (مرتبط بـ auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  phone_number TEXT UNIQUE NOT NULL,
  shop_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. جدول الزبناء
CREATE TABLE customers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT, -- رقم الهاتف (ضروري للواتساب)
  note TEXT, -- ملاحظات (اختياري)
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. جدول المعاملات (نوع واحد للكريدي والمدفوعات)
CREATE TYPE transaction_type AS ENUM ('credit', 'payment');

CREATE TABLE transactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
  type transaction_type NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- -------------------------------------------------------------------
-- RLS (Row Level Security) - ضروري لحماية البيانات
-- -------------------------------------------------------------------
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- سياسات لـ profiles
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- سياسات لـ customers
CREATE POLICY "Users can view own customers" ON customers
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own customers" ON customers
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own customers" ON customers
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own customers" ON customers
  FOR DELETE USING (auth.uid() = user_id);

-- سياسات لـ transactions
CREATE POLICY "Users can view own transactions" ON transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions" ON transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- (اختياري) يمكن إضافة سياسة للتحديث والحذف لكن ليس ضرورياً في MVP

-- -------------------------------------------------------------------
-- (اختياري) إنشاء دالة لحساب الرصيد بسهولة (تستعمل في API)
-- -------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_customer_balance(customer_id UUID)
RETURNS DECIMAL AS $$
DECLARE
  total_credits DECIMAL;
  total_payments DECIMAL;
BEGIN
  SELECT COALESCE(SUM(amount), 0) INTO total_credits
  FROM transactions
  WHERE customer_id = $1 AND type = 'credit';

  SELECT COALESCE(SUM(amount), 0) INTO total_payments
  FROM transactions
  WHERE customer_id = $1 AND type = 'payment';

  RETURN total_credits - total_payments;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;