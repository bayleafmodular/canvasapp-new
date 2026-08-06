"use client";
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  isOpen,
  title = "Confirmation Required",
  message,
  confirmText = "Continue",
  cancelText = "Cancel",
  onConfirm,
  onCancel
}: ConfirmModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
      <div className="bg-[#1e1f22] border border-[#333] rounded-xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col">
        <div className="p-6 flex flex-col items-center">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-amber-500/10 mb-4 shrink-0">
            <AlertTriangle size={24} className="text-amber-500" />
          </div>
          <h3 className="text-base font-semibold text-white text-center">{title}</h3>
          <p className="text-xs text-[#aaa] text-center mt-2.5 leading-relaxed">
            {message}
          </p>
        </div>
        <div className="flex border-t border-[#333] divide-x divide-[#333]">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-4 py-3 text-xs font-semibold text-[#888] hover:text-white hover:bg-[#25262b] transition-colors"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 px-4 py-3 text-xs font-semibold text-amber-500 hover:text-amber-400 hover:bg-[#25262b] transition-colors"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
