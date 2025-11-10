import { z } from 'zod';

export const nearbyCafesSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  radiusKm: z.number().min(0.5).max(50).optional(),
  sortBy: z.enum(['FOOD', 'DRINKS', 'AMBIENCE', 'SERVICE']).optional(),
  page: z.number().int().min(1).optional(),
  limit: z.number().int().min(1).max(100).optional(),
});

export const searchCafesSchema = z.object({
  query: z.string().min(1),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
});

export type NearbyCafesInput = z.infer<typeof nearbyCafesSchema>;
export type SearchCafesInput = z.infer<typeof searchCafesSchema>;
