'use client';

import React, { useState } from 'react';

interface Notification {
  id: string;
  type: 'order' | 'info' | 'alert';
  text: string;
  time: string;
  read: boolean;
}

const MOCK_NOTIFS: Notification[] = [
  { id: '1', type: 'order', text: 'New order #ETY-8821 received', time: '2m ago', read: false },
  { id: '2', type: 'alert', text: 'Low stock: Lilac 40oz Tumbler', time: '1h ago', read: false },
  { id: '3', type: 'info', text: 'Daily revenue report ready', time: '3h ago', read: true },
  { id: '4', type: 'order', text: 'Order #ETY-8820 delivered', time: '5h ago', read: true },
];

const typeColors: Record<string, string> = {
  order: 'bg-indigo-500',
  alert: 'bg-amber-500',
  info: 'bg-sky-500',
};

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifs, setNotifs] = useState(MOCK_NOTIFS);
  const unread = notifs.filter(n => !n.read).length;

  const markAllRead = () => setNotifs(prev => prev.map(n => ({ ...n, read: true })));

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative w-9 h-9 flex items-center justify-center rounded-[10px]
          text-[#6b6b78] dark:text-[#8888a0]
          hover:bg-black/[0.05] dark:hover:bg-white/[0.05] transition-all duration-150"
      >
        <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/>
        </svg>
        {unread > 0 && (
          <span className="absolute top-1.5 right-1.5 w-[7px] h-[7px] rounded-full bg-red-500 border-2 border-white dark:border-[#0c0c10]" />
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-11 z-50 w-80
            bg-white/90 dark:bg-[#1c1c26]/90 backdrop-blur-[40px]
            border border-black/[0.07] dark:border-white/[0.07]
            rounded-[16px] shadow-[0_12px_40px_rgba(0,0,0,0.10)] overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-black/[0.07] dark:border-white/[0.07]">
              <span className="text-[13px] font-[600] text-[#111115] dark:text-[#f0f0f8]">Notifications</span>
              {unread > 0 && (
                <button onClick={markAllRead} className="text-[11.5px] text-indigo-500 font-[500] hover:text-indigo-700">
                  Mark all read
                </button>
              )}
            </div>
            <div className="max-h-72 overflow-y-auto">
              {notifs.map(n => (
                <div key={n.id}
                  className={`flex gap-3 px-4 py-3 border-b border-black/[0.04] dark:border-white/[0.04] last:border-0
                    ${!n.read ? 'bg-indigo-50/60 dark:bg-indigo-500/5' : ''}`}
                >
                  <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${typeColors[n.type]}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[12.5px] text-[#111115] dark:text-[#f0f0f8] leading-snug">{n.text}</p>
                    <p className="text-[11px] text-[#adadb8] mt-0.5">{n.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
