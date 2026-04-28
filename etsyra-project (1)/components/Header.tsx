'use client';

import React, { useState, useEffect } from 'react';
import NotificationBell from './NotificationBell';
import UserAvatar from './UserAvatar';

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export default function Header({ title, subtitle }: HeaderProps) {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('theme');
    if (saved === 'dark') {
      document.documentElement.classList.add('dark');
      setDark(true);
    }
  }, []);

  const toggleTheme = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('theme', next ? 'dark' : 'light');
  };

  return (
    <header className="h-[58px] flex items-center justify-between px-6 
      bg-white/70 dark:bg-[#18181f]/80 backdrop-blur-[24px]
      border-b border-black/[0.07] dark:border-white/[0.07] sticky top-0 z-30">
      <div>
        <h1 className="text-[15px] font-[700] tracking-tight text-[#111115] dark:text-[#f0f0f8]">
          {title}
        </h1>
        {subtitle && (
          <p className="text-[11.5px] text-[#adadb8] leading-none mt-0.5">{subtitle}</p>
        )}
      </div>

      <div className="flex items-center gap-1.5">
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="w-9 h-9 flex items-center justify-center rounded-[10px]
            text-[#6b6b78] dark:text-[#8888a0]
            hover:bg-black/[0.05] dark:hover:bg-white/[0.05] transition-all duration-150"
        >
          <svg className="w-[17px] h-[17px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            {dark
              ? <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>
              : <><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></>
            }
          </svg>
        </button>

        <NotificationBell />

        <div className="w-px h-5 bg-black/[0.08] dark:bg-white/[0.08] mx-1" />

        <UserAvatar />
      </div>
    </header>
  );
}
