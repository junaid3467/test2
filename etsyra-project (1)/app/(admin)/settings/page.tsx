'use client';

import React, { useState } from 'react';
import Header from '@/components/Header';
import { useAuth } from '@/lib/authContext';
import { getSupabaseClient } from '@/lib/supabaseClient';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[16px] p-6 bg-white/70 dark:bg-[#18181f]/70 backdrop-blur-[24px] border border-black/[0.07] dark:border-white/[0.07] shadow-card">
      <h2 className="text-[14px] font-[700] text-[#111115] dark:text-[#f0f0f8] mb-5">{title}</h2>
      {children}
    </div>
  );
}

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-4 py-3.5 border-b border-black/[0.05] dark:border-white/[0.05] last:border-0">
      <div className="w-40 flex-shrink-0">
        <p className="text-[12.5px] font-[600] text-[#6b6b78] dark:text-[#8888a0]">{label}</p>
      </div>
      <div className="flex-1">{children}</div>
    </div>
  );
}

const inputCls = `px-3 py-2 text-[13px] rounded-[9px]
  bg-[#f0f0f5] dark:bg-[#111115] border border-black/[0.08] dark:border-white/[0.08]
  text-[#111115] dark:text-[#f0f0f8]
  focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/50
  transition-all placeholder:text-[#adadb8]`;

function initials(name: string) {
  return name.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2);
}

