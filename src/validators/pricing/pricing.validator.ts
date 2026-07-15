import { z } from 'zod';

export const updatePricingSchema = z.object({
  currency: z.string().trim().min(1, 'Currency is required').max(8, 'Currency is too long').optional(),
  rates: z.object({
    linePerMeter: z.number().min(0).optional(),
    polylinePerMeter: z.number().min(0).optional(),
    freeDrawPerMeter: z.number().min(0).optional(),
    wallPerMeter: z.number().min(0).optional(),
    beamPerMeter: z.number().min(0).optional(),
    lintelPerMeter: z.number().min(0).optional(),
    arcPerMeter: z.number().min(0).optional(),
    rectanglePerSqMeter: z.number().min(0).optional(),
    circlePerSqMeter: z.number().min(0).optional(),
  }).optional(),
});

export type UpdatePricingInput = z.infer<typeof updatePricingSchema>;
