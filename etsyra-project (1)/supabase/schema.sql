-- ============================================================
-- ETSYRA — Supabase Database Schema
-- Run this in your Supabase SQL editor to set up all tables.
-- ============================================================

-- ────────────────────────────────────────────
-- PROFILES (extends Supabase auth.users)
-- ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name       TEXT NOT NULL DEFAULT '',
  email      TEXT NOT NULL DEFAULT '',
  role       TEXT NOT NULL DEFAULT 'staff' CHECK (role IN ('admin', 'staff')),
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'staff')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Admins can update all profiles"
  ON public.profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete profiles"
  ON public.profiles FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- ────────────────────────────────────────────
-- STORES
-- ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.stores (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  handle     TEXT NOT NULL DEFAULT '',
  url        TEXT,
  emoji      TEXT NOT NULL DEFAULT '🏪',
  status     TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins full access on stores"
  ON public.stores FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Staff can read assigned stores"
  ON public.stores FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.staff_stores
      WHERE staff_stores.user_id = auth.uid()
        AND staff_stores.store_id = stores.id
    )
  );

-- ────────────────────────────────────────────
-- STAFF_STORES (assignment junction table)
-- ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.staff_stores (
  user_id    UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  store_id   UUID REFERENCES public.stores(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, store_id)
);

ALTER TABLE public.staff_stores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage staff_stores"
  ON public.staff_stores FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Staff can read own assignments"
  ON public.staff_stores FOR SELECT
  USING (auth.uid() = user_id);

-- ────────────────────────────────────────────
-- ORDERS
-- ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.orders (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  etsy_order_id  TEXT NOT NULL UNIQUE,
  store_id       UUID REFERENCES public.stores(id) ON DELETE SET NULL,
  customer_name  TEXT NOT NULL,
  total          NUMERIC(10, 2) NOT NULL DEFAULT 0,
  status         TEXT NOT NULL DEFAULT 'created'
                   CHECK (status IN ('created', 'pre_transit', 'in_transit', 'delivered', 'completed')),
  order_date     TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_gift        BOOLEAN NOT NULL DEFAULT false,
  created_at     TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins full access on orders"
  ON public.orders FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Staff can read orders from assigned stores"
  ON public.orders FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.staff_stores
      WHERE staff_stores.user_id = auth.uid()
        AND staff_stores.store_id = orders.store_id
    )
  );

CREATE POLICY "Staff can update status of assigned store orders"
  ON public.orders FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.staff_stores
      WHERE staff_stores.user_id = auth.uid()
        AND staff_stores.store_id = orders.store_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.staff_stores
      WHERE staff_stores.user_id = auth.uid()
        AND staff_stores.store_id = orders.store_id
    )
  );

-- ────────────────────────────────────────────
-- ORDER_ITEMS
-- ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.order_items (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id   UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  title      TEXT NOT NULL,
  quantity   INTEGER NOT NULL DEFAULT 1,
  size       TEXT NOT NULL DEFAULT '40oz',
  color      TEXT NOT NULL DEFAULT '',
  font_style TEXT NOT NULL DEFAULT 'M.5',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Inherit access from parent order — admins"
  ON public.order_items FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Staff can read order items for their orders"
  ON public.order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      JOIN public.staff_stores ss ON ss.store_id = o.store_id
      WHERE o.id = order_items.order_id AND ss.user_id = auth.uid()
    )
  );

-- ────────────────────────────────────────────
-- PERSONALIZATION_NAMES
-- ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.personalization_names (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_item_id UUID NOT NULL REFERENCES public.order_items(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.personalization_names ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins full access on personalization_names"
  ON public.personalization_names FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Staff can read personalization for their order items"
  ON public.personalization_names FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.order_items oi
      JOIN public.orders o ON o.id = oi.order_id
      JOIN public.staff_stores ss ON ss.store_id = o.store_id
      WHERE oi.id = personalization_names.order_item_id AND ss.user_id = auth.uid()
    )
  );

-- ────────────────────────────────────────────
-- SHIPPING
-- ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.shipping (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id  UUID NOT NULL UNIQUE REFERENCES public.orders(id) ON DELETE CASCADE,
  recipient TEXT NOT NULL DEFAULT '',
  address   TEXT NOT NULL DEFAULT '',
  city      TEXT NOT NULL DEFAULT '',
  state     TEXT NOT NULL DEFAULT '',
  zip       TEXT NOT NULL DEFAULT '',
  country   TEXT NOT NULL DEFAULT 'US',
  verified  BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.shipping ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins full access on shipping"
  ON public.shipping FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Staff can read shipping for their orders"
  ON public.shipping FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      JOIN public.staff_stores ss ON ss.store_id = o.store_id
      WHERE o.id = shipping.order_id AND ss.user_id = auth.uid()
    )
  );

-- ────────────────────────────────────────────
-- INVENTORY
-- ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.inventory (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id   UUID REFERENCES public.stores(id) ON DELETE SET NULL,
  title      TEXT NOT NULL,
  sku        TEXT,
  quantity   INTEGER NOT NULL DEFAULT 0,
  price      NUMERIC(10, 2) NOT NULL DEFAULT 0,
  cost       NUMERIC(10, 2) NOT NULL DEFAULT 0,
  status     TEXT NOT NULL DEFAULT 'in_stock'
               CHECK (status IN ('in_stock', 'low_stock', 'out_of_stock')),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins full access on inventory"
  ON public.inventory FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ────────────────────────────────────────────
-- EXPENSES
-- ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.expenses (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id    UUID REFERENCES public.stores(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  amount      NUMERIC(10, 2) NOT NULL DEFAULT 0,
  category    TEXT NOT NULL DEFAULT 'Other',
  date        TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at  TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins full access on expenses"
  ON public.expenses FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ────────────────────────────────────────────
-- SEED DATA (optional — remove in production)
-- ────────────────────────────────────────────
-- Insert sample stores
INSERT INTO public.stores (name, handle, emoji, status) VALUES
  ('Crystal Tumblers', '@crystaltumblers', '💎', 'active'),
  ('Lilac Dreams', '@lilacdreams', '💜', 'active'),
  ('Boho Gifts Co.', '@bohogifts', '🌸', 'active')
ON CONFLICT DO NOTHING;
