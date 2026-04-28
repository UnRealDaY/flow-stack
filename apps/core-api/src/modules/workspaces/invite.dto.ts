import { z } from 'zod';

export const SendInviteDto = z.object({
  email: z.string().email(),
  role: z.enum(['ADMIN', 'MEMBER']).default('MEMBER'),
});

export type SendInviteDto = z.infer<typeof SendInviteDto>;
