export interface Store {
  id: string;
  name: string;
  handle: string;
  url?: string;
  emoji: string;
  status: 'active' | 'inactive';
  created_at?: string;
}

export interface InventoryItem {
  id: string;
  store_id: string;
  title: string;
  sku?: string;
  quantity: number;
  price: number;
  cost: number;
  status: 'in_stock' | 'low_stock' | 'out_of_stock';
  created_at?: string;
}

export interface Expense {
  id: string;
  store_id: string;
  description: string;
  amount: number;
  category: string;
  date: string;
}
