import { getSupabaseClient } from './supabaseClient';
import type { Order, OrderWithDetails, OrderStatus } from '@/types/order';
import type { AppUser } from '@/types/user';
import type { Store, InventoryItem, Expense } from '@/types/store';

// ─── AUTH ──────────────────────────────────────────────────────────────────
export async function getCurrentUser(): Promise<AppUser | null> {
  const supabase = getSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('*, staff_stores(store_id)')
    .eq('id', user.id)
    .single();

  if (!profile) return null;

  return {
    id: user.id,
    email: user.email!,
    name: profile.name,
    role: profile.role,
    avatar_url: profile.avatar_url,
    assigned_stores: profile.staff_stores?.map((s: { store_id: string }) => s.store_id) ?? [],
  };
}

export async function signIn(email: string, password: string) {
  const supabase = getSupabaseClient();
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signOut() {
  const supabase = getSupabaseClient();
  return supabase.auth.signOut();
}

// ─── ORDERS ────────────────────────────────────────────────────────────────
export interface OrderFilters {
  status?: OrderStatus;
  store_id?: string;
  date_from?: string;
  date_to?: string;
  allowed_store_ids?: string[]; // for staff restriction
}

export async function fetchOrders(filters: OrderFilters = {}): Promise<Order[]> {
  const supabase = getSupabaseClient();
  let query = supabase
    .from('orders')
    .select('*')
    .order('order_date', { ascending: false });

  if (filters.status) query = query.eq('status', filters.status);
  if (filters.store_id) query = query.eq('store_id', filters.store_id);
  if (filters.date_from) query = query.gte('order_date', filters.date_from);
  if (filters.date_to) query = query.lte('order_date', filters.date_to);

  // Staff restriction: enforce at query level
  if (filters.allowed_store_ids && filters.allowed_store_ids.length > 0) {
    query = query.in('store_id', filters.allowed_store_ids);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function fetchOrderWithDetails(orderId: string): Promise<OrderWithDetails | null> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      order_items (
        *,
        personalization_names (*)
      ),
      shipping (*)
    `)
    .eq('id', orderId)
    .single();

  if (error) throw error;
  return data;
}

export async function createOrder(order: Omit<Order, 'id'>) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('orders')
    .insert(order)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateOrder(id: string, updates: Partial<Order>) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('orders')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateOrderStatus(id: string, status: OrderStatus) {
  return updateOrder(id, { status });
}

export async function deleteOrder(id: string) {
  const supabase = getSupabaseClient();
  const { error } = await supabase.from('orders').delete().eq('id', id);
  if (error) throw error;
}

// ─── ORDER ITEMS ────────────────────────────────────────────────────────────
export async function upsertOrderItems(
  orderId: string,
  items: Array<{
    title: string;
    quantity: number;
    size: string;
    color: string;
    font_style: string;
    names: string[];
  }>
) {
  const supabase = getSupabaseClient();

  // Delete existing items
  await supabase.from('order_items').delete().eq('order_id', orderId);

  for (const item of items) {
    const { data: createdItem, error: itemError } = await supabase
      .from('order_items')
      .insert({
        order_id: orderId,
        title: item.title,
        quantity: item.quantity,
        size: item.size,
        color: item.color,
        font_style: item.font_style,
      })
      .select()
      .single();

    if (itemError) throw itemError;

    if (item.names.length > 0) {
      const { error: namesError } = await supabase
        .from('personalization_names')
        .insert(item.names.map(name => ({ order_item_id: createdItem.id, name })));
      if (namesError) throw namesError;
    }
  }
}

// ─── STORES ────────────────────────────────────────────────────────────────
export async function fetchStores(): Promise<Store[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('stores')
    .select('*')
    .order('name');
  if (error) throw error;
  return data ?? [];
}

export async function createStore(store: Omit<Store, 'id'>) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.from('stores').insert(store).select().single();
  if (error) throw error;
  return data;
}

export async function updateStore(id: string, updates: Partial<Store>) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.from('stores').update(updates).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteStore(id: string) {
  const supabase = getSupabaseClient();
  const { error } = await supabase.from('stores').delete().eq('id', id);
  if (error) throw error;
}

// ─── INVENTORY ──────────────────────────────────────────────────────────────
export async function fetchInventory(store_id?: string): Promise<InventoryItem[]> {
  const supabase = getSupabaseClient();
  let query = supabase.from('inventory').select('*').order('title');
  if (store_id) query = query.eq('store_id', store_id);
  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function upsertInventoryItem(item: Partial<InventoryItem> & { id?: string }) {
  const supabase = getSupabaseClient();
  if (item.id) {
    const { id, ...updates } = item;
    const { data, error } = await supabase.from('inventory').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data;
  }
  const { data, error } = await supabase.from('inventory').insert(item).select().single();
  if (error) throw error;
  return data;
}

export async function deleteInventoryItem(id: string) {
  const supabase = getSupabaseClient();
  const { error } = await supabase.from('inventory').delete().eq('id', id);
  if (error) throw error;
}

// ─── STAFF ──────────────────────────────────────────────────────────────────
export async function fetchStaff(): Promise<AppUser[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('*, staff_stores(store_id)')
    .order('name');
  if (error) throw error;
  return (data ?? []).map((p: Record<string, unknown> & { staff_stores?: { store_id: string }[] }) => ({
    id: p.id as string,
    email: p.email as string,
    name: p.name as string,
    role: p.role as 'admin' | 'staff',
    assigned_stores: p.staff_stores?.map((s) => s.store_id) ?? [],
  }));
}

export async function assignStaffStores(userId: string, storeIds: string[]) {
  const supabase = getSupabaseClient();
  await supabase.from('staff_stores').delete().eq('user_id', userId);
  if (storeIds.length > 0) {
    const { error } = await supabase
      .from('staff_stores')
      .insert(storeIds.map(store_id => ({ user_id: userId, store_id })));
    if (error) throw error;
  }
}

export async function deleteStaffMember(userId: string) {
  const supabase = getSupabaseClient();
  const { error } = await supabase.from('profiles').delete().eq('id', userId);
  if (error) throw error;
}

// ─── FINANCE / EXPENSES ────────────────────────────────────────────────────
export async function fetchExpenses(store_id?: string): Promise<Expense[]> {
  const supabase = getSupabaseClient();
  let query = supabase.from('expenses').select('*').order('date', { ascending: false });
  if (store_id) query = query.eq('store_id', store_id);
  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function upsertExpense(expense: Partial<Expense> & { id?: string }) {
  const supabase = getSupabaseClient();
  if (expense.id) {
    const { id, ...updates } = expense;
    const { data, error } = await supabase.from('expenses').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data;
  }
  const { data, error } = await supabase.from('expenses').insert(expense).select().single();
  if (error) throw error;
  return data;
}

export async function deleteExpense(id: string) {
  const supabase = getSupabaseClient();
  const { error } = await supabase.from('expenses').delete().eq('id', id);
  if (error) throw error;
}

// ─── DASHBOARD KPIs ────────────────────────────────────────────────────────
export interface DashboardFilters {
  store_id?: string;
  date_from?: string;
  date_to?: string;
}

export async function fetchDashboardKPIs(filters: DashboardFilters = {}) {
  const supabase = getSupabaseClient();

  let ordersQuery = supabase.from('orders').select('total, status, order_date, store_id');
  let expensesQuery = supabase.from('expenses').select('amount, store_id, date');

  if (filters.store_id) {
    ordersQuery = ordersQuery.eq('store_id', filters.store_id);
    expensesQuery = expensesQuery.eq('store_id', filters.store_id);
  }
  if (filters.date_from) {
    ordersQuery = ordersQuery.gte('order_date', filters.date_from);
    expensesQuery = expensesQuery.gte('date', filters.date_from);
  }
  if (filters.date_to) {
    ordersQuery = ordersQuery.lte('order_date', filters.date_to);
    expensesQuery = expensesQuery.lte('date', filters.date_to);
  }

  const [{ data: orders }, { data: expenses }] = await Promise.all([
    ordersQuery,
    expensesQuery,
  ]);

  const revenue = (orders ?? []).reduce((sum: number, o: { total: number }) => sum + (o.total ?? 0), 0);
  const totalExpenses = (expenses ?? []).reduce((sum: number, e: { amount: number }) => sum + (e.amount ?? 0), 0);
  const profit = revenue - totalExpenses;
  const orderCount = (orders ?? []).length;

  // Build chart data (group by date)
  const chartMap: Record<string, { revenue: number; orders: number }> = {};
  (orders ?? []).forEach((o: { order_date: string; total: number }) => {
    const day = o.order_date?.slice(0, 10) ?? '';
    if (!chartMap[day]) chartMap[day] = { revenue: 0, orders: 0 };
    chartMap[day].revenue += o.total ?? 0;
    chartMap[day].orders += 1;
  });

  const chartData = Object.entries(chartMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, vals]) => ({ date, ...vals }));

  return { revenue, profit, orderCount, chartData };
}
