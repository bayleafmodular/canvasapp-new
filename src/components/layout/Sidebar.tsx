"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { DraftingCompass, LayoutDashboard, Settings, Users, UserCog, ClipboardList, LayoutTemplate } from 'lucide-react';

const navItems: Record<string, any[]> = {
  admin: [
    { label: 'Dashboard', path: '/admin-dashboard', icon: LayoutDashboard, permission: 'dashboard.show' },
    { label: 'Manage Staff', path: '/admin-dashboard/staff', icon: UserCog, permission: 'staff.show' },
    { label: 'Manage Users', path: '/admin-dashboard/users', icon: Users, permission: 'users.show' },
    { label: 'Orders', path: '/admin-dashboard/orders', icon: ClipboardList },
    { label: 'Manage Templates', path: '/admin-dashboard/templates', icon: LayoutTemplate, permission: 'templates.show' },
    { label: 'Canvas App', path: '/canvas-app', icon: DraftingCompass },
    { label: 'Settings', path: '/settings', icon: Settings },
  ],
  staff: [
    { label: 'Dashboard', path: '/admin-dashboard', icon: LayoutDashboard, permission: 'dashboard.show' },
    { label: 'Manage Staff', path: '/admin-dashboard/staff', icon: UserCog, permission: 'staff.show' },
    { label: 'Manage Users', path: '/admin-dashboard/users', icon: Users, permission: 'users.show' },
    { label: 'Orders', path: '/admin-dashboard/orders', icon: ClipboardList },
    { label: 'Manage Templates', path: '/admin-dashboard/templates', icon: LayoutTemplate, permission: 'templates.show' },
    { label: 'Canvas App', path: '/canvas-app', icon: DraftingCompass },
    { label: 'Settings', path: '/settings', icon: Settings },
  ],
  user: [
    { label: 'Dashboard', path: '/user-dashboard', icon: LayoutDashboard },
    { label: 'Canvas App', path: '/canvas-app', icon: DraftingCompass },
    { label: 'Settings', path: '/settings', icon: Settings },
  ],
};

export default function Sidebar({ role, permissions = {}, isOpen, onClose, isCollapsed = false, onCollapseToggle }: { role: string | undefined; permissions?: any; isOpen: boolean; onClose: () => void; isCollapsed?: boolean; onCollapseToggle: () => void }) {
  const pathname = usePathname();
  const items = (navItems[role || 'user'] || navItems.user).filter((item: any) => {
    if (role === 'admin' || !item.permission) return true;
    return Boolean(permissions[item.permission]);
  });

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-[48] lg:hidden"
          onClick={onClose}
        />
      )}

      <aside className={`
        fixed top-0 left-0 h-full bg-gray-900 text-white z-[50] flex flex-col
        transform transition-all duration-300
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:z-auto
        ${isCollapsed ? 'w-20' : 'w-64'}
      `}>
        {/* Logo */}
        <div className={`flex items-center border-b border-gray-700 px-6 py-5 ${isCollapsed ? 'flex-col gap-3 justify-center px-2' : 'justify-between'}`}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center font-bold text-sm shrink-0">A</div>
            {!isCollapsed && <span className="text-lg font-semibold tracking-wide transition-opacity duration-300">MyApp</span>}
          </div>

          <button
            onClick={onCollapseToggle}
            className="hidden lg:flex p-1.5 rounded-lg text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
            title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {isCollapsed ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7M19 19l-7-7 7-7" />
              </svg>
            )}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {items.map(({ label, path, icon: Icon }: any) => {
            const isActive = pathname === path;
            return (
            <Link
              key={path}
              href={path}
              onClick={onClose}
              title={isCollapsed ? label : undefined}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors
                ${isActive
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                } ${isCollapsed ? 'justify-center px-2' : ''}`}
            >
              <Icon size={17} className="shrink-0" />
              {!isCollapsed && <span className="transition-opacity duration-300">{label}</span>}
            </Link>
          )})}
        </nav>

      </aside>
    </>
  );
}
