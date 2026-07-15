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

const PrivateRoute: React.FC<PrivateRouteProps> = ({ 
  children, 
  allowedRoles, 
  requiredPermission 
}) => {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
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
