import {
  getAdminTemplates,
  getAdminTemplateById,
  createAdminTemplate,
  updateAdminTemplate,
  deleteAdminTemplate
} from './api';

export const getTemplates = async (params?: any) => {
  const res = await getAdminTemplates(params);
  // Filter out deleted templates is now handled by the backend, but we just return res
  return res.data; // api.js returns axios response, backend returns { data: [...] } or { data: [...], total: ... }
};

export const getTemplateById = async (id: string) => {
  const res = await getAdminTemplateById(id);
  return res.data;
};

export const createTemplate = async (templateData: any) => {
  const res = await createAdminTemplate(templateData);
  return res.data;
};

export const updateTemplate = async (id: string, updateData: any) => {
  const res = await updateAdminTemplate(id, updateData);
  return res.data;
};

export const deleteTemplate = async (id: string) => {
  const res = await deleteAdminTemplate(id);
  return res.data;
};
