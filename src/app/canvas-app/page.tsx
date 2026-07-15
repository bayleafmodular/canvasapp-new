"use client";
import PrivateRoute from '@/components/PrivateRoute';
import Layout from '@/components/layout/Layout';
import CanvasEditor from '@/canvasApp/CanvasEditor';

function CanvasAppPage_Inner() {
  return (
    <Layout fullScreen>
      <CanvasEditor />
    </Layout>
  );
}

export default function CanvasAppPage() {
  return (
    <PrivateRoute allowedRoles={['admin', 'staff', 'user']}>
      <CanvasAppPage_Inner />
    </PrivateRoute>
  );
}
