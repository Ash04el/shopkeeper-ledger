-- -------------------------------------------------------------------
-- 0002: إنشاء الملف الشخصي تلقائياً عند تسجيل مستخدم جديد
-- -------------------------------------------------------------------
-- هذه الدالة تعمل تلقائياً بعد إدراج مستخدم جديد في جدول auth.users
-- وتقوم بإنشاء صف مطابق في جدول profiles
-- -------------------------------------------------------------------

-- إنشاء دالة تعمل بصلاحيات المالك (SECURITY DEFINER) حتى تتجاوز RLS
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- إدراج صف جديد في جدول profiles
  -- ON CONFLICT (id) DO NOTHING يضمن عدم حدوث خطأ إذا كان الصف موجوداً مسبقاً
  INSERT INTO public.profiles (id, phone_number, shop_name)
  VALUES (
    NEW.id,                          -- نفس معرف المستخدم من auth.users
    NEW.phone,                       -- رقم الهاتف من بيانات المستخدم
    'المحل ديالي'                    -- اسم المحل الافتراضي
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- إنشاء المشغل (Trigger) الذي يستدعي الدالة بعد إدراج مستخدم جديد
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();