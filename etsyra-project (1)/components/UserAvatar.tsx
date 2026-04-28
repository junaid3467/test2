'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/authContext';
import { signOut } from '@/lib/queries';

function initials(name: string) {
  return name.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2);
}

const AVATAR_COLORS = [
  'from-violet-500 to-purple-600',
  'from-sky-500 to-blue-600',
  'from-emerald-500 to-green-600',
  'from-rose-500 to-pink-600',
  'from-amber-500 to-orange-600',
];

export default function UserAvatar() {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const router = useRouter();

  if (!user) return null;

  const colorIdx = user.name.charCodeAt(0) % AVATAR_COLORS.length;
  const gradientClass = AVATAR_COLORS[colorIdx];

  const handleLogout = async () => {
    await signOut();
    router.push('/login');
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 pl-1 pr-2.5 py-1 rounded-[10px]
          hover:bg-black/[0.05] dark:hover:bg-white/[0.05] transition-all duration-150"
      >
        <div className={`w-7 h-7 rounded-full bg-gradient-to-br ${gradientClass} flex items-center justify-center`}>
          <span className="text-white text-[11px] font-[700]">{initials(user.name)}</span>
        </div>
        <span className="text-[13px] font-[500] text-[#111115] dark:text-[#f0f0f8] hidden sm:block">
          {user.name.split(' ')[0]}
        </span>
        <svg className="w-3.5 h-3.5 text-[#adadb8]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M6 9l6 6 6-6"/>
        </svg>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-11 z-50 w-56
            bg-white/90 dark:bg-[#1c1c26]/90 backdrop-blur-[40px]
            border border-black/[0.07] dark:border-white/[0.07]
            rounded-[14px] shadow-[0_12px_40px_rgba(0,0,0,0.10)] overflow-hidden">
            {/* Profile header */}
            <div className="px-4 py-3 border-b border-black/[0.07] dark:border-white/[0.07]">
              <p className="text-[13px] font-[600] text-[#111115] dark:text-[#f0f0f8]">{user.name}</p>
              <p className="text-[11.5px] text-[#adadb8] mt-0.5">{user.email}</p>
              <span className="inline-flex mt-1.5 px-2 py-0.5 rounded-full text-[10px] font-[600]
                bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 uppercase tracking-wide">
                {user.role}
              </span>
            </div>

            {/* Menu items */}
            <div className="p-1.5">
              <button
                onClick={() => { setOpen(false); router.push('/settings'); }}
                className="flex items-center gap-2.5 w-full px-3 py-2 rounded-[8px]
                  text-[12.5px] text-[#6b6b78] dark:text-[#8888a0]
                  hover:bg-black/[0.04] dark:hover:bg-white/[0.04] hover:text-[#111115] dark:hover:text-[#f0f0f8]
                  transition-all duration-150 text-left"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
                </svg>
                Profile & Settings
              </button>
              <div className="h-px bg-black/[0.06] dark:bg-white/[0.06] my-1" />
              <button
                onClick={handleLogout}
                className="flex items-center gap-2.5 w-full px-3 py-2 rounded-[8px]
                  text-[12.5px] text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10
                  transition-all duration-150 text-left"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/>
                </svg>
                Sign out
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
