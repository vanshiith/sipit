import { z } from 'zod';

export const updateMoodSchema = z.object({
  moodMetric: z.enum(['FOOD', 'DRINKS', 'AMBIENCE', 'SERVICE']),
});

export const updateRadiusSchema = z.object({
  radiusKm: z.number().min(0.5).max(50),
});

export const updateNotificationsSchema = z.object({
  notifyNewCafes: z.boolean().optional(),
  notifyFriendActivity: z.boolean().optional(),
  notifyWeekly: z.boolean().optional(),
});

export type UpdateMoodInput = z.infer<typeof updateMoodSchema>;
export type UpdateRadiusInput = z.infer<typeof updateRadiusSchema>;
export type UpdateNotificationsInput = z.infer<typeof updateNotificationsSchema>;
