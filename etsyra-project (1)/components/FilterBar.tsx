'use client';

import React from 'react';
import type { Store } from '@/types/store';
import type { OrderStatus } from '@/types/order';

interface FilterBarProps {
  stores?: Store[];
  selectedStore?: string;
  onStoreChange?: (storeId: string) => void;
  selectedStatus?: string;
  onStatusChange?: (status: string) => void;
  dateFrom?: string;
  onDateFromChange?: (date: string) => void;
  dateTo?: string;
  onDateToChange?: (date: string) => void;
  showStoreFilter?: boolean;
  showStatusFilter?: boolean;
  showDateFilter?: boolean;
  children?: React.ReactNode;
}

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: 'All statuses' },
  { value: 'created', label: 'Created' },
  { value: 'pre_transit', label: 'Pre-Transit' },
  { value: 'in_transit', label: 'In Transit' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'completed', label: 'Completed' },
];

const selectCls = `text-[12.5px] pl-3 pr-8 py-2 rounded-[9px]
  bg-white dark:bg-[#1c1c26] border border-black/[0.08] dark:border-white/[0.08]
  text-[#111115] dark:text-[#f0f0f8]
  appearance-none cursor-pointer
  focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/60
  transition-all duration-150 shadow-sm`;

const inputCls = `text-[12.5px] px-3 py-2 rounded-[9px]
  bg-white dark:bg-[#1c1c26] border border-black/[0.08] dark:border-white/[0.08]
  text-[#111115] dark:text-[#f0f0f8]
  focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/60
  transition-all duration-150 shadow-sm`;

export default function FilterBar({
  stores = [],
  selectedStore = '',
  onStoreChange,
  selectedStatus = '',
  onStatusChange,
  dateFrom = '',
  onDateFromChange,
  dateTo = '',
  onDateToChange,
  showStoreFilter = true,
  showStatusFilter = true,
  showDateFilter = true,
  children,
}: FilterBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2.5 p-4
      bg-white/60 dark:bg-[#18181f]/60 backdrop-blur-[12px]
      border border-black/[0.06] dark:border-white/[0.06]
      rounded-[14px] shadow-sm">
      
      {showStoreFilter && (
        <div className="relative">
          <select
            value={selectedStore}
            onChange={e => onStoreChange?.(e.target.value)}
            className={selectCls}
          >
            <option value="">All stores</option>
            {stores.map(s => (
              <option key={s.id} value={s.id}>{s.emoji} {s.name}</option>
            ))}
          </select>
          <svg className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#adadb8] pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 9l6 6 6-6"/>
          </svg>
        </div>
      )}

      {showStatusFilter && (
        <div className="relative">
          <select
            value={selectedStatus}
            onChange={e => onStatusChange?.(e.target.value)}
            className={selectCls}
          >
            {STATUS_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <svg className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#adadb8] pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 9l6 6 6-6"/>
          </svg>
        </div>
      )}

      {showDateFilter && (
        <>
          <input
            type="date"
            value={dateFrom}
            onChange={e => onDateFromChange?.(e.target.value)}
            className={inputCls}
          />
          <span className="text-[12px] text-[#adadb8]">→</span>
          <input
            type="date"
            value={dateTo}
            onChange={e => onDateToChange?.(e.target.value)}
            className={inputCls}
          />
        </>
      )}

      {children}
    </div>
  );
}
