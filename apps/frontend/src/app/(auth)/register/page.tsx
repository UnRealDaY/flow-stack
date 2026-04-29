'use client';

import React from 'react';
import NextLink from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import {
  Button, Card, CardContent, Divider,
  Link, Stack, TextField, Typography,
} from '@mui/material';
import { useAuth } from '@/lib/auth';
import { extractMessage } from '@/lib/api';

const schema = z.object({
  name:     z.string().min(2, 'At least 2 characters'),
  email:    z.string().email('Invalid email'),
  password: z.string().min(8, 'At least 8 characters'),
});
type Form = z.infer<typeof schema>;

export default function RegisterPage() {
  const { register: signUp } = useAuth();
  const router = useRouter();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Form>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: Form) => {
    try {
      await signUp(data.name, data.email, data.password);
      toast.success('Account created! Welcome to FlowStack.');
      router.push('/');
    } catch (err) {
      toast.error(extractMessage(err));
    }
  };

  return (
    <Card sx={{ width: '100%', maxWidth: 420 }}>
      <CardContent sx={{ p: 4 }}>
        <Typography variant="h5" gutterBottom>Create your account</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Free plan, no credit card required.
        </Typography>

        <Stack component="form" onSubmit={handleSubmit(onSubmit)} spacing={2}>
          <TextField
            label="Full name"
            autoComplete="name"
            fullWidth
            {...register('name')}
            error={!!errors.name}
            helperText={errors.name?.message}
          />
          <TextField
            label="Email"
            type="email"
            autoComplete="email"
            fullWidth
            {...register('email')}
            error={!!errors.email}
            helperText={errors.email?.message}
          />
          <TextField
            label="Password"
            type="password"
            autoComplete="new-password"
            fullWidth
            {...register('password')}
            error={!!errors.password}
            helperText={errors.password?.message}
          />

          <Button type="submit" variant="contained" size="large" fullWidth loading={isSubmitting}>
            Create account
          </Button>
        </Stack>

        <Divider sx={{ my: 3 }} />
        <Typography variant="body2" textAlign="center">
          Already have an account?{' '}
          <Link component={NextLink} href="/login">Sign in</Link>
        </Typography>
      </CardContent>
    </Card>
  );
}
