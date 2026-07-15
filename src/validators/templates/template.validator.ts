import { z } from 'zod';

export const createTemplateSchema = z.object({
  name: z.string().trim().min(1, 'Template name is required'),
  category: z.string().trim().nullable().optional(),
  description: z.string().trim().nullable().optional(),
  status: z.enum(['active', 'draft', 'deleted', 'hidden']).optional(),
  objects: z.array(z.any()).optional(),
  layers: z.array(z.any()).optional(),
});

export const updateTemplateSchema = z.object({
  name: z.string().trim().min(1, 'Template name cannot be empty').optional(),
  category: z.string().trim().nullable().optional(),
  description: z.string().trim().nullable().optional(),
  status: z.enum(['active', 'draft', 'deleted', 'hidden']).optional(),
  objects: z.array(z.any()).optional(),
  layers: z.array(z.any()).optional(),
});

export type CreateTemplateInput = z.infer<typeof createTemplateSchema>;
export type UpdateTemplateInput = z.infer<typeof updateTemplateSchema>;
