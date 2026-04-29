'use client';

import React, { useState } from 'react';
import NextLink from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Alert, Button, Card, CardContent,
  Link, Stack, TextField, Typography,
} from '@mui/material';

const schema = z.object({ email: z.string().email('Invalid email') });
type Form = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Form>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (_data: Form) => {
    // TODO: wire to POST /api/v1/auth/forgot-password when implemented
    await new Promise((r) => setTimeout(r, 600));
    setSent(true);
  };

  return (
    <Card sx={{ width: '100%', maxWidth: 420 }}>
      <CardContent sx={{ p: 4 }}>
        <Typography variant="h5" gutterBottom>Reset your password</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Enter your email and we&apos;ll send a reset link.
        </Typography>

        {sent ? (
          <Alert severity="success">
            If that email exists, a reset link is on its way. Check your inbox.
          </Alert>
        ) : (
          <Stack component="form" onSubmit={handleSubmit(onSubmit)} spacing={2}>
            <TextField
              label="Email"
              type="email"
              fullWidth
              {...register('email')}
              error={!!errors.email}
              helperText={errors.email?.message}
            />
            <Button type="submit" variant="contained" size="large" fullWidth loading={isSubmitting}>
              Send reset link
            </Button>
          </Stack>
        )}

        <Typography variant="body2" textAlign="center" sx={{ mt: 3 }}>
          <Link component={NextLink} href="/login">Back to sign in</Link>
        </Typography>
      </CardContent>
    </Card>
  );
}
