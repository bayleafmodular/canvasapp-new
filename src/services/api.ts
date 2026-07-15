import axios from 'axios';

// FROM:
// const api = axios.create({ baseURL: process.env.NEXT_PUBLIC_API_BASE_URL });

// TO (routes calls directly to your Next.js server):
const api = axios.create({ baseURL: '/api' });


// Attach token to every request if present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const registerUser = (data: any) => api.post('/auth/register', data);
export const loginUser = (data: any) => api.post('/auth/login', data);
export const verifyLoginTwoFactor = (data: any) => api.post('/auth/verify-login-2fa', data);
export const forgotPassword = (data: any) => api.post('/auth/forgot-password', data);
export const resetPassword = (data: any) => api.post('/auth/reset-password', data);
export const oauthLogin = (data: any) => api.post('/auth/oauth-login', data);
export const linkGoogleAccount = (data: any) => api.post('/auth/link-google', data);
export const getMe = () => api.get('/auth/me');
export const updateProfile = (data: any) => api.patch('/auth/profile', data);
export const updatePassword = (data: any) => api.patch('/auth/password', data);
export const updateTwoFactor = (enabled: boolean) => api.patch('/auth/2fa', { enabled });
export const verifyOtp = (data: any) => api.post('/auth/verify-otp', data);
export const resendOtp = (data: any) => api.post('/auth/resend-otp', data);
export const getAdminStats = () => api.get('/admin/dashboard-stats');
export const getAdminUsers = () => api.get('/admin/users');
export const createAdminUser = (data: any) => api.post('/admin/users', data);
export const updateUserRole = (id: string, role: string) => api.patch(`/admin/users/${id}/role`, { role });
export const deleteUser = (id: string) => api.delete(`/admin/users/${id}`);
export const getStaffUsers = () => api.get('/admin/staff');
export const createStaffUser = (data: any) => api.post('/admin/staff', data);
export const updateStaffUser = (id: string, data: any) => api.patch(`/admin/staff/${id}`, data);
export const getDrawings = () => api.get('/drawings');
export const createDrawing = (data: any) => api.post('/drawings', data);
export const getDrawing = (id: string) => api.get(`/drawings/${id}`);
export const updateDrawing = (id: string, data: any) => api.patch(`/drawings/${id}`, data);
export const deleteDrawing = (id: string) => api.delete(`/drawings/${id}`);
export const getPricingSettings = () => api.get('/pricing');
export const updatePricingSettings = (data: any) => api.patch('/pricing', data);

// Orders APIs
export const createOrder = (data: any) => api.post('/orders', data);
export const getAdminOrders = () => api.get('/admin/orders');
export const updateAdminOrderStatus = (id: string, status: string, remarks: string) => api.patch(`/admin/orders/${id}`, { status, remarks });
export const getUserOrders = () => api.get('/orders');

// Templates APIs
export const getAdminTemplates = () => api.get('/templates');
export const getAdminTemplateById = (id: string) => api.get(`/templates/${id}`);
export const createAdminTemplate = (data: any) => api.post('/templates', data);
export const updateAdminTemplate = (id: string, data: any) => api.patch(`/templates/${id}`, data);
export const deleteAdminTemplate = (id: string) => api.delete(`/templates/${id}`);
