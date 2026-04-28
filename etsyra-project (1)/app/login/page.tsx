'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from '@/lib/queries';
import { useAuth } from '@/lib/authContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { user, loading: authLoading, refresh } = useAuth();

  useEffect(() => {
    if (!authLoading && user) {
      router.replace(user.role === 'admin' ? '/dashboard' : '/staff/orders');
    }
  }, [user, authLoading, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error: err } = await signIn(email, password);
    if (err) {
      setError(err.message);
      setLoading(false);
    } else {
      await refresh();
    }
  };

  const fillDemo = (role: 'admin' | 'staff') => {
    setEmail(role === 'admin' ? 'admin@etsyra.io' : 'staff@etsyra.io');
    setPassword('demo1234');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f0f0f5] dark:bg-[#0c0c10] relative overflow-hidden">
      {/* Ambient orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute w-[500px] h-[500px] rounded-full bg-indigo-500/20 blur-[90px] -top-32 -right-16 animate-pulse" />
        <div className="absolute w-[360px] h-[360px] rounded-full bg-purple-600/15 blur-[90px] -bottom-20 -left-10" style={{ animationDelay: '-4s' }} />
        <div className="absolute w-[240px] h-[240px] rounded-full bg-emerald-500/10 blur-[90px] top-2/5 left-1/3" style={{ animationDelay: '-7s' }} />
      </div>

      <div className="relative z-10 w-full max-w-[400px] mx-4">
        <div className="bg-white/68 dark:bg-[#18181f]/80 backdrop-blur-[24px] border border-black/[0.07] dark:border-white/[0.07] rounded-[24px] shadow-[0_24px_64px_rgba(0,0,0,0.12)] p-10">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-[38px] h-[38px] rounded-[11px] bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/40">
              <svg className="w-5 h-5 fill-white" viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
            </div>
            <span className="text-[17px] font-[700] tracking-tight text-[#111115] dark:text-[#f0f0f8]">Etsyra</span>
            <span className="ml-auto text-[9.5px] font-[600] tracking-[0.5px] bg-indigo-500/10 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-full border border-indigo-500/20 uppercase">
              Agency
            </span>
          </div>

          <h1 className="text-[23px] font-[700] tracking-tight text-[#111115] dark:text-[#f0f0f8] mb-1.5">
            Welcome back
          </h1>
          <p className="text-[13px] text-[#6b6b78] dark:text-[#8888a0] mb-7">
            Sign in to your agency dashboard
          </p>

          {/* Demo credentials */}
          <div className="bg-indigo-500/8 border border-indigo-500/15 rounded-[10px] px-3.5 py-3 mb-5">
            <p className="text-[10.5px] font-[700] text-indigo-500 uppercase tracking-[0.5px] mb-2">Demo Accounts</p>
            <div className="flex gap-2">
              <button onClick={() => fillDemo('admin')}
                className="flex-1 py-1.5 rounded-[7px] text-[11.5px] font-[600] text-indigo-600 dark:text-indigo-400
                  border border-black/[0.08] dark:border-white/[0.08] bg-white dark:bg-[#1c1c26]
                  hover:bg-indigo-500 hover:text-white hover:border-indigo-500 transition-all duration-150">
                Admin
              </button>
              <button onClick={() => fillDemo('staff')}
                className="flex-1 py-1.5 rounded-[7px] text-[11.5px] font-[600] text-indigo-600 dark:text-indigo-400
                  border border-black/[0.08] dark:border-white/[0.08] bg-white dark:bg-[#1c1c26]
                  hover:bg-indigo-500 hover:text-white hover:border-indigo-500 transition-all duration-150">
                Staff
              </button>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-3.5">
            <div>
              <label className="block text-[11.5px] font-[600] text-[#6b6b78] mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full px-3.5 py-2.5 bg-[#f0f0f5] dark:bg-[#111115] border border-black/[0.10] dark:border-white/[0.08]
                  rounded-[10px] text-[13.5px] text-[#111115] dark:text-[#f0f0f8] placeholder:text-[#adadb8]
                  focus:outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-500/50 transition-all"
              />
            </div>
            <div>
              <label className="block text-[11.5px] font-[600] text-[#6b6b78] mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-3.5 py-2.5 bg-[#f0f0f5] dark:bg-[#111115] border border-black/[0.10] dark:border-white/[0.08]
                  rounded-[10px] text-[13.5px] text-[#111115] dark:text-[#f0f0f8] placeholder:text-[#adadb8]
                  focus:outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-500/50 transition-all"
              />
            </div>

            {error && <p className="text-[12px] text-red-500 text-center">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 mt-1.5 text-[14px] font-[600] text-white
                bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60
                rounded-[10px] shadow-lg shadow-indigo-500/30
                hover:shadow-indigo-500/40 hover:-translate-y-[1px]
                active:translate-y-0 transition-all duration-150"
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
