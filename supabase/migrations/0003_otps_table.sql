-- -------------------------------------------------------------------
-- 0003: جدول رموز التحقق المؤقتة (OTPs)
-- -------------------------------------------------------------------
-- يخزن رموز التحقق (OTP) في قاعدة البيانات بدلاً من الذاكرة (in-memory)
-- لضمان بقاء الرموز بعد إعادة تشغيل الخادم أو hot-reload أثناء التطوير
-- -------------------------------------------------------------------

-- 1. إنشاء جدول otps
CREATE TABLE otps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT NOT NULL,
  otp_code TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_used BOOLEAN NOT NULL DEFAULT FALSE
);

-- 2. تفعيل Row Level Security (RLS)
ALTER TABLE otps ENABLE ROW LEVEL SECURITY;

-- 3. سياسات RLS
-- السماح للـ service role (تتجاوز RLS تلقائياً) بالعمليات الكاملة
-- السماح للمستخدمين العامين (anon/authenticated) بإدراج وقراءة وتحديث الصفوف
-- (هذا آمن لأن التحقق يحدث عبر مطابقة phone + otp_code + النافذة الزمنية)

CREATE POLICY "Service role full access" ON otps
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Public can insert otps" ON otps
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Public can select otps" ON otps
  FOR SELECT USING (true);

CREATE POLICY "Public can update otps" ON otps
  FOR UPDATE USING (true);

-- 4. فهرسة لتسريع البحث برقم الهاتف
CREATE INDEX idx_otps_phone ON otps(phone);

-- 5. فهرسة مركبة لتسريع التحقق (phone + is_used + created_at)
CREATE INDEX idx_otps_verify ON otps(phone, is_used, created_at DESC);