import { z } from 'zod';

export const searchCafesSchema = z.object({
  query: z.string().min(1, 'Search query is required'),
  limit: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 20)),
});

export const searchUsersSchema = z.object({
  query: z.string().min(1, 'Search query is required'),
  limit: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 20)),
});

export type SearchCafesInput = z.infer<typeof searchCafesSchema>;
export type SearchUsersInput = z.infer<typeof searchUsersSchema>;
