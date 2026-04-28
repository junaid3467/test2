'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Header from '@/components/Header';
import Table, { type Column } from '@/components/Table';
import Modal, { FieldGroup, FormField, inputCls, selectCls, BtnPrimary, BtnSecondary } from '@/components/Modal';
import { fetchInventory, fetchStores, upsertInventoryItem, deleteInventoryItem } from '@/lib/queries';
import type { InventoryItem } from '@/types/store';
import type { Store } from '@/types/store';

const STATUS_MAP = {
  in_stock: { label: 'In Stock', cls: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' },
  low_stock: { label: 'Low Stock', cls: 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400' },
  out_of_stock: { label: 'Out of Stock', cls: 'bg-red-50 dark:bg-red-500/10 text-red-500 dark:text-red-400' },
};

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStore, setSelectedStore] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<InventoryItem | null>(null);

  const [fTitle, setFTitle] = useState('');
  const [fSku, setFSku] = useState('');
  const [fQty, setFQty] = useState('');
  const [fPrice, setFPrice] = useState('');
  const [fCost, setFCost] = useState('');
  const [fStatus, setFStatus] = useState<InventoryItem['status']>('in_stock');
  const [fStore, setFStore] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [inv, strs] = await Promise.all([
        fetchInventory(selectedStore || undefined),
        stores.length ? Promise.resolve(stores) : fetchStores(),
      ]);
      setItems(inv);
      if (!stores.length) setStores(strs);
    } catch(e) { console.error(e); }
    finally { setLoading(false); }
  }, [selectedStore]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setEditing(null);
    setFTitle(''); setFSku(''); setFQty('1'); setFPrice(''); setFCost('');
    setFStatus('in_stock'); setFStore(stores[0]?.id ?? '');
    setModalOpen(true);
  };

  const openEdit = (item: InventoryItem) => {
    setEditing(item);
    setFTitle(item.title); setFSku(item.sku ?? '');
    setFQty(String(item.quantity)); setFPrice(String(item.price));
    setFCost(String(item.cost)); setFStatus(item.status); setFStore(item.store_id);
    setModalOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await upsertInventoryItem({
        id: editing?.id,
        store_id: fStore,
        title: fTitle,
        sku: fSku,
        quantity: parseInt(fQty),
        price: parseFloat(fPrice),
        cost: parseFloat(fCost),
        status: fStatus,
      });
      setModalOpen(false);
      load();
    } catch(e) { console.error(e); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this item?')) return;
    await deleteInventoryItem(id);
    load();
  };

  const storeName = (id: string) => stores.find(s => s.id === id)?.name ?? id;

  const columns: Column<InventoryItem>[] = [
    { key: 'title', header: 'Product', render: i => <span className="font-[500]">{i.title}</span> },
    { key: 'sku', header: 'SKU', render: i => <span className="font-mono text-[11.5px] text-[#6b6b78]">{i.sku ?? '—'}</span> },
    { key: 'store_id', header: 'Store', render: i => <span className="text-[12px] text-[#6b6b78]">{storeName(i.store_id)}</span> },
    { key: 'quantity', header: 'Qty', render: i => <span className="font-[600]">{i.quantity}</span> },
    { key: 'price', header: 'Price', render: i => <span>${i.price.toFixed(2)}</span> },
    { key: 'cost', header: 'Cost', render: i => <span className="text-[#6b6b78]">${i.cost.toFixed(2)}</span> },
    { key: 'status', header: 'Status', render: i => {
      const s = STATUS_MAP[i.status];
      return <span className={`inline-flex px-2.5 py-1 rounded-full text-[11px] font-[600] ${s.cls}`}>{s.label}</span>;
    }},
    { key: 'actions', header: '', render: i => (
      <div className="flex gap-1.5 justify-end">
        <button onClick={() => openEdit(i)} className="px-2.5 py-1 text-[11.5px] rounded-[6px] text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 transition-all">Edit</button>
        <button onClick={() => handleDelete(i.id)} className="px-2.5 py-1 text-[11.5px] rounded-[6px] text-red-500 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 transition-all">Del</button>
      </div>
    )},
  ];

  return (
    <div>
      <Header title="Inventory" subtitle={`${items.length} products`} />

      <div className="p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <select value={selectedStore} onChange={e => setSelectedStore(e.target.value)}
              className="text-[12.5px] pl-3 pr-8 py-2 rounded-[9px] bg-white dark:bg-[#1c1c26] border border-black/[0.08] dark:border-white/[0.08] text-[#111115] dark:text-[#f0f0f8] appearance-none shadow-sm focus:outline-none">
              <option value="">All stores</option>
              {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <svg className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#adadb8] pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6"/></svg>
          </div>
          <button onClick={openCreate}
            className="ml-auto flex items-center gap-2 px-4 py-2.5 text-[13px] font-[600] text-white bg-indigo-600 hover:bg-indigo-700 rounded-[10px] shadow-sm transition-all flex-shrink-0">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
            Add Product
          </button>
        </div>
        <Table columns={columns} data={items} loading={loading} keyExtractor={i => i.id} emptyMessage="No inventory items" />
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Product' : 'Add Product'}
        footer={<><BtnSecondary onClick={() => setModalOpen(false)}>Cancel</BtnSecondary><BtnPrimary onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save'}</BtnPrimary></>}>
        <FieldGroup>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Title">
              <input className={inputCls} value={fTitle} onChange={e => setFTitle(e.target.value)} placeholder="Product name" />
            </FormField>
            <FormField label="SKU">
              <input className={inputCls} value={fSku} onChange={e => setFSku(e.target.value)} placeholder="SKU-001" />
            </FormField>
            <FormField label="Store">
              <select className={selectCls} value={fStore} onChange={e => setFStore(e.target.value)}>
                {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </FormField>
            <FormField label="Status">
              <select className={selectCls} value={fStatus} onChange={e => setFStatus(e.target.value as InventoryItem['status'])}>
                <option value="in_stock">In Stock</option>
                <option value="low_stock">Low Stock</option>
                <option value="out_of_stock">Out of Stock</option>
              </select>
            </FormField>
            <FormField label="Quantity">
              <input type="number" className={inputCls} value={fQty} onChange={e => setFQty(e.target.value)} min={0} />
            </FormField>
            <FormField label="Price ($)">
              <input type="number" className={inputCls} value={fPrice} onChange={e => setFPrice(e.target.value)} step="0.01" />
            </FormField>
            <FormField label="Cost ($)">
              <input type="number" className={inputCls} value={fCost} onChange={e => setFCost(e.target.value)} step="0.01" />
            </FormField>
          </div>
        </FieldGroup>
      </Modal>
    </div>
  );
}
