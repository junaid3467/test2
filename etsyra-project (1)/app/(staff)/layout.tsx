'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/authContext';
import Sidebar from '@/components/Sidebar';

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
    // Admin can also view staff pages (for oversight), but staff are restricted
    if (!loading && user && user.role === 'admin') {
      // Admins who end up here get redirected back to admin dashboard
      router.replace('/dashboard');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f0f0f5] dark:bg-[#0c0c10]">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#f0f0f5] dark:bg-[#0c0c10]">
      <Sidebar />
      <main className="flex-1 ml-60 transition-all duration-200 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
