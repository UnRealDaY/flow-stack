import { z } from 'zod';

export const RegisterDto = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(100),
  name: z.string().min(1).max(100).trim(),
});

export const LoginDto = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export type RegisterDto = z.infer<typeof RegisterDto>;
export type LoginDto = z.infer<typeof LoginDto>;
