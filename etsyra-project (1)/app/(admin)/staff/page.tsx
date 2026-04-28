'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Header from '@/components/Header';
import Modal, { FieldGroup, FormField, inputCls, selectCls, BtnPrimary, BtnSecondary } from '@/components/Modal';
import { fetchStaff, fetchStores, assignStaffStores, deleteStaffMember } from '@/lib/queries';
import type { AppUser } from '@/types/user';
import type { Store } from '@/types/store';

function initials(name: string) {
  return name.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2);
}

const GRADIENTS = [
  'from-violet-500 to-purple-600',
  'from-sky-500 to-blue-600',
  'from-emerald-500 to-green-600',
  'from-rose-500 to-pink-600',
  'from-amber-500 to-orange-600',
];

export default function StaffPage() {
  const [staff, setStaff] = useState<AppUser[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [assignModal, setAssignModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AppUser | null>(null);
  const [selectedStoreIds, setSelectedStoreIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [staffData, storesData] = await Promise.all([fetchStaff(), fetchStores()]);
      setStaff(staffData);
      setStores(storesData);
    } catch(e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openAssign = (user: AppUser) => {
    setSelectedUser(user);
    setSelectedStoreIds(user.assigned_stores ?? []);
    setAssignModal(true);
  };

  const toggleStore = (storeId: string) => {
    setSelectedStoreIds(prev =>
      prev.includes(storeId) ? prev.filter(id => id !== storeId) : [...prev, storeId]
    );
  };

  const handleAssign = async () => {
    if (!selectedUser) return;
    setSaving(true);
    try {
      await assignStaffStores(selectedUser.id, selectedStoreIds);
      setAssignModal(false);
      load();
    } catch(e) { console.error(e); }
    finally { setSaving(false); }
  };

  const handleDelete = async (userId: string) => {
    if (!confirm('Remove this staff member from the system?')) return;
    await deleteStaffMember(userId);
    load();
  };

  if (loading) {
    return (
      <div>
        <Header title="Staff" />
        <div className="p-6 grid grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-48 rounded-[16px] bg-black/[0.03] dark:bg-white/[0.03] animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header title="Staff" subtitle={`${staff.length} team members`} />

      <div className="p-6">
        {staff.length === 0 ? (
          <div className="text-center py-20 text-[#adadb8]">
            <svg className="w-12 h-12 mx-auto mb-3 opacity-40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
            </svg>
            <p className="text-[13px]">No staff members yet. Invite users via Supabase Auth.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {staff.map((user, idx) => {
              const grad = GRADIENTS[idx % GRADIENTS.length];
              const assignedStoreNames = (user.assigned_stores ?? [])
                .map(id => stores.find(s => s.id === id)?.name)
                .filter(Boolean);

              return (
                <div key={user.id}
                  className="rounded-[16px] p-5 bg-white/70 dark:bg-[#18181f]/70 backdrop-blur-[24px] border border-black/[0.07] dark:border-white/[0.07] shadow-card">
                  <div className="flex items-start gap-3 mb-4">
                    <div className={`w-11 h-11 rounded-full bg-gradient-to-br ${grad} flex items-center justify-center flex-shrink-0`}>
                      <span className="text-white text-[14px] font-[700]">{initials(user.name)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-[600] text-[#111115] dark:text-[#f0f0f8] truncate">{user.name}</p>
                      <p className="text-[12px] text-[#adadb8] truncate">{user.email}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-[700] uppercase tracking-[0.5px] flex-shrink-0
                      ${user.role === 'admin'
                        ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                        : 'bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400'}`}>
                      {user.role}
                    </span>
                  </div>

                  {/* Assigned stores */}
                  <div className="mb-4">
                    <p className="text-[11px] font-[600] text-[#adadb8] uppercase tracking-[0.4px] mb-1.5">Assigned Stores</p>
                    {assignedStoreNames.length === 0 ? (
                      <p className="text-[12px] text-[#adadb8] italic">No stores assigned</p>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {assignedStoreNames.map(name => (
                          <span key={name} className="px-2 py-0.5 rounded-full text-[11px] bg-black/[0.04] dark:bg-white/[0.04] text-[#6b6b78] dark:text-[#8888a0]">
                            {name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-3 border-t border-black/[0.06] dark:border-white/[0.06]">
                    {user.role === 'staff' && (
                      <button onClick={() => openAssign(user)}
                        className="flex-1 py-1.5 text-[12px] font-[500] rounded-[8px] text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 transition-all">
                        Assign Stores
                      </button>
                    )}
                    <button onClick={() => handleDelete(user.id)}
                      className="py-1.5 px-3 text-[12px] font-[500] rounded-[8px] text-red-500 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 transition-all">
                      Remove
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Assign stores modal */}
      <Modal
        open={assignModal}
        onClose={() => setAssignModal(false)}
        title={`Assign Stores — ${selectedUser?.name}`}
        footer={
          <>
            <BtnSecondary onClick={() => setAssignModal(false)}>Cancel</BtnSecondary>
            <BtnPrimary onClick={handleAssign} disabled={saving}>{saving ? 'Saving…' : 'Save Assignment'}</BtnPrimary>
          </>
        }
      >
        <p className="text-[13px] text-[#6b6b78] dark:text-[#8888a0] mb-4">
          Select which stores {selectedUser?.name} can access and manage orders for.
        </p>
        <div className="space-y-2">
          {stores.map(store => (
            <label key={store.id}
              className={`flex items-center gap-3 p-3 rounded-[10px] cursor-pointer border transition-all duration-150
                ${selectedStoreIds.includes(store.id)
                  ? 'border-indigo-500/40 bg-indigo-50 dark:bg-indigo-500/10'
                  : 'border-black/[0.06] dark:border-white/[0.06] hover:bg-black/[0.02] dark:hover:bg-white/[0.02]'}`}>
              <input
                type="checkbox"
                checked={selectedStoreIds.includes(store.id)}
                onChange={() => toggleStore(store.id)}
                className="w-4 h-4 rounded accent-indigo-600"
              />
              <span className="text-xl">{store.emoji}</span>
              <div>
                <p className="text-[13px] font-[500] text-[#111115] dark:text-[#f0f0f8]">{store.name}</p>
                <p className="text-[11.5px] text-[#adadb8]">{store.handle}</p>
              </div>
            </label>
          ))}
        </div>
      </Modal>
    </div>
  );
}
