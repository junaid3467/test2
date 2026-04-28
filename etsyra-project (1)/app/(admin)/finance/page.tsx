'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import Header from '@/components/Header';
import Table, { type Column } from '@/components/Table';
import Modal, { FieldGroup, FormField, inputCls, selectCls, BtnPrimary, BtnSecondary } from '@/components/Modal';
import { fetchOrders, fetchExpenses, fetchStores, upsertExpense, deleteExpense } from '@/lib/queries';
import type { Expense } from '@/types/store';
import type { Store } from '@/types/store';
import type { Order } from '@/types/order';

const CATEGORIES = ['Marketing', 'Shipping', 'Materials', 'Fees', 'Tools', 'Other'];

function KPICard({ label, value, sub, color }: { label: string; value: string; sub: string; color: string }) {
  return (
    <div className="rounded-[16px] p-5 bg-white/70 dark:bg-[#18181f]/70 backdrop-blur-[24px] border border-black/[0.07] dark:border-white/[0.07] shadow-card">
      <p className="text-[12px] font-[600] text-[#6b6b78] uppercase tracking-[0.4px] mb-3">{label}</p>
      <p className={`text-[26px] font-[700] tracking-tight ${color}`}>{value}</p>
      <p className="text-[11.5px] text-[#adadb8] mt-0.5">{sub}</p>
    </div>
  );
}

