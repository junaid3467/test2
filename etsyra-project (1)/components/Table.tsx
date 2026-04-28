'use client';

import React from 'react';

export interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => React.ReactNode;
  className?: string;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
  keyExtractor: (row: T) => string;
}

export default function Table<T>({
  columns,
  data,
  loading = false,
  emptyMessage = 'No data found',
  onRowClick,
  keyExtractor,
}: TableProps<T>) {
  if (loading) {
    return (
      <div className="w-full overflow-x-auto rounded-[14px] border border-black/[0.07] dark:border-white/[0.07]">
        <table className="w-full text-[12.5px]">
          <thead>
            <tr className="bg-black/[0.02] dark:bg-white/[0.02] border-b border-black/[0.06] dark:border-white/[0.06]">
              {columns.map(col => (
                <th key={col.key} className="text-left px-4 py-3 font-[600] text-[#6b6b78] dark:text-[#8888a0] whitespace-nowrap">
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 5 }).map((_, i) => (
              <tr key={i} className="border-b border-black/[0.04] dark:border-white/[0.04]">
                {columns.map(col => (
                  <td key={col.key} className="px-4 py-3">
                    <div className="h-4 bg-black/[0.05] dark:bg-white/[0.05] rounded-[4px] animate-pulse" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="w-full rounded-[14px] border border-black/[0.07] dark:border-white/[0.07]
        bg-white/50 dark:bg-[#18181f]/50 flex items-center justify-center py-16">
        <div className="text-center">
          <svg className="w-10 h-10 text-[#adadb8] mx-auto mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="12" cy="12" r="10"/><path d="M8 12h8M12 8v8"/>
          </svg>
          <p className="text-[13px] text-[#adadb8]">{emptyMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto rounded-[14px] border border-black/[0.07] dark:border-white/[0.07]
      bg-white/60 dark:bg-[#18181f]/60 backdrop-blur-[12px]">
      <table className="w-full text-[12.5px]">
        <thead>
          <tr className="bg-black/[0.02] dark:bg-white/[0.02] border-b border-black/[0.06] dark:border-white/[0.06]">
            {columns.map(col => (
              <th key={col.key}
                className={`text-left px-4 py-3 font-[600] text-[#6b6b78] dark:text-[#8888a0] whitespace-nowrap ${col.className ?? ''}`}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map(row => (
            <tr key={keyExtractor(row)}
              onClick={() => onRowClick?.(row)}
              className={`border-b border-black/[0.04] dark:border-white/[0.04] last:border-0
                text-[#111115] dark:text-[#f0f0f8]
                transition-colors duration-100
                ${onRowClick ? 'cursor-pointer hover:bg-black/[0.02] dark:hover:bg-white/[0.02]' : ''}`}
            >
              {columns.map(col => (
                <td key={col.key} className={`px-4 py-3 ${col.className ?? ''}`}>
                  {col.render ? col.render(row) : String((row as Record<string, unknown>)[col.key] ?? '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
