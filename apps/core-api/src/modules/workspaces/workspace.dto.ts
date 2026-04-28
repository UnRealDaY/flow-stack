import { z } from 'zod';

export const CreateWorkspaceDto = z.object({
  name: z.string().min(1).max(100).trim(),
  slug: z
    .string()
    .min(2)
    .max(50)
    .regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
});

export const UpdateWorkspaceDto = z.object({
  name: z.string().min(1).max(100).trim().optional(),
});

export type CreateWorkspaceDto = z.infer<typeof CreateWorkspaceDto>;
export type UpdateWorkspaceDto = z.infer<typeof UpdateWorkspaceDto>;
