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

export default function Sidebar({ role, permissions = {}, isOpen, onClose }: { role: string | undefined; permissions?: any; isOpen: boolean; onClose: () => void }) {
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
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside className={`
        fixed top-0 left-0 h-full w-64 bg-gray-900 text-white z-30 flex flex-col
        transform transition-transform duration-300
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:z-auto
      `}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-700">
          <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center font-bold text-sm">A</div>
          <span className="text-lg font-semibold tracking-wide">MyApp</span>
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
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors
                ${isActive
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }`}
            >
              <Icon size={17} />
              {label}
            </Link>
          )})}
        </nav>

      </aside>
    </>
  );
}
