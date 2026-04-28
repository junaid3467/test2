'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Header from '@/components/Header';
import FilterBar from '@/components/FilterBar';
import Table, { type Column } from '@/components/Table';
import Modal, { FieldGroup, FormField, inputCls, selectCls, BtnPrimary, BtnSecondary } from '@/components/Modal';
import {
  fetchOrders, fetchStores, createOrder, updateOrder, updateOrderStatus, deleteOrder,
  upsertOrderItems, type OrderFilters,
} from '@/lib/queries';
import type { Order, OrderStatus } from '@/types/order';
import type { Store } from '@/types/store';

const STATUS_COLORS: Record<OrderStatus, string> = {
  created: 'bg-gray-100 dark:bg-gray-500/10 text-gray-600 dark:text-gray-400',
  pre_transit: 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400',
  in_transit: 'bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400',
  delivered: 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
  completed: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
};

const STATUS_LABELS: Record<OrderStatus, string> = {
  created: 'Created', pre_transit: 'Pre-Transit', in_transit: 'In Transit',
  delivered: 'Delivered', completed: 'Completed',
};

function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-[600] ${STATUS_COLORS[status]}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
      {STATUS_LABELS[status]}
    </span>
  );
}

interface OrderItem {
  title: string;
  quantity: number;
  size: string;
  color: string;
  font_style: string;
  names: string[];
}

