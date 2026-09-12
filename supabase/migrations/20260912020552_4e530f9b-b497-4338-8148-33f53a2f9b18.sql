CREATE TYPE public.app_role AS ENUM ('admin', 'staff');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Users can read their own roles"
ON public.user_roles FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can read all roles"
ON public.user_roles FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  category text NOT NULL CHECK (category IN ('Fabrics', 'Ready-to-Wear', 'Asoebi')),
  variant text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  pattern text NOT NULL DEFAULT '',
  option_label text NOT NULL DEFAULT 'Option',
  options text[] NOT NULL DEFAULT '{}',
  min_qty integer NOT NULL DEFAULT 1 CHECK (min_qty >= 1),
  price_ngn integer NOT NULL CHECK (price_ngn >= 0),
  price_gbp numeric(10,2) NOT NULL DEFAULT 0 CHECK (price_gbp >= 0),
  volume_tiers jsonb NOT NULL DEFAULT '[]'::jsonb,
  stock_status text NOT NULL DEFAULT 'In Stock' CHECK (stock_status IN ('In Stock', 'Limited Stock', 'Inquire for Timeline')),
  image_url text NOT NULL DEFAULT '',
  gallery jsonb NOT NULL DEFAULT '[]'::jsonb,
  published boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.products TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT ALL ON public.products TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published products"
ON public.products FOR SELECT TO anon, authenticated
USING (published = true);

CREATE POLICY "Admins can view all products"
ON public.products FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert products"
ON public.products FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update products"
ON public.products FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete products"
ON public.products FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER products_updated_at BEFORE UPDATE ON public.products
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference text NOT NULL UNIQUE,
  customer_name text NOT NULL,
  customer_phone text NOT NULL DEFAULT '',
  customer_email text NOT NULL DEFAULT '',
  city text NOT NULL DEFAULT '',
  address text NOT NULL DEFAULT '',
  notes text NOT NULL DEFAULT '',
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  currency text NOT NULL DEFAULT 'NGN' CHECK (currency IN ('NGN', 'GBP')),
  subtotal numeric(12,2) NOT NULL DEFAULT 0,
  delivery_fee numeric(12,2) NOT NULL DEFAULT 0,
  total numeric(12,2) NOT NULL DEFAULT 0,
  volume integer NOT NULL DEFAULT 0,
  payment_provider text NOT NULL DEFAULT 'whatsapp' CHECK (payment_provider IN ('stripe', 'paystack', 'whatsapp')),
  payment_status text NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'cancelled', 'refunded')),
  fulfilment_status text NOT NULL DEFAULT 'new' CHECK (fulfilment_status IN ('new', 'confirmed', 'packed', 'dispatched', 'delivered', 'cancelled')),
  provider_reference text,
  provider_checkout_url text,
  admin_notes text NOT NULL DEFAULT '',
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX orders_created_at_idx ON public.orders (created_at DESC);
CREATE INDEX orders_payment_status_idx ON public.orders (payment_status);
CREATE INDEX orders_fulfilment_status_idx ON public.orders (fulfilment_status);

GRANT SELECT, UPDATE ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view orders"
ON public.orders FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update orders"
ON public.orders FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER orders_updated_at BEFORE UPDATE ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.payment_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL,
  event_id text NOT NULL,
  order_reference text,
  event_type text NOT NULL DEFAULT '',
  received_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (provider, event_id)
);

GRANT SELECT ON public.payment_events TO authenticated;
GRANT ALL ON public.payment_events TO service_role;
ALTER TABLE public.payment_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view payment events"
ON public.payment_events FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.products (code, name, category, variant, description, pattern, option_label, options, min_qty, price_ngn, price_gbp, volume_tiers, stock_status, image_url, gallery, sort_order) VALUES
('ank-001', 'Premium 100% Cotton Ankara', 'Fabrics', '3-Yard Bundle', 'Authentic, high-grade cotton weave featuring traditional vibrant print styling.', 'Geometric Wax Block', 'Print Family', ARRAY['Indigo Bloom','Ochre Sun','Emerald Tile','Clay Mosaic'], 1, 3000, 18.00, '[]'::jsonb, 'In Stock', 'asset:product-fabric.jpg', '[{"src":"asset:product-fabric.jpg","caption":"3-yard bundle as supplied"},{"src":"asset:detail-fabric-macro.jpg","caption":"Macro: wax-block print edges & cotton weave"},{"src":"asset:detail-fabric-stack.jpg","caption":"Print family stack — indigo, ochre, emerald"}]'::jsonb, 1),
('rtw-002', 'Elegance Bubu Gown', 'Ready-to-Wear', 'Free Size', 'Flowing, sophisticated silhouette engineered for modern everyday luxury.', 'Rosette Medallion', 'Fit', ARRAY['Free Size','Plus (UK 18-22)','Petite Length'], 1, 12500, 68.00, '[]'::jsonb, 'Limited Stock', 'asset:product-bubu.jpg', '[{"src":"asset:product-bubu.jpg","caption":"Bubu gown, house styling"},{"src":"asset:detail-bubu-macro.jpg","caption":"Macro: rosette medallion & hem stitch"},{"src":"asset:detail-bubu-full.jpg","caption":"Full-length drape on body"}]'::jsonb, 2),
('rtw-003', 'Tailored Palazzo Trousers', 'Ready-to-Wear', 'Adjustable Waist', 'Wide-leg cut with premium pattern alignment across all structural seams.', 'Radial Sunburst', 'Size', ARRAY['S','M','L','XL'], 1, 8500, 46.00, '[]'::jsonb, 'In Stock', 'asset:product-palazzo.jpg', '[{"src":"asset:product-palazzo.jpg","caption":"Palazzo trousers, flat styling"},{"src":"asset:detail-palazzo-macro.jpg","caption":"Macro: sunburst alignment across the seam"},{"src":"asset:detail-palazzo-styled.jpg","caption":"Styled in motion — wide-leg fall"}]'::jsonb, 3),
('aso-004', 'Custom Asoebi Bulk Supply', 'Asoebi', 'Minimum 10 Packs', 'High-volume fabric pairing and coordination tailored for traditional event sizing.', 'Coordinated Leaf Damask', 'Coordination', ARRAY['Single Print','Two-Tone Pairing','Bride + Party Split'], 10, 2800, 16.00, '[{"minQty":10,"label":"10 – 24 packs","unitPriceNgn":2800,"unitPriceGbp":16.00},{"minQty":25,"label":"25 – 49 packs","unitPriceNgn":2650,"unitPriceGbp":15.00},{"minQty":50,"label":"50+ packs","unitPriceNgn":2450,"unitPriceGbp":14.00}]'::jsonb, 'Inquire for Timeline', 'asset:product-asoebi.jpg', '[{"src":"asset:product-asoebi.jpg","caption":"Asoebi coordination sample"},{"src":"asset:detail-asoebi-macro.jpg","caption":"Macro: two-tone leaf damask pairing"},{"src":"asset:detail-asoebi-bulk.jpg","caption":"Bulk packs prepared for an event"}]'::jsonb, 4);