-- 9. Products & Categories Catalog

-- Categories table (shop-specific)
CREATE TABLE categories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  emoji TEXT DEFAULT '📦',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, name)
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own categories" ON categories
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own categories" ON categories
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own categories" ON categories
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own categories" ON categories
  FOR DELETE USING (auth.uid() = user_id);

-- Products table (shop-specific)
CREATE TABLE products (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
  emoji TEXT DEFAULT '🛒',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own products" ON products
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own products" ON products
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own products" ON products
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own products" ON products
  FOR DELETE USING (auth.uid() = user_id);

-- Insert default categories for existing users
INSERT INTO categories (user_id, name, emoji)
SELECT id, 'المواد الغذائية الأساسية', '🛒'
FROM profiles
ON CONFLICT DO NOTHING;

INSERT INTO categories (user_id, name, emoji)
SELECT id, 'الحليب ومستلزمات الصباح', '🥛'
FROM profiles
ON CONFLICT DO NOTHING;

INSERT INTO categories (user_id, name, emoji)
SELECT id, 'المشروبات والماء', '🥤'
FROM profiles
ON CONFLICT DO NOTHING;

INSERT INTO categories (user_id, name, emoji)
SELECT id, 'الخضار والفواكه', '🥕'
FROM profiles
ON CONFLICT DO NOTHING;

INSERT INTO categories (user_id, name, emoji)
SELECT id, 'الحلويات والسناكات', '🍬'
FROM profiles
ON CONFLICT DO NOTHING;

INSERT INTO categories (user_id, name, emoji)
SELECT id, 'مواد النظافة والتنظيف', '🧹'
FROM profiles
ON CONFLICT DO NOTHING;

INSERT INTO categories (user_id, name, emoji)
SELECT id, 'مستلزمات الأطفال', '👶'
FROM profiles
ON CONFLICT DO NOTHING;

INSERT INTO categories (user_id, name, emoji)
SELECT id, 'خدمات إضافية', '🔌'
FROM profiles
ON CONFLICT DO NOTHING;