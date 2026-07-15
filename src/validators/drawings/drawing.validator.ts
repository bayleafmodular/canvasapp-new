import { z } from 'zod';

export const createDrawingSchema = z.object({
  name: z.string().trim().min(1, 'Drawing name is required'),
  data: z.object({
    objects: z.array(z.any()),
  }).passthrough(),
});

export const updateDrawingSchema = z.object({
  name: z.string().trim().min(1, 'Drawing name cannot be empty').optional(),
  data: z.object({
    objects: z.array(z.any()),
  }).passthrough().optional(),
});

export type CreateDrawingInput = z.infer<typeof createDrawingSchema>;
export type UpdateDrawingInput = z.infer<typeof updateDrawingSchema>;
