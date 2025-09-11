-- إنشاء قاعدة البيانات مع التحديث الفوري
-- يجب تشغيل هذا السكريبت في Supabase SQL Editor

-- جدول المنتجات
CREATE TABLE IF NOT EXISTS products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    image_url TEXT NOT NULL,
    category TEXT NOT NULL,
    likes_count INTEGER DEFAULT 0,
    average_rating DECIMAL(3,2) DEFAULT 0,
    reviews_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true
);

-- جدول الإعجابات
CREATE TABLE IF NOT EXISTS likes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    user_ip TEXT NOT NULL,
    UNIQUE(product_id, user_id)
);

-- جدول التقييمات
CREATE TABLE IF NOT EXISTS reviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    user_name TEXT NOT NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT NOT NULL,
    is_approved BOOLEAN DEFAULT true,
    admin_response TEXT
);

-- جدول الأسئلة
CREATE TABLE IF NOT EXISTS questions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    user_name TEXT NOT NULL,
    question TEXT NOT NULL,
    answer TEXT,
    is_answered BOOLEAN DEFAULT false,
    answered_at TIMESTAMP WITH TIME ZONE
);

-- تفعيل Row Level Security
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

-- سياسات الأمان للقراءة العامة
CREATE POLICY "Enable read access for all users" ON products FOR SELECT USING (is_active = true);
CREATE POLICY "Enable read access for all users" ON likes FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON reviews FOR SELECT USING (is_approved = true);
CREATE POLICY "Enable read access for all users" ON questions FOR SELECT USING (true);

-- سياسات الكتابة للمستخدمين
CREATE POLICY "Enable insert for all users" ON likes FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable insert for all users" ON reviews FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable insert for all users" ON questions FOR INSERT WITH CHECK (true);

-- سياسات الحذف للإعجابات
CREATE POLICY "Enable delete for users" ON likes FOR DELETE USING (true);

-- تفعيل Realtime للجداول
ALTER PUBLICATION supabase_realtime ADD TABLE products;
ALTER PUBLICATION supabase_realtime ADD TABLE likes;
ALTER PUBLICATION supabase_realtime ADD TABLE reviews;
ALTER PUBLICATION supabase_realtime ADD TABLE questions;

-- دوال لتحديث الإحصائيات تلقائياً
CREATE OR REPLACE FUNCTION update_product_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- تحديث عدد التقييمات ومتوسط التقييم
    UPDATE products 
    SET 
        reviews_count = (
            SELECT COUNT(*) 
            FROM reviews 
            WHERE product_id = COALESCE(NEW.product_id, OLD.product_id) 
            AND is_approved = true
        ),
        average_rating = COALESCE((
            SELECT AVG(rating)::DECIMAL(3,2)
            FROM reviews 
            WHERE product_id = COALESCE(NEW.product_id, OLD.product_id) 
            AND is_approved = true
        ), 0)
    WHERE id = COALESCE(NEW.product_id, OLD.product_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- دالة لتحديث عدد الإعجابات
CREATE OR REPLACE FUNCTION update_likes_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE products 
    SET likes_count = (
        SELECT COUNT(*) 
        FROM likes 
        WHERE product_id = COALESCE(NEW.product_id, OLD.product_id)
    )
    WHERE id = COALESCE(NEW.product_id, OLD.product_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- إنشاء المحفزات
CREATE TRIGGER update_product_stats_trigger
    AFTER INSERT OR UPDATE OR DELETE ON reviews
    FOR EACH ROW EXECUTE FUNCTION update_product_stats();

CREATE TRIGGER update_likes_count_trigger
    AFTER INSERT OR DELETE ON likes
    FOR EACH ROW EXECUTE FUNCTION update_likes_count();

-- إدراج بيانات تجريبية
INSERT INTO products (name, description, price, image_url, category) VALUES
('هاتف ذكي متطور', 'هاتف ذكي بمواصفات عالية وكاميرا متقدمة', 599.99, 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400', 'هواتف'),
('لابتوب للألعاب', 'لابتوب قوي مخصص للألعاب والتصميم', 1299.99, 'https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?w=400', 'حاسوب'),
('سماعات لاسلكية', 'سماعات بلوتوث عالية الجودة مع إلغاء الضوضاء', 199.99, 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400', 'إكسسوارات'),
('ساعة ذكية', 'ساعة ذكية لتتبع اللياقة والصحة', 299.99, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400', 'إكسسوارات');

-- إدراج تقييمات تجريبية
INSERT INTO reviews (product_id, user_name, rating, comment) 
SELECT 
    p.id,
    'أحمد محمد',
    5,
    'منتج ممتاز وجودة عالية، أنصح بشرائه'
FROM products p LIMIT 1;

INSERT INTO reviews (product_id, user_name, rating, comment) 
SELECT 
    p.id,
    'فاطمة علي',
    4,
    'جيد جداً ولكن السعر مرتفع قليلاً'
FROM products p OFFSET 1 LIMIT 1;

-- إدراج أسئلة تجريبية
INSERT INTO questions (product_id, user_name, question, answer, is_answered, answered_at)
SELECT 
    p.id,
    'سارة أحمد',
    'هل يأتي المنتج مع ضمان؟',
    'نعم، يأتي مع ضمان لمدة سنتين',
    true,
    NOW()
FROM products p LIMIT 1;

INSERT INTO questions (product_id, user_name, question)
SELECT 
    p.id,
    'محمد خالد',
    'متى سيتوفر المنتج مرة أخرى؟'
FROM products p OFFSET 1 LIMIT 1;