'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import Header from '@/components/Header';
import FilterBar from '@/components/FilterBar';
import { fetchDashboardKPIs, fetchStores, type DashboardFilters } from '@/lib/queries';
import type { Store } from '@/types/store';

interface KPI {
  revenue: number;
  profit: number;
  orderCount: number;
  chartData: { date: string; revenue: number; orders: number }[];
}

function fmt(n: number) {
  return '$' + n.toLocaleString('en-US', { maximumFractionDigits: 0 });
}

function KPICard({ label, value, delta, icon, color }: {
  label: string; value: string; delta?: string; icon: React.ReactNode; color: string;
}) {
  return (
    <div className={`rounded-[16px] p-5 bg-white/70 dark:bg-[#18181f]/70 backdrop-blur-[24px]
      border border-black/[0.07] dark:border-white/[0.07] shadow-[0_4px_16px_rgba(0,0,0,0.06)]`}>
      <div className="flex items-start justify-between mb-4">
        <span className="text-[12px] font-[600] text-[#6b6b78] dark:text-[#8888a0] uppercase tracking-[0.4px]">{label}</span>
        <div className={`w-9 h-9 rounded-[10px] ${color} flex items-center justify-center`}>
          {icon}
        </div>
      </div>
      <div className="text-[28px] font-[700] tracking-tight text-[#111115] dark:text-[#f0f0f8]">{value}</div>
      {delta && <p className="text-[12px] text-emerald-500 mt-1 font-[500]">{delta}</p>}
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }: {
  active?: boolean; payload?: { value: number; name: string }[]; label?: string;
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white/95 dark:bg-[#1c1c26]/95 border border-black/[0.08] dark:border-white/[0.08] rounded-[10px] px-3 py-2.5 shadow-lg">
      <p className="text-[11px] text-[#6b6b78] mb-1">{label}</p>
      {payload.map(p => (
        <p key={p.name} className="text-[13px] font-[600] text-[#111115] dark:text-[#f0f0f8]">
          {p.name === 'revenue' ? fmt(p.value) : p.value + ' orders'}
        </p>
      ))}
    </div>
  );
};

export default function DashboardPage() {
  const [stores, setStores] = useState<Store[]>([]);
  const [kpi, setKpi] = useState<KPI | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'revenue' | 'orders'>('revenue');

  // Filter state
  const [selectedStore, setSelectedStore] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const filters: DashboardFilters = {};
      if (selectedStore) filters.store_id = selectedStore;
      if (dateFrom) filters.date_from = dateFrom;
      if (dateTo) filters.date_to = dateTo;

      const [kpiData, storesData] = await Promise.all([
        fetchDashboardKPIs(filters),
        stores.length ? Promise.resolve(stores) : fetchStores(),
      ]);
      setKpi(kpiData);
      if (!stores.length) setStores(storesData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [selectedStore, dateFrom, dateTo]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { loadData(); }, [loadData]);

  return (
    <div>
      <Header title="Dashboard" subtitle="Overview of your agency performance" />

      <div className="p-6 space-y-5">
        {/* Filters */}
        <FilterBar
          stores={stores}
          selectedStore={selectedStore}
          onStoreChange={v => setSelectedStore(v)}
          dateFrom={dateFrom}
          onDateFromChange={v => setDateFrom(v)}
          dateTo={dateTo}
          onDateToChange={v => setDateTo(v)}
          showStatusFilter={false}
        >
          {(selectedStore || dateFrom || dateTo) && (
            <button
              onClick={() => { setSelectedStore(''); setDateFrom(''); setDateTo(''); }}
              className="px-3 py-2 text-[12px] font-[500] text-[#6b6b78] hover:text-red-500 transition-colors"
            >
              Clear filters
            </button>
          )}
        </FilterBar>

        {/* KPI Cards */}
        <div className="grid grid-cols-3 gap-4">
          <KPICard
            label="Revenue"
            value={loading ? '—' : fmt(kpi?.revenue ?? 0)}
            delta="↑ filtered period"
            color="bg-indigo-50 dark:bg-indigo-500/10"
            icon={<svg className="w-4 h-4 text-indigo-600 dark:text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>}
          />
          <KPICard
            label="Orders"
            value={loading ? '—' : String(kpi?.orderCount ?? 0)}
            delta="↑ filtered period"
            color="bg-sky-50 dark:bg-sky-500/10"
            icon={<svg className="w-4 h-4 text-sky-600 dark:text-sky-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/></svg>}
          />
          <KPICard
            label="Profit"
            value={loading ? '—' : fmt(kpi?.profit ?? 0)}
            delta="Revenue minus expenses"
            color="bg-emerald-50 dark:bg-emerald-500/10"
            icon={<svg className="w-4 h-4 text-emerald-600 dark:text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>}
          />
        </div>

        {/* Chart */}
        <div className="rounded-[16px] p-5 bg-white/70 dark:bg-[#18181f]/70 backdrop-blur-[24px]
          border border-black/[0.07] dark:border-white/[0.07] shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-[14px] font-[700] text-[#111115] dark:text-[#f0f0f8]">Performance</h2>
            <div className="flex gap-1 p-1 rounded-[9px] bg-black/[0.04] dark:bg-white/[0.04]">
              {(['revenue', 'orders'] as const).map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className={`px-3 py-1.5 rounded-[6px] text-[12px] font-[500] capitalize transition-all duration-150
                    ${activeTab === tab
                      ? 'bg-white dark:bg-[#1c1c26] text-[#111115] dark:text-[#f0f0f8] shadow-sm'
                      : 'text-[#6b6b78] dark:text-[#8888a0]'}`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="h-52 bg-black/[0.03] dark:bg-white/[0.03] rounded-[10px] animate-pulse" />
          ) : (kpi?.chartData ?? []).length === 0 ? (
            <div className="h-52 flex items-center justify-center text-[13px] text-[#adadb8]">
              No data for selected filters
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={210}>
              {activeTab === 'revenue' ? (
                <AreaChart data={kpi?.chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#adadb8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#adadb8' }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="revenue" stroke="#4f46e5" strokeWidth={2} fill="url(#revGrad)" />
                </AreaChart>
              ) : (
                <BarChart data={kpi?.chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#adadb8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#adadb8' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="orders" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                </BarChart>
              )}
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