const BLANK_ITEM: OrderItem = {
  title: '', quantity: 1, size: '40oz', color: '', font_style: 'M.5', names: [''],
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedStore, setSelectedStore] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);

  // Form state
  const [formStore, setFormStore] = useState('');
  const [formCustomer, setFormCustomer] = useState('');
  const [formTotal, setFormTotal] = useState('');
  const [formStatus, setFormStatus] = useState<OrderStatus>('created');
  const [formDate, setFormDate] = useState('');
  const [formGift, setFormGift] = useState(false);
  const [formEtsyId, setFormEtsyId] = useState('');
  const [items, setItems] = useState<OrderItem[]>([{ ...BLANK_ITEM }]);
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const filters: OrderFilters = {};
      if (selectedStatus) filters.status = selectedStatus as OrderStatus;
      if (selectedStore) filters.store_id = selectedStore;
      if (dateFrom) filters.date_from = dateFrom;
      if (dateTo) filters.date_to = dateTo;

      const [ordersData, storesData] = await Promise.all([
        fetchOrders(filters),
        stores.length ? Promise.resolve(stores) : fetchStores(),
      ]);
      setOrders(ordersData);
      if (!stores.length) setStores(storesData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [selectedStore, selectedStatus, dateFrom, dateTo]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { loadData(); }, [loadData]);

  const openCreate = () => {
    setEditingOrder(null);
    setFormStore(stores[0]?.id ?? '');
    setFormCustomer('');
    setFormTotal('');
    setFormStatus('created');
    setFormDate(new Date().toISOString().slice(0, 10));
    setFormGift(false);
    setFormEtsyId('');
    setItems([{ ...BLANK_ITEM }]);
    setModalOpen(true);
  };

  const openEdit = (order: Order) => {
    setEditingOrder(order);
    setFormStore(order.store_id);
    setFormCustomer(order.customer_name);
    setFormTotal(String(order.total));
    setFormStatus(order.status);
    setFormDate(order.order_date.slice(0, 10));
    setFormGift(order.is_gift);
    setFormEtsyId(order.etsy_order_id);
    setItems([{ ...BLANK_ITEM }]);
    setModalOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        store_id: formStore,
        customer_name: formCustomer,
        total: parseFloat(formTotal),
        status: formStatus,
        order_date: formDate,
        is_gift: formGift,
        etsy_order_id: formEtsyId || `ETY-${Date.now()}`,
      };

      let orderId: string;
      if (editingOrder) {
        const updated = await updateOrder(editingOrder.id, payload);
        orderId = updated.id;
      } else {
        const created = await createOrder(payload);
        orderId = created.id;
      }
      await upsertOrderItems(orderId, items);
      setModalOpen(false);
      loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this order?')) return;
    await deleteOrder(id);
    loadData();
  };

  const updateItem = (idx: number, field: keyof OrderItem, value: unknown) => {
    setItems(prev => prev.map((it, i) => i === idx ? { ...it, [field]: value } : it));
  };

  const addName = (itemIdx: number) => {
    setItems(prev => prev.map((it, i) => i === itemIdx ? { ...it, names: [...it.names, ''] } : it));
  };

  const updateName = (itemIdx: number, nameIdx: number, value: string) => {
    setItems(prev => prev.map((it, i) => i === itemIdx
      ? { ...it, names: it.names.map((n, ni) => ni === nameIdx ? value : n) }
      : it
    ));
  };

  const storeName = (id: string) => stores.find(s => s.id === id)?.name ?? id;

  const columns: Column<Order>[] = [
    { key: 'etsy_order_id', header: 'Order ID',
      render: o => <span className="font-mono text-[11.5px] text-[#6b6b78]">#{o.etsy_order_id}</span> },
    { key: 'customer_name', header: 'Customer',
      render: o => <span className="font-[500]">{o.customer_name}</span> },
    { key: 'store_id', header: 'Store',
      render: o => <span className="text-[12px] text-[#6b6b78]">{storeName(o.store_id)}</span> },
    { key: 'total', header: 'Total',
      render: o => <span className="font-[600]">${o.total.toFixed(2)}</span> },
    { key: 'order_date', header: 'Date',
      render: o => <span className="text-[12px] text-[#6b6b78]">{new Date(o.order_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })}</span> },
    { key: 'status', header: 'Status',
      render: o => <StatusBadge status={o.status} /> },
    { key: 'is_gift', header: 'Gift',
      render: o => o.is_gift ? <span className="text-rose-500">🎁 Yes</span> : <span className="text-[#adadb8]">—</span> },
    { key: 'actions', header: '',
      render: o => (
        <div className="flex gap-1.5 justify-end">
          <button onClick={e => { e.stopPropagation(); openEdit(o); }}
            className="px-2.5 py-1 text-[11.5px] font-[500] rounded-[6px] text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 transition-all">
            Edit
          </button>
          <button onClick={e => { e.stopPropagation(); handleDelete(o.id); }}
            className="px-2.5 py-1 text-[11.5px] font-[500] rounded-[6px] text-red-500 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 transition-all">
            Del
          </button>
        </div>
      )
    },
  ];

  return (
    <div>
      <Header title="Orders" subtitle={`${orders.length} orders`} />

      <div className="p-6 space-y-4">
        <div className="flex items-center gap-3">
          <FilterBar
            stores={stores}
            selectedStore={selectedStore}
            onStoreChange={setSelectedStore}
            selectedStatus={selectedStatus}
            onStatusChange={setSelectedStatus}
            dateFrom={dateFrom}
            onDateFromChange={setDateFrom}
            dateTo={dateTo}
            onDateToChange={setDateTo}
          />
          <button onClick={openCreate}
            className="ml-auto flex items-center gap-2 px-4 py-2.5 text-[13px] font-[600] text-white
              bg-indigo-600 hover:bg-indigo-700 rounded-[10px] shadow-sm transition-all flex-shrink-0">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
            Add Order
          </button>
        </div>

        <Table
          columns={columns}
          data={orders}
          loading={loading}
          keyExtractor={o => o.id}
          emptyMessage="No orders match the current filters"
        />
      </div>

      {/* Order Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingOrder ? 'Edit Order' : 'New Order'}
        size="lg"
        footer={
          <>
            <BtnSecondary onClick={() => setModalOpen(false)}>Cancel</BtnSecondary>
            <BtnPrimary onClick={handleSave} disabled={saving}>
              {saving ? 'Saving…' : 'Save Order'}
            </BtnPrimary>
          </>
        }
      >
        <FieldGroup>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Etsy Order ID">
              <input className={inputCls} value={formEtsyId} onChange={e => setFormEtsyId(e.target.value)} placeholder="ETY-XXXX (auto-generated)" />
            </FormField>
            <FormField label="Store">
              <select className={selectCls} value={formStore} onChange={e => setFormStore(e.target.value)}>
                {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </FormField>
            <FormField label="Customer Name">
              <input className={inputCls} value={formCustomer} onChange={e => setFormCustomer(e.target.value)} placeholder="Jane Smith" />
            </FormField>
            <FormField label="Total ($)">
              <input type="number" className={inputCls} value={formTotal} onChange={e => setFormTotal(e.target.value)} placeholder="0.00" step="0.01" />
            </FormField>
            <FormField label="Status">
              <select className={selectCls} value={formStatus} onChange={e => setFormStatus(e.target.value as OrderStatus)}>
                {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </FormField>
            <FormField label="Order Date">
              <input type="date" className={inputCls} value={formDate} onChange={e => setFormDate(e.target.value)} />
            </FormField>
          </div>

          <label className="flex items-center gap-2.5 cursor-pointer mt-1">
            <input type="checkbox" checked={formGift} onChange={e => setFormGift(e.target.checked)}
              className="w-4 h-4 rounded accent-indigo-600" />
            <span className="text-[13px] text-[#6b6b78] dark:text-[#8888a0]">Is a gift order 🎁</span>
          </label>

          {/* Items section */}
          <div className="border-t border-black/[0.07] dark:border-white/[0.07] pt-4 mt-1">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[12.5px] font-[700] text-[#111115] dark:text-[#f0f0f8] uppercase tracking-[0.5px]">Order Items</span>
              <button onClick={() => setItems(prev => [...prev, { ...BLANK_ITEM }])}
                className="text-[12px] font-[500] text-indigo-600 dark:text-indigo-400 hover:underline">
                + Add item
              </button>
            </div>

            <div className="space-y-4">
              {items.map((item, idx) => (
                <div key={idx} className="p-4 rounded-[12px] bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.06] dark:border-white/[0.06] space-y-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[12px] font-[600] text-[#6b6b78]">Item {idx + 1}</span>
                    {items.length > 1 && (
                      <button onClick={() => setItems(prev => prev.filter((_, i) => i !== idx))}
                        className="text-[11px] text-red-500 hover:underline">Remove</button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="col-span-2">
                      <FormField label="Product Title">
                        <input className={inputCls} value={item.title} onChange={e => updateItem(idx, 'title', e.target.value)} placeholder="Personalized 40oz Tumbler" />
                      </FormField>
                    </div>
                    <FormField label="Qty">
                      <input type="number" className={inputCls} value={item.quantity} onChange={e => updateItem(idx, 'quantity', parseInt(e.target.value))} min={1} />
                    </FormField>
                    <FormField label="Size">
                      <select className={selectCls} value={item.size} onChange={e => updateItem(idx, 'size', e.target.value)}>
                        <option value="40oz">40oz</option>
                        <option value="20oz">20oz</option>
                      </select>
                    </FormField>
                    <FormField label="Color">
                      <input className={inputCls} value={item.color} onChange={e => updateItem(idx, 'color', e.target.value)} placeholder="Lilac" />
                    </FormField>
                    <FormField label="Font Style">
                      <input className={inputCls} value={item.font_style} onChange={e => updateItem(idx, 'font_style', e.target.value)} placeholder="M.5" />
                    </FormField>
                  </div>

                  {/* Personalization names */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[11px] font-[600] text-[#adadb8] uppercase tracking-[0.4px]">Names</span>
                      <button onClick={() => addName(idx)} className="text-[11px] text-indigo-500 hover:underline">+ Add name</button>
                    </div>
                    <div className="space-y-1.5">
                      {item.names.map((name, ni) => (
                        <div key={ni} className="flex gap-2">
                          <input
                            className={`${inputCls} flex-1`}
                            value={name}
                            onChange={e => updateName(idx, ni, e.target.value)}
                            placeholder={`Name ${ni + 1}`}
                          />
                          {item.names.length > 1 && (
                            <button onClick={() => setItems(prev => prev.map((it, i) => i === idx
                              ? { ...it, names: it.names.filter((_, nj) => nj !== ni) }
                              : it
                            ))} className="text-red-400 hover:text-red-600 px-1">×</button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </FieldGroup>
      </Modal>
    </div>
  );
}
