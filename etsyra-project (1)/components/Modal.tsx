'use client';

import React, { useEffect } from 'react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  footer?: React.ReactNode;
}

const sizeMap = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

export default function Modal({ open, onClose, title, children, size = 'md', footer }: ModalProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (open) window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-[6px]"
        onClick={onClose}
      />

      {/* Modal */}
      <div className={`relative w-full ${sizeMap[size]}
        bg-white/95 dark:bg-[#1c1c26]/95 backdrop-blur-[40px]
        border border-black/[0.08] dark:border-white/[0.08]
        rounded-[20px] shadow-[0_24px_64px_rgba(0,0,0,0.12),0_8px_24px_rgba(0,0,0,0.06)]
        flex flex-col max-h-[90vh]`}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-black/[0.07] dark:border-white/[0.07] flex-shrink-0">
          <h2 className="text-[15px] font-[700] tracking-tight text-[#111115] dark:text-[#f0f0f8]">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-[8px]
              text-[#6b6b78] hover:bg-black/[0.05] dark:hover:bg-white/[0.05]
              transition-all duration-150"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="flex items-center justify-end gap-2.5 px-6 py-4 border-t border-black/[0.07] dark:border-white/[0.07] flex-shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

// Shared form field components for use within modals
export function FieldGroup({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`space-y-3.5 ${className}`}>{children}</div>;
}

export function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[11.5px] font-[600] text-[#6b6b78] dark:text-[#8888a0] mb-1.5 tracking-[0.1px]">
        {label}
      </label>
      {children}
    </div>
  );
}

export const inputCls = `w-full px-3 py-2.5 text-[13px]
  bg-[#f0f0f5] dark:bg-[#111115] border border-black/[0.08] dark:border-white/[0.08]
  rounded-[9px] text-[#111115] dark:text-[#f0f0f8]
  focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/50
  transition-all duration-150 placeholder:text-[#adadb8]`;

export const selectCls = `w-full px-3 py-2.5 text-[13px]
  bg-[#f0f0f5] dark:bg-[#111115] border border-black/[0.08] dark:border-white/[0.08]
  rounded-[9px] text-[#111115] dark:text-[#f0f0f8]
  focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/50
  transition-all duration-150 appearance-none`;

export function BtnPrimary({ children, onClick, disabled, type = 'button' }: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: 'button' | 'submit';
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="px-5 py-2.5 text-[13px] font-[600] text-white
        bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50
        rounded-[9px] shadow-sm transition-all duration-150"
    >
      {children}
    </button>
  );
}

export function BtnSecondary({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="px-5 py-2.5 text-[13px] font-[500]
        text-[#6b6b78] dark:text-[#8888a0]
        bg-black/[0.04] dark:bg-white/[0.04] hover:bg-black/[0.07] dark:hover:bg-white/[0.07]
        rounded-[9px] transition-all duration-150"
    >
      {children}
    </button>
  );
}
