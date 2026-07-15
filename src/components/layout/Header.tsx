"use client";
import { useState, useRef, useEffect } from 'react';
import { useRouter as useNavigate } from 'next/navigation';
import { useCadStore }  from '@/store/useCadStore';

const roleBadgeColor: Record<string, string> = {
  admin: 'bg-red-100 text-red-600',
  staff: 'bg-yellow-100 text-yellow-600',
  user: 'bg-indigo-100 text-indigo-600',
};

export default function Header({ user, onMenuToggle }: { user: any; onMenuToggle: () => void }) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: any) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as any)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = () => {
    const role = localStorage.getItem("role");

    try {
      useCadStore.getState().clearDrawing();
    } catch (e) {
      console.error("Failed to clear drawing store on logout", e);
    }

    localStorage.removeItem('precision-cad-storage');
    localStorage.clear();

    if (role === "admin" || role === "staff") {
      navigate.push("/admin-login");
    } else {
      navigate.push("/login");
    }
  };

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-10">
      {/* Left: hamburger + title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="lg:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100"
          aria-label="Toggle menu"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <h1 className="text-base font-semibold text-gray-800 capitalize">
          {user?.role ? `${user.role} Dashboard` : 'Dashboard'}
        </h1>
      </div>

      {/* Right: avatar dropdown */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <div className="w-8 h-8 rounded-full bg-indigo-500 text-white flex items-center justify-center text-sm font-bold overflow-hidden">
            {user?.profilePicUrl ? (
              <img src={user.profilePicUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              user?.name?.charAt(0).toUpperCase()
            )}
          </div>
          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {open && (
          <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50">
            <div className="px-4 py-3 border-b border-gray-100">
              <p className="text-sm font-semibold text-gray-800">{user?.name}</p>
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
              <span className={`inline-block mt-1.5 text-xs font-medium px-2 py-0.5 rounded-full capitalize ${roleBadgeColor[user?.role] || 'bg-gray-100 text-gray-600'}`}>
                {user?.role}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
