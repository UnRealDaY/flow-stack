import { z } from 'zod';

export const UpdateMeDto = z.object({
  name: z.string().min(1).max(100).trim().optional(),
  email: z.string().email().optional(),
});

export type UpdateMeDto = z.infer<typeof UpdateMeDto>;
