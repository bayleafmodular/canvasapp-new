"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface PrivateRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
  requiredPermission?: string;
}

const getPermissions = (): Record<string, boolean> => {
  try {
    return JSON.parse(localStorage.getItem('permissions') || '{}');
  } catch {
    return {};
  }
};

const checkAuthSynchronously = (allowedRoles?: string[], requiredPermission?: string) => {
  if (typeof window === 'undefined' || !(window as any).__is_hydrated) return false;
  
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');
  const permissions = getPermissions();

  if (!token) return false;
  if (allowedRoles && (!role || !allowedRoles.includes(role))) return false;
  if (role !== 'admin' && requiredPermission && !permissions[requiredPermission]) return false;
  
  return true;
};

const PrivateRoute: React.FC<PrivateRouteProps> = ({ 
  children, 
  allowedRoles, 
  requiredPermission 
}) => {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(() => 
    checkAuthSynchronously(allowedRoles, requiredPermission)
  );

  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).__is_hydrated = true;
    }

    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    const permissions = getPermissions();

    if (!token) {
      router.replace('/login');
      return;
    }

    if (allowedRoles && (!role || !allowedRoles.includes(role))) {
      router.replace('/login');
      return;
    }

    if (role !== 'admin' && requiredPermission && !permissions[requiredPermission]) {
      router.replace('/staff-dashboard');
      return;
    }

    setIsAuthorized(true);
  }, [allowedRoles, requiredPermission, router]);

  if (!isAuthorized) return null;

  return <>{children}</>;
};

export default PrivateRoute;
