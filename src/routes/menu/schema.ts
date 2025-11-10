import { z } from 'zod';

export const createMenuItemSchema = z.object({
  cafePlaceId: z.string().min(1, 'Cafe place ID is required'),
  cafeName: z.string().min(1, 'Cafe name is required'),
  itemName: z.string().min(1, 'Item name is required'),
  itemType: z.enum(['food', 'drink'], {
    errorMap: () => ({ message: 'Item type must be either "food" or "drink"' }),
  }),
  rating: z.number().min(1).max(5, 'Rating must be between 1 and 5'),
  photos: z.array(z.string().url()).optional().default([]),
  notes: z.string().optional(),
});

export const updateMenuItemSchema = z.object({
  itemName: z.string().min(1).optional(),
  itemType: z.enum(['food', 'drink']).optional(),
  rating: z.number().min(1).max(5).optional(),
  photos: z.array(z.string().url()).optional(),
  notes: z.string().optional(),
});

export type CreateMenuItemInput = z.infer<typeof createMenuItemSchema>;
export type UpdateMenuItemInput = z.infer<typeof updateMenuItemSchema>;
