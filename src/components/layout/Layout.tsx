"use client";
import { useState, useEffect } from 'react';
import { useRouter as useNavigate } from 'next/navigation';
import Sidebar from './Sidebar';
import Header from './Header';
import Footer from './Footer';
import { getMe }  from '@/services/api';
import { useCadStore }  from '@/store/useCadStore';

export default function Layout({ children, fullScreen = false }: { children: React.ReactNode; fullScreen?: boolean }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState(() => {
    try {
      const cachedUser = localStorage.getItem('user');
      if (cachedUser) {
        return JSON.parse(cachedUser);
      }
      const role = localStorage.getItem('role');
      const permissions = JSON.parse(localStorage.getItem('permissions') || '{}');
      if (role) {
        return { role, permissions };
      }
    } catch {
      // Fallback if localStorage read fails
    }
    return null;
  });
  const navigate = useNavigate();

  useEffect(() => {
    const handleProfileUpdate = () => {
      try {
        const cachedUser = localStorage.getItem('user');
        if (cachedUser) {
          setUser(JSON.parse(cachedUser));
        }
      } catch (e) {
        console.error('Error handling profile update event:', e);
      }
    };

    window.addEventListener('user-profile-updated', handleProfileUpdate);

    getMe()
      .then((res) => {
        setUser(res.data);
        localStorage.setItem('user', JSON.stringify(res.data));
        localStorage.setItem('role', res.data.role);
        localStorage.setItem('permissions', JSON.stringify(res.data.permissions || {}));
      })
      .catch(() => {
        localStorage.removeItem('user');
        localStorage.removeItem('role');
        localStorage.removeItem('permissions');
        localStorage.removeItem('precision-cad-storage');
        try {
          useCadStore.getState().clearDrawing();
        } catch (e) {
          // ignore
        }
        navigate.push('/login');
      });

    return () => {
      window.removeEventListener('user-profile-updated', handleProfileUpdate);
    };
  }, [navigate]);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar
        role={user?.role}
        permissions={user?.permissions}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header
          user={user}
          onMenuToggle={() => setSidebarOpen((v) => !v)}
        />
        <main className={`relative flex-1 min-h-0 ${fullScreen ? 'p-0 overflow-hidden' : 'p-6 overflow-auto'}`}>
          {children}
        </main>
        {!fullScreen && <Footer />}
      </div>
    </div>
  );
}