export default function FinancePage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStore, setSelectedStore] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);

  const [fStore, setFStore] = useState('');
  const [fDesc, setFDesc] = useState('');
  const [fAmount, setFAmount] = useState('');
  const [fCategory, setFCategory] = useState('Other');
  const [fDate, setFDate] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [ords, exps, strs] = await Promise.all([
        fetchOrders(selectedStore ? { store_id: selectedStore } : {}),
        fetchExpenses(selectedStore || undefined),
        stores.length ? Promise.resolve(stores) : fetchStores(),
      ]);
      setOrders(ords);
      setExpenses(exps);
      if (!stores.length) setStores(strs);
    } catch(e) { console.error(e); }
    finally { setLoading(false); }
  }, [selectedStore]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load(); }, [load]);

  const revenue = orders.reduce((s, o) => s + o.total, 0);
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const profit = revenue - totalExpenses;

  // Chart data: group by month
  const chartMap: Record<string, { revenue: number; expenses: number }> = {};
  orders.forEach(o => {
    const m = o.order_date.slice(0, 7);
    if (!chartMap[m]) chartMap[m] = { revenue: 0, expenses: 0 };
    chartMap[m].revenue += o.total;
  });
  expenses.forEach(e => {
    const m = e.date.slice(0, 7);
    if (!chartMap[m]) chartMap[m] = { revenue: 0, expenses: 0 };
    chartMap[m].expenses += e.amount;
  });
  const chartData = Object.entries(chartMap).sort(([a],[b]) => a.localeCompare(b)).map(([month, v]) => ({ month, ...v }));

  const openCreate = () => {
    setEditing(null);
    setFStore(stores[0]?.id ?? '');
    setFDesc(''); setFAmount(''); setFCategory('Other');
    setFDate(new Date().toISOString().slice(0, 10));
    setModalOpen(true);
  };

  const openEdit = (e: Expense) => {
    setEditing(e);
    setFStore(e.store_id); setFDesc(e.description); setFAmount(String(e.amount));
    setFCategory(e.category); setFDate(e.date.slice(0, 10));
    setModalOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await upsertExpense({ id: editing?.id, store_id: fStore, description: fDesc, amount: parseFloat(fAmount), category: fCategory, date: fDate });
      setModalOpen(false);
      load();
    } catch(e) { console.error(e); }
    finally { setSaving(false); }
  };

  const cols: Column<Expense>[] = [
    { key: 'description', header: 'Description', render: e => <span className="font-[500]">{e.description}</span> },
    { key: 'category', header: 'Category', render: e => (
      <span className="px-2.5 py-1 rounded-full text-[11px] font-[600] bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">{e.category}</span>
    )},
    { key: 'store_id', header: 'Store', render: e => <span className="text-[12px] text-[#6b6b78]">{stores.find(s => s.id === e.store_id)?.name ?? e.store_id}</span> },
    { key: 'amount', header: 'Amount', render: e => <span className="font-[600] text-red-500">${e.amount.toFixed(2)}</span> },
    { key: 'date', header: 'Date', render: e => <span className="text-[12px] text-[#6b6b78]">{new Date(e.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })}</span> },
    { key: 'actions', header: '', render: e => (
      <div className="flex gap-1.5 justify-end">
        <button onClick={() => openEdit(e)} className="px-2.5 py-1 text-[11.5px] rounded-[6px] text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100">Edit</button>
        <button onClick={async () => { if(confirm('Delete?')) { await deleteExpense(e.id); load(); }}} className="px-2.5 py-1 text-[11.5px] rounded-[6px] text-red-500 bg-red-50 dark:bg-red-500/10 hover:bg-red-100">Del</button>
      </div>
    )},
  ];

  return (
    <div>
      <Header title="Finance" subtitle="Revenue, expenses & profit" />
      <div className="p-6 space-y-5">
        {/* Store filter */}
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
            + Add Expense
          </button>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-3 gap-4">
          <KPICard label="Revenue" value={`$${revenue.toLocaleString()}`} sub="Total from orders" color="text-emerald-600 dark:text-emerald-400" />
          <KPICard label="Expenses" value={`$${totalExpenses.toLocaleString()}`} sub="Total costs" color="text-red-500" />
          <KPICard label="Profit" value={`$${profit.toLocaleString()}`} sub="Revenue minus expenses" color={profit >= 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-red-500'} />
        </div>

        {/* Chart */}
        {chartData.length > 0 && (
          <div className="rounded-[16px] p-5 bg-white/70 dark:bg-[#18181f]/70 backdrop-blur-[24px] border border-black/[0.07] dark:border-white/[0.07] shadow-card">
            <h2 className="text-[14px] font-[700] text-[#111115] dark:text-[#f0f0f8] mb-5">Monthly Overview</h2>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#adadb8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#adadb8' }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
                <Tooltip />
                <Legend />
                <Bar dataKey="revenue" fill="#4f46e5" radius={[4,4,0,0]} name="Revenue" />
                <Bar dataKey="expenses" fill="#dc2626" radius={[4,4,0,0]} name="Expenses" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Expenses table */}
        <div>
          <h2 className="text-[14px] font-[700] text-[#111115] dark:text-[#f0f0f8] mb-3">Expenses</h2>
          <Table columns={cols} data={expenses} loading={loading} keyExtractor={e => e.id} emptyMessage="No expenses recorded" />
        </div>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Expense' : 'Add Expense'}
        footer={<><BtnSecondary onClick={() => setModalOpen(false)}>Cancel</BtnSecondary><BtnPrimary onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save'}</BtnPrimary></>}>
        <FieldGroup>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2"><FormField label="Description"><input className={inputCls} value={fDesc} onChange={e => setFDesc(e.target.value)} placeholder="Expense description" /></FormField></div>
            <FormField label="Store"><select className={selectCls} value={fStore} onChange={e => setFStore(e.target.value)}>{stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></FormField>
            <FormField label="Category"><select className={selectCls} value={fCategory} onChange={e => setFCategory(e.target.value)}>{CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}</select></FormField>
            <FormField label="Amount ($)"><input type="number" className={inputCls} value={fAmount} onChange={e => setFAmount(e.target.value)} step="0.01" /></FormField>
            <FormField label="Date"><input type="date" className={inputCls} value={fDate} onChange={e => setFDate(e.target.value)} /></FormField>
          </div>
        </FieldGroup>
      </Modal>
    </div>
  );
}
