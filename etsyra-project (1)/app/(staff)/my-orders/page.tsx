'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Header from '@/components/Header';
import Table, { type Column } from '@/components/Table';
import Modal, { BtnPrimary, BtnSecondary } from '@/components/Modal';
import { fetchOrders, updateOrderStatus, fetchStores, type OrderFilters } from '@/lib/queries';
import { useAuth } from '@/lib/authContext';
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
  created: 'Created',
  pre_transit: 'Pre-Transit',
  in_transit: 'In Transit',
  delivered: 'Delivered',
  completed: 'Completed',
};

const ALL_STATUSES = Object.keys(STATUS_LABELS) as OrderStatus[];

function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-[600] ${STATUS_COLORS[status]}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
      {STATUS_LABELS[status]}
    </span>
  );
}

export default function StaffOrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);

  const [filterStatus, setFilterStatus] = useState('');
  const [filterStore, setFilterStore] = useState('');

  const [statusModal, setStatusModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [newStatus, setNewStatus] = useState<OrderStatus>('created');
  const [saving, setSaving] = useState(false);

  // Staff can only see their assigned stores — enforced in the query
  const allowedStoreIds = user?.assigned_stores ?? [];

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const filters: OrderFilters = {
        allowed_store_ids: allowedStoreIds,
      };
      if (filterStatus) filters.status = filterStatus as OrderStatus;
      if (filterStore) filters.store_id = filterStore;

      const [ordersData, storesData] = await Promise.all([
        fetchOrders(filters),
        fetchStores(),
      ]);

      setOrders(ordersData);
      // Show only allowed stores in the filter dropdown
      setStores(storesData.filter(s => allowedStoreIds.includes(s.id)));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [user, filterStatus, filterStore]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load(); }, [load]);

  const openStatusModal = (order: Order) => {
    setSelectedOrder(order);
    setNewStatus(order.status);
    setStatusModal(true);
  };

  const handleStatusUpdate = async () => {
    if (!selectedOrder) return;
    setSaving(true);
    try {
      await updateOrderStatus(selectedOrder.id, newStatus);
      setStatusModal(false);
      load();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const storeName = (id: string) => stores.find(s => s.id === id)?.name ?? id;

  const columns: Column<Order>[] = [
    {
      key: 'etsy_order_id', header: 'Order ID',
      render: o => <span className="font-mono text-[11.5px] text-[#6b6b78]">#{o.etsy_order_id}</span>
    },
    {
      key: 'customer_name', header: 'Customer',
      render: o => <span className="font-[500]">{o.customer_name}</span>
    },
    {
      key: 'store_id', header: 'Store',
      render: o => <span className="text-[12px] text-[#6b6b78]">{storeName(o.store_id)}</span>
    },
    {
      key: 'total', header: 'Total',
      render: o => <span className="font-[600]">${o.total.toFixed(2)}</span>
    },
    {
      key: 'order_date', header: 'Date',
      render: o => (
        <span className="text-[12px] text-[#6b6b78]">
          {new Date(o.order_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })}
        </span>
      )
    },
    {
      key: 'is_gift', header: 'Gift',
      render: o => o.is_gift ? <span className="text-rose-500">🎁</span> : <span className="text-[#adadb8]">—</span>
    },
    {
      key: 'status', header: 'Status',
      render: o => <StatusBadge status={o.status} />
    },
    {
      key: 'actions', header: '',
      render: o => (
        <button
          onClick={e => { e.stopPropagation(); openStatusModal(o); }}
          className="px-2.5 py-1 text-[11.5px] font-[500] rounded-[6px]
            text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10
            hover:bg-indigo-100 transition-all whitespace-nowrap"
        >
          Update Status
        </button>
      )
    },
  ];

  return (
    <div>
      <Header
        title="My Orders"
        subtitle={`${orders.length} orders · ${allowedStoreIds.length} store${allowedStoreIds.length !== 1 ? 's' : ''} assigned`}
      />

      <div className="p-6 space-y-4">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2.5 p-4
          bg-white/60 dark:bg-[#18181f]/60 backdrop-blur-[12px]
          border border-black/[0.06] dark:border-white/[0.06]
          rounded-[14px] shadow-sm">

          {/* Store filter (only assigned stores) */}
          {stores.length > 1 && (
            <div className="relative">
              <select
                value={filterStore}
                onChange={e => setFilterStore(e.target.value)}
                className="text-[12.5px] pl-3 pr-8 py-2 rounded-[9px]
                  bg-white dark:bg-[#1c1c26] border border-black/[0.08] dark:border-white/[0.08]
                  text-[#111115] dark:text-[#f0f0f8] appearance-none focus:outline-none shadow-sm"
              >
                <option value="">All my stores</option>
                {stores.map(s => (
                  <option key={s.id} value={s.id}>{s.emoji} {s.name}</option>
                ))}
              </select>
              <svg className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#adadb8] pointer-events-none"
                viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 9l6 6 6-6"/>
              </svg>
            </div>
          )}

          {/* Status filter */}
          <div className="relative">
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="text-[12.5px] pl-3 pr-8 py-2 rounded-[9px]
                bg-white dark:bg-[#1c1c26] border border-black/[0.08] dark:border-white/[0.08]
                text-[#111115] dark:text-[#f0f0f8] appearance-none focus:outline-none shadow-sm"
            >
              <option value="">All statuses</option>
              {ALL_STATUSES.map(s => (
                <option key={s} value={s}>{STATUS_LABELS[s]}</option>
              ))}
            </select>
            <svg className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#adadb8] pointer-events-none"
              viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 9l6 6 6-6"/>
            </svg>
          </div>

          {(filterStatus || filterStore) && (
            <button
              onClick={() => { setFilterStatus(''); setFilterStore(''); }}
              className="px-3 py-2 text-[12px] font-[500] text-[#6b6b78] hover:text-red-500 transition-colors"
            >
              Clear
            </button>
          )}
        </div>

        {/* Info banner for staff */}
        {allowedStoreIds.length === 0 && (
          <div className="p-4 rounded-[12px] bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20">
            <p className="text-[13px] text-amber-700 dark:text-amber-400">
              ⚠️ You have no stores assigned yet. Contact your admin to get access.
            </p>
          </div>
        )}

        <Table
          columns={columns}
          data={orders}
          loading={loading}
          keyExtractor={o => o.id}
          emptyMessage={
            allowedStoreIds.length === 0
              ? 'No stores assigned — contact your admin'
              : 'No orders found for your stores'
          }
        />
      </div>

      {/* Status update modal */}
      <Modal
        open={statusModal}
        onClose={() => setStatusModal(false)}
        title="Update Order Status"
        size="sm"
        footer={
          <>
            <BtnSecondary onClick={() => setStatusModal(false)}>Cancel</BtnSecondary>
            <BtnPrimary onClick={handleStatusUpdate} disabled={saving}>
              {saving ? 'Saving…' : 'Update'}
            </BtnPrimary>
          </>
        }
      >
        {selectedOrder && (
          <div className="space-y-4">
            <div className="p-3 rounded-[10px] bg-black/[0.02] dark:bg-white/[0.02]">
              <p className="text-[11.5px] text-[#adadb8] mb-0.5">Order</p>
              <p className="text-[13px] font-[600] text-[#111115] dark:text-[#f0f0f8]">
                #{selectedOrder.etsy_order_id}
              </p>
              <p className="text-[12px] text-[#6b6b78]">{selectedOrder.customer_name}</p>
            </div>

            <div>
              <p className="text-[11.5px] font-[600] text-[#6b6b78] mb-3">Select new status</p>
              <div className="space-y-2">
                {ALL_STATUSES.map(status => (
                  <label key={status}
                    className={`flex items-center gap-3 p-3 rounded-[10px] cursor-pointer border transition-all duration-150
                      ${newStatus === status
                        ? 'border-indigo-500/40 bg-indigo-50 dark:bg-indigo-500/10'
                        : 'border-black/[0.06] dark:border-white/[0.06] hover:bg-black/[0.02] dark:hover:bg-white/[0.02]'}`}
                  >
                    <input
                      type="radio"
                      name="status"
                      value={status}
                      checked={newStatus === status}
                      onChange={() => setNewStatus(status)}
                      className="accent-indigo-600"
                    />
                    <StatusBadge status={status} />
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
