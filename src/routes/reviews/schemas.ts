import { z } from 'zod';

export const createReviewSchema = z.object({
  cafeId: z.string().uuid(),
  foodRating: z.number().min(1).max(5),
  drinksRating: z.number().min(1).max(5),
  ambienceRating: z.number().min(1).max(5),
  serviceRating: z.number().min(1).max(5),
  comment: z.string().optional(),
  photos: z.array(z.string().url()).optional(),
  moodTags: z.array(z.string()).optional(),
});

export const updateReviewSchema = z.object({
  foodRating: z.number().min(1).max(5).optional(),
  drinksRating: z.number().min(1).max(5).optional(),
  ambienceRating: z.number().min(1).max(5).optional(),
  serviceRating: z.number().min(1).max(5).optional(),
  comment: z.string().optional(),
  photos: z.array(z.string().url()).optional(),
  moodTags: z.array(z.string()).optional(),
});

export type CreateReviewInput = z.infer<typeof createReviewSchema>;
export type UpdateReviewInput = z.infer<typeof updateReviewSchema>;