export default function SettingsPage() {
  const { user, refresh } = useAuth();
  const [tab, setTab] = useState<'profile' | 'security' | 'notifications'>('profile');

  const [fname, setFname] = useState(user?.name.split(' ')[0] ?? '');
  const [lname, setLname] = useState(user?.name.split(' ').slice(1).join(' ') ?? '');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwMsg, setPwMsg] = useState('');

  const handleProfileSave = async () => {
    setSaving(true);
    setMsg('');
    try {
      const supabase = getSupabaseClient();
      const fullName = `${fname} ${lname}`.trim();
      await supabase.from('profiles').update({ name: fullName }).eq('id', user!.id);
      await refresh();
      setMsg('Profile updated successfully.');
    } catch (e) {
      setMsg('Failed to update profile.');
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    if (newPw !== confirmPw) { setPwMsg('Passwords do not match.'); return; }
    if (newPw.length < 8) { setPwMsg('Password must be at least 8 characters.'); return; }
    setPwMsg('');
    try {
      const supabase = getSupabaseClient();
      const { error } = await supabase.auth.updateUser({ password: newPw });
      if (error) throw error;
      setPwMsg('Password updated successfully.');
      setCurrentPw(''); setNewPw(''); setConfirmPw('');
    } catch (e: unknown) {
      setPwMsg(e instanceof Error ? e.message : 'Failed to update password.');
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile' },
    { id: 'security', label: 'Security' },
    { id: 'notifications', label: 'Notifications' },
  ] as const;

  return (
    <div>
      <Header title="Settings" subtitle="Manage your account and preferences" />

      <div className="p-6 max-w-2xl space-y-5">
        {/* Profile summary */}
        <div className="rounded-[16px] p-5 bg-white/70 dark:bg-[#18181f]/70 backdrop-blur-[24px] border border-black/[0.07] dark:border-white/[0.07] shadow-card flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center flex-shrink-0">
            <span className="text-white text-[20px] font-[700]">{initials(user?.name ?? 'U')}</span>
          </div>
          <div>
            <p className="text-[16px] font-[700] text-[#111115] dark:text-[#f0f0f8]">{user?.name}</p>
            <p className="text-[13px] text-[#adadb8]">{user?.email}</p>
            <span className="inline-flex mt-1 px-2 py-0.5 rounded-full text-[10px] font-[700] uppercase tracking-[0.5px]
              bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              {user?.role}
            </span>
          </div>
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 p-1 rounded-[10px] bg-black/[0.04] dark:bg-white/[0.04] w-fit">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`px-4 py-1.5 rounded-[7px] text-[12.5px] font-[500] transition-all duration-150
                ${tab === t.id
                  ? 'bg-white dark:bg-[#1c1c26] text-[#111115] dark:text-[#f0f0f8] shadow-sm'
                  : 'text-[#6b6b78] dark:text-[#8888a0]'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Profile tab */}
        {tab === 'profile' && (
          <Section title="Profile Information">
            <FieldRow label="First Name">
              <input className={`${inputCls} w-full`} value={fname} onChange={e => setFname(e.target.value)} />
            </FieldRow>
            <FieldRow label="Last Name">
              <input className={`${inputCls} w-full`} value={lname} onChange={e => setLname(e.target.value)} />
            </FieldRow>
            <FieldRow label="Email">
              <p className="text-[13px] text-[#6b6b78] dark:text-[#8888a0]">{user?.email}</p>
            </FieldRow>
            <FieldRow label="Role">
              <p className="text-[13px] text-[#6b6b78] dark:text-[#8888a0] capitalize">{user?.role}</p>
            </FieldRow>
            <div className="flex items-center gap-3 mt-5">
              <button onClick={handleProfileSave} disabled={saving}
                className="px-5 py-2.5 text-[13px] font-[600] text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-[9px] shadow-sm transition-all">
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
              {msg && <p className={`text-[12.5px] ${msg.includes('success') ? 'text-emerald-500' : 'text-red-500'}`}>{msg}</p>}
            </div>
          </Section>
        )}

        {/* Security tab */}
        {tab === 'security' && (
          <Section title="Change Password">
            <FieldRow label="Current Password">
              <input type="password" className={`${inputCls} w-full`} value={currentPw} onChange={e => setCurrentPw(e.target.value)} placeholder="••••••••" />
            </FieldRow>
            <FieldRow label="New Password">
              <input type="password" className={`${inputCls} w-full`} value={newPw} onChange={e => setNewPw(e.target.value)} placeholder="Min. 8 characters" />
            </FieldRow>
            <FieldRow label="Confirm Password">
              <input type="password" className={`${inputCls} w-full`} value={confirmPw} onChange={e => setConfirmPw(e.target.value)} placeholder="Repeat new password" />
            </FieldRow>
            <div className="flex items-center gap-3 mt-5">
              <button onClick={handlePasswordChange}
                className="px-5 py-2.5 text-[13px] font-[600] text-white bg-indigo-600 hover:bg-indigo-700 rounded-[9px] shadow-sm transition-all">
                Update Password
              </button>
              {pwMsg && <p className={`text-[12.5px] ${pwMsg.includes('success') ? 'text-emerald-500' : 'text-red-500'}`}>{pwMsg}</p>}
            </div>
          </Section>
        )}

        {/* Notifications tab */}
        {tab === 'notifications' && (
          <Section title="Notification Preferences">
            {[
              { label: 'New orders', desc: 'Get notified when a new order comes in' },
              { label: 'Order status changes', desc: 'Updates when order status changes' },
              { label: 'Low inventory alerts', desc: 'When stock falls below threshold' },
              { label: 'Daily summary', desc: 'Daily revenue and order digest' },
            ].map(item => (
              <FieldRow key={item.label} label={item.label}>
                <div className="flex items-center justify-between">
                  <p className="text-[12px] text-[#adadb8]">{item.desc}</p>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" defaultChecked className="sr-only peer" />
                    <div className="w-9 h-5 bg-gray-200 dark:bg-gray-700 rounded-full peer
                      peer-checked:bg-indigo-600 transition-colors duration-150
                      after:content-[''] after:absolute after:top-0.5 after:left-0.5
                      after:w-4 after:h-4 after:rounded-full after:bg-white
                      after:transition-all peer-checked:after:translate-x-4" />
                  </label>
                </div>
              </FieldRow>
            ))}
          </Section>
        )}
      </div>
    </div>
  );
}
