# Etsyra — Multi-Store Etsy Agency Dashboard

A production-ready SaaS dashboard for managing multiple Etsy stores, built with **Next.js 15**, **Supabase**, **TypeScript**, and **Tailwind CSS**.

---

## ✨ Features

- **Apple-style glass UI** — backdrop blur, semi-transparent surfaces, smooth transitions
- **Role-based access control** — Admin vs Staff, enforced at the database (RLS) level
- **Multi-store management** — Assign staff to specific stores
- **Full order lifecycle** — Etsy-style statuses: created → pre_transit → in_transit → delivered → completed
- **Personalized products** — Multiple names, font styles, sizes & colors per order item
- **Dashboard with live filters** — Revenue, orders, profit KPIs; charts that respond to store/date filters
- **Finance tracking** — Revenue vs expenses, monthly charts, profit calculation
- **Inventory CRUD** — Per-store product management with stock status
- **Dark mode** — Full theme support with persisted preference

---

## 🏗️ Project Structure

```
etsyra/
├── app/
│   ├── login/page.tsx              # Auth page with demo buttons
│   ├── (admin)/
│   │   ├── layout.tsx              # Admin guard (redirects non-admins)
│   │   ├── dashboard/page.tsx      # KPIs + charts with working filters
│   │   ├── orders/page.tsx         # Full CRUD + personalization UI
│   │   ├── inventory/page.tsx      # Product inventory CRUD
│   │   ├── finance/page.tsx        # Revenue/expenses/profit
│   │   ├── staff/page.tsx          # Staff management + store assignment
│   │   ├── stores/page.tsx         # Store CRUD + stats
│   │   └── settings/page.tsx       # Profile, password, notifications
│   └── (staff)/
│       ├── layout.tsx              # Staff guard
│       └── orders/page.tsx         # Restricted to assigned stores only
├── components/
│   ├── Sidebar.tsx                 # Collapsible nav, role-aware
│   ├── Header.tsx                  # Title, dark mode, notifications, avatar
│   ├── NotificationBell.tsx        # Dropdown notification panel
│   ├── UserAvatar.tsx              # Profile menu + logout
│   ├── Table.tsx                   # Generic typed table with loading states
│   ├── Modal.tsx                   # Glass modal + shared form components
│   └── FilterBar.tsx               # Reusable filter row (store/status/date)
├── lib/
│   ├── supabaseClient.ts           # Browser Supabase client (singleton)
│   ├── supabaseServer.ts           # Server-side Supabase client
│   ├── authContext.tsx             # Auth context provider
│   └── queries.ts                  # All Supabase queries (no mock data)
├── types/
│   ├── order.ts                    # Order, OrderItem, Shipping, etc.
│   ├── user.ts                     # AppUser, StaffStore
│   └── store.ts                    # Store, InventoryItem, Expense
└── supabase/
    └── schema.sql                  # Full DB schema with RLS policies + seed
```

---

## 🚀 Setup

### 1. Clone & install

```bash
git clone <your-repo>
cd etsyra
npm install
```

### 2. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Copy your **Project URL** and **anon public key** from Project Settings → API

### 3. Configure environment variables

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 4. Run the database schema

In the Supabase **SQL Editor**, paste and run the entire contents of `supabase/schema.sql`.

This creates:
- All tables with proper foreign keys
- Row Level Security (RLS) policies for admin/staff separation
- An auto-trigger to create a profile on user signup
- Optional seed data (3 sample stores)

### 5. Create your first users

In Supabase → **Authentication → Users**, create two users:

| Email | Password | Role (in metadata) |
|---|---|---|
| admin@etsyra.io | demo1234 | admin |
| staff@etsyra.io | demo1234 | staff |

Then in the **SQL editor**, set their roles:
```sql
UPDATE public.profiles SET role = 'admin' WHERE email = 'admin@etsyra.io';
UPDATE public.profiles SET role = 'staff' WHERE email = 'staff@etsyra.io';
```

### 6. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 🔐 Auth & Role Logic

| Role | Access | Restrictions |
|---|---|---|
| **Admin** | Full dashboard, all pages | None |
| **Staff** | `/staff/orders` only | Only sees orders from assigned stores — enforced at the Supabase query level, not just UI |

Staff store assignment is managed by admins via the Staff page → "Assign Stores" button.

---

## 🗃️ Database Schema

### Tables

| Table | Purpose |
|---|---|
| `profiles` | Extends `auth.users` with name, role, avatar |
| `stores` | Etsy store records |
| `staff_stores` | Junction: which staff can access which stores |
| `orders` | Main order records with Etsy-style status |
| `order_items` | Line items per order (size, color, font) |
| `personalization_names` | Multiple names per order item |
| `shipping` | Shipping address per order |
| `inventory` | Per-store product inventory |
| `expenses` | Per-store expense tracking |

### Order statuses

```
created → pre_transit → in_transit → delivered → completed
```

---

## 🎨 Design System

- **Font**: DM Sans + DM Mono
- **Glass surfaces**: `backdrop-blur-[24px]` + semi-transparent backgrounds
- **Accent**: Indigo (#4f46e5)
- **Border radius**: 10–24px depending on component tier
- **Theme**: Light/dark with CSS class toggle, persisted in localStorage

---

## 📦 Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Auth + DB | Supabase |
| Styling | Tailwind CSS |
| Charts | Recharts |
| Language | TypeScript |
| State | React state + Context |

---

## 🔧 Extending

### Add a new page (admin)
1. Create `app/(admin)/your-page/page.tsx`
2. Add a nav item to `components/Sidebar.tsx` in `ADMIN_NAV`

### Add a new table
1. Add the `CREATE TABLE` + RLS policies to `supabase/schema.sql`
2. Add types to `/types/`
3. Add query functions to `lib/queries.ts`

### Invite staff via Supabase
1. Supabase → Authentication → Invite User
2. User signs up and a profile is auto-created via the trigger
3. Admin assigns stores in the Staff page
