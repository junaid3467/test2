export type OrderStatus =
  | 'created'
  | 'pre_transit'
  | 'in_transit'
  | 'delivered'
  | 'completed';

export interface PersonalizationName {
  id: string;
  order_item_id: string;
  name: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  title: string;
  quantity: number;
  size: '40oz' | '20oz' | string;
  color: string;
  font_style: string;
  personalization_names?: PersonalizationName[];
}

export interface Shipping {
  id: string;
  order_id: string;
  recipient: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  verified: boolean;
}

export interface Order {
  id: string;
  etsy_order_id: string;
  store_id: string;
  customer_name: string;
  total: number;
  status: OrderStatus;
  order_date: string;
  is_gift: boolean;
  order_items?: OrderItem[];
  shipping?: Shipping;
}

export interface OrderWithDetails extends Order {
  order_items: (OrderItem & { personalization_names: PersonalizationName[] })[];
  shipping: Shipping | null;
}
