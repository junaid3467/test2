'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Header from '@/components/Header';
import Modal, { FieldGroup, FormField, inputCls, selectCls, BtnPrimary, BtnSecondary } from '@/components/Modal';
import { fetchStores, fetchOrders, createStore, updateStore, deleteStore } from '@/lib/queries';
import type { Store } from '@/types/store';
import type { Order } from '@/types/order';

export default function StoresPage() {
  const [stores, setStores] = useState<Store[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Store | null>(null);

  const [fName, setFName] = useState('');
  const [fHandle, setFHandle] = useState('');
  const [fUrl, setFUrl] = useState('');
  const [fEmoji, setFEmoji] = useState('🏪');
  const [fStatus, setFStatus] = useState<'active' | 'inactive'>('active');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [storesData, ordersData] = await Promise.all([fetchStores(), fetchOrders()]);
      setStores(storesData);
      setOrders(ordersData);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setEditing(null);
    setFName(''); setFHandle(''); setFUrl(''); setFEmoji('🏪'); setFStatus('active');
    setModalOpen(true);
  };

  const openEdit = (store: Store) => {
    setEditing(store);
    setFName(store.name); setFHandle(store.handle); setFUrl(store.url ?? '');
    setFEmoji(store.emoji); setFStatus(store.status);
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!fName.trim()) return;
    setSaving(true);
    try {
      const payload = { name: fName, handle: fHandle, url: fUrl, emoji: fEmoji || '🏪', status: fStatus };
      if (editing) {
        await updateStore(editing.id, payload);
      } else {
        await createStore(payload);
      }
      setModalOpen(false);
      load();
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this store? This will also affect related orders.')) return;
    await deleteStore(id);
    load();
  };

  const handleToggleStatus = async (store: Store) => {
    await updateStore(store.id, { status: store.status === 'active' ? 'inactive' : 'active' });
    load();
  };

  const storeStats = (storeId: string) => {
    const storeOrders = orders.filter(o => o.store_id === storeId);
    const revenue = storeOrders
      .filter(o => o.status === 'completed')
      .reduce((s, o) => s + o.total, 0);
    return { orders: storeOrders.length, revenue };
  };

  if (loading) {
    return (
      <div>
        <Header title="Stores" />
        <div className="p-6 grid grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-52 rounded-[16px] bg-black/[0.03] dark:bg-white/[0.03] animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header title="Stores" subtitle={`${stores.length} stores · ${stores.filter(s => s.status === 'active').length} active`} />

      <div className="p-6">
        <div className="flex justify-end mb-4">
          <button onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2.5 text-[13px] font-[600] text-white bg-indigo-600 hover:bg-indigo-700 rounded-[10px] shadow-sm transition-all">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
            Add Store
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {stores.map(store => {
            const { orders: orderCount, revenue } = storeStats(store.id);
            return (
              <div key={store.id}
                className="rounded-[16px] p-5 bg-white/70 dark:bg-[#18181f]/70 backdrop-blur-[24px] border border-black/[0.07] dark:border-white/[0.07] shadow-card">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="text-3xl">{store.emoji}</div>
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-[600]
                    ${store.status === 'active'
                      ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      : 'bg-gray-100 dark:bg-gray-500/10 text-gray-500 dark:text-gray-400'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${store.status === 'active' ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                    {store.status === 'active' ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <p className="text-[15px] font-[700] text-[#111115] dark:text-[#f0f0f8] mb-0.5">{store.name}</p>
                <p className="text-[12px] text-[#adadb8] mb-4">{store.handle}</p>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-3 mb-4 p-3 rounded-[10px] bg-black/[0.02] dark:bg-white/[0.02]">
                  <div>
                    <p className="text-[11px] text-[#adadb8] mb-0.5">Orders</p>
                    <p className="text-[16px] font-[700] text-[#111115] dark:text-[#f0f0f8]">{orderCount}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-[#adadb8] mb-0.5">Revenue</p>
                    <p className="text-[16px] font-[700] text-[#111115] dark:text-[#f0f0f8]">${revenue.toLocaleString()}</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-3 border-t border-black/[0.06] dark:border-white/[0.06]">
                  <button onClick={() => openEdit(store)}
                    className="flex-1 py-1.5 text-[12px] font-[500] rounded-[8px] text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 transition-all">
                    Edit
                  </button>
                  <button onClick={() => handleToggleStatus(store)}
                    className={`flex-1 py-1.5 text-[12px] font-[500] rounded-[8px] transition-all
                      ${store.status === 'active'
                        ? 'text-amber-600 bg-amber-50 dark:bg-amber-500/10 hover:bg-amber-100'
                        : 'text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100'}`}>
                    {store.status === 'active' ? 'Deactivate' : 'Activate'}
                  </button>
                  <button onClick={() => handleDelete(store.id)}
                    className="py-1.5 px-3 text-[12px] font-[500] rounded-[8px] text-red-500 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 transition-all">
                    Del
                  </button>
                </div>
              </div>
            );
          })}

          {/* Add new card */}
          <button onClick={openCreate}
            className="rounded-[16px] p-5 border-2 border-dashed border-black/[0.10] dark:border-white/[0.10]
              flex flex-col items-center justify-center gap-2 min-h-[200px]
              text-[#adadb8] hover:text-indigo-500 hover:border-indigo-400
              hover:bg-indigo-50 dark:hover:bg-indigo-500/5 transition-all duration-150">
            <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 5v14M5 12h14"/></svg>
            <span className="text-[13px] font-[500]">Add New Store</span>
          </button>
        </div>
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Store' : 'Add Store'}
        footer={
          <>
            <BtnSecondary onClick={() => setModalOpen(false)}>Cancel</BtnSecondary>
            <BtnPrimary onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save Store'}</BtnPrimary>
          </>
        }
      >
        <FieldGroup>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <FormField label="Store Name">
                <input className={inputCls} value={fName} onChange={e => setFName(e.target.value)} placeholder="My Etsy Store" />
              </FormField>
            </div>
            <FormField label="Handle (@)">
              <input className={inputCls} value={fHandle} onChange={e => setFHandle(e.target.value)} placeholder="@mystore" />
            </FormField>
            <FormField label="Emoji">
              <input className={inputCls} value={fEmoji} onChange={e => setFEmoji(e.target.value)} placeholder="🏪" />
            </FormField>
            <div className="col-span-2">
              <FormField label="Etsy URL">
                <input className={inputCls} value={fUrl} onChange={e => setFUrl(e.target.value)} placeholder="https://etsy.com/shop/..." />
              </FormField>
            </div>
            <FormField label="Status">
              <select className={selectCls} value={fStatus} onChange={e => setFStatus(e.target.value as 'active' | 'inactive')}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </FormField>
          </div>
        </FieldGroup>
      </Modal>
    </div>
  );
}
