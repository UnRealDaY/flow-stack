'use client';

import React from 'react';
import NextLink from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import {
  Box, Button, Card, CardContent, Divider,
  Link, Stack, TextField, Typography,
} from '@mui/material';
import { useAuth } from '@/lib/auth';
import { extractMessage } from '@/lib/api';

const schema = z.object({
  email:    z.string().email('Invalid email'),
  password: z.string().min(1, 'Required'),
});
type Form = z.infer<typeof schema>;

export default function LoginPage() {
  const { login } = useAuth();
  const router     = useRouter();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Form>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: Form) => {
    try {
      await login(data.email, data.password);
      router.push('/');
    } catch (err) {
      toast.error(extractMessage(err));
    }
  };

  return (
    <Card sx={{ width: '100%', maxWidth: 420 }}>
      <CardContent sx={{ p: 4 }}>
        <Typography variant="h5" gutterBottom>Sign in to FlowStack</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Welcome back! Enter your credentials to continue.
        </Typography>

        <Stack component="form" onSubmit={handleSubmit(onSubmit)} spacing={2}>
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
            autoComplete="current-password"
            fullWidth
            {...register('password')}
            error={!!errors.password}
            helperText={errors.password?.message}
          />

          <Box sx={{ textAlign: 'right' }}>
            <Link component={NextLink} href="/forgot-password" variant="body2">
              Forgot password?
            </Link>
          </Box>

          <Button type="submit" variant="contained" size="large" fullWidth loading={isSubmitting}>
            Sign in
          </Button>
        </Stack>

        <Divider sx={{ my: 3 }} />
        <Typography variant="body2" textAlign="center">
          Don&apos;t have an account?{' '}
          <Link component={NextLink} href="/register">Create one</Link>
        </Typography>
      </CardContent>
    </Card>
  );
}
