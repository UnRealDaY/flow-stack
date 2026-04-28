import { z } from 'zod';

export const UpdateMemberRoleDto = z.object({
  role: z.enum(['ADMIN', 'MEMBER']),
});

export type UpdateMemberRoleDto = z.infer<typeof UpdateMemberRoleDto>;
