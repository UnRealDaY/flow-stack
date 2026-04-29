'use client';

import React, { useState } from 'react';
import {
  Alert, Box, Button, Card, CardContent, CardHeader, Chip,
  CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle,
  Divider, List, ListItem, ListItemText, Skeleton, Stack, Typography,
} from '@mui/material';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';
import {
  useSubscription, usePlans, useInvoices,
  useCancelSubscription, useResumeSubscription, useCheckout,
  Plan,
} from '@/hooks/useBilling';
import { extractMessage } from '@/lib/api';
import { ErrorBoundary } from '@/components/ErrorBoundary';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_KEY ?? '');

// ── Checkout form (inside Stripe Elements) ────────────────────────────────

function CheckoutForm({ plan, onSuccess, onClose }: { plan: Plan; onSuccess: () => void; onClose: () => void }) {
  const stripe   = useStripe();
  const elements = useElements();
  const checkout = useCheckout();
  const [error, setError]       = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setSubmitting(true);
    setError(null);

    const { error: stripeErr, paymentMethod } = await stripe.createPaymentMethod({ elements });
    if (stripeErr || !paymentMethod) {
      setError(stripeErr?.message ?? 'Card error.');
      setSubmitting(false);
      return;
    }

    try {
      await checkout.mutateAsync({ plan: plan.name, payment_method_id: paymentMethod.id });
      toast.success('Subscription activated!');
      onSuccess();
    } catch (err) {
      setError(extractMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <Typography variant="subtitle2" sx={{ mb: 2 }}>
        Subscribing to <strong>{plan.name.toUpperCase()}</strong> —{' '}
        ${(plan.price / 100).toFixed(2)}/{plan.interval ?? 'mo'}
      </Typography>
      <PaymentElement />
      {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
      <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{ mt: 3 }}>
        <Button onClick={onClose} disabled={submitting}>Cancel</Button>
        <Button type="submit" variant="contained" disabled={submitting || !stripe}>
          {submitting ? <CircularProgress size={18} /> : 'Subscribe'}
        </Button>
      </Stack>
    </Box>
  );
}

// ── Upgrade dialog ─────────────────────────────────────────────────────────

function UpgradeDialog({ plan, open, onClose }: { plan: Plan | null; open: boolean; onClose: () => void }) {
  if (!plan) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Upgrade to {plan.name.toUpperCase()}</DialogTitle>
      <DialogContent>
        <Elements stripe={stripePromise} options={{ mode: 'subscription', currency: plan.currency, amount: plan.price }}>
          <CheckoutForm plan={plan} onSuccess={onClose} onClose={onClose} />
        </Elements>
      </DialogContent>
    </Dialog>
  );
}

// ── Current subscription card ─────────────────────────────────────────────

function SubscriptionCard() {
  const { data, isLoading }  = useSubscription();
  const cancel = useCancelSubscription();
  const resume = useResumeSubscription();
  const sub    = data?.subscription;

  const handleCancel = async () => {
    try {
      await cancel.mutateAsync();
      toast.success('Subscription will cancel at period end.');
    } catch (err) { toast.error(extractMessage(err)); }
  };

  const handleResume = async () => {
    try {
      await resume.mutateAsync();
      toast.success('Subscription resumed!');
    } catch (err) { toast.error(extractMessage(err)); }
  };

  return (
    <Card>
      <CardHeader title="Current plan" />
      <Divider />
      <CardContent>
        {isLoading ? (
          <Stack spacing={1}><Skeleton height={24} /><Skeleton height={24} width="60%" /></Stack>
        ) : !sub ? (
          <Typography color="text.secondary">No active subscription. Upgrade below.</Typography>
        ) : (
          <Stack spacing={2}>
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography variant="h6">{sub.type?.toUpperCase() ?? 'PRO'}</Typography>
              <Chip
                label={sub.stripe_status}
                color={sub.active ? 'success' : sub.on_grace ? 'warning' : 'default'}
                size="small"
              />
              {sub.on_trial && <Chip label="Trial" color="info" size="small" />}
            </Stack>

            {sub.trial_ends_at && (
              <Typography variant="body2" color="text.secondary">
                Trial ends: {dayjs(sub.trial_ends_at).format('MMM D, YYYY')}
              </Typography>
            )}
            {sub.ends_at && (
              <Typography variant="body2" color={sub.on_grace ? 'warning.main' : 'text.secondary'}>
                {sub.on_grace ? 'Cancels' : 'Renews'}: {dayjs(sub.ends_at).format('MMM D, YYYY')}
              </Typography>
            )}

            <Stack direction="row" spacing={1}>
              {sub.active && !sub.canceled && (
                <Button variant="outlined" color="error" size="small" onClick={handleCancel} loading={cancel.isPending}>
                  Cancel subscription
                </Button>
              )}
              {sub.on_grace && (
                <Button variant="contained" size="small" onClick={handleResume} loading={resume.isPending}>
                  Resume subscription
                </Button>
              )}
            </Stack>
          </Stack>
        )}
      </CardContent>
    </Card>
  );
}

// ── Plans list ─────────────────────────────────────────────────────────────

function PlansCard() {
  const { data, isLoading } = usePlans();
  const [selected, setSelected] = useState<Plan | null>(null);
  const plans = data?.data ?? [];

  return (
    <>
      <Card>
        <CardHeader title="Available plans" />
        <Divider />
        <CardContent>
          {isLoading ? (
            <Stack spacing={1}>{Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} height={80} />)}</Stack>
          ) : (
            <Stack spacing={2}>
              {plans.filter((p) => p.name !== 'free').map((plan) => (
                <Box key={plan.id} sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: 2 }}>
                  <Stack direction="row" alignItems="center" justifyContent="space-between">
                    <Box>
                      <Typography variant="subtitle1" fontWeight={600}>{plan.name.toUpperCase()}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        ${(plan.price / 100).toFixed(2)}/{plan.interval ?? 'mo'}
                      </Typography>
                    </Box>
                    <Button variant="contained" size="small" onClick={() => setSelected(plan)}>
                      Upgrade
                    </Button>
                  </Stack>
                </Box>
              ))}
            </Stack>
          )}
        </CardContent>
      </Card>

      <UpgradeDialog plan={selected} open={!!selected} onClose={() => setSelected(null)} />
    </>
  );
}

// ── Invoice history ────────────────────────────────────────────────────────

function InvoicesCard() {
  const { data, isLoading } = useInvoices();
  const invoices = data?.data ?? [];

  return (
    <Card>
      <CardHeader title="Invoice history" />
      <Divider />
      <CardContent sx={{ p: 0 }}>
        {isLoading ? (
          <Stack spacing={1} sx={{ p: 2 }}>{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} height={40} />)}</Stack>
        ) : !invoices.length ? (
          <Box sx={{ p: 3 }}><Typography color="text.secondary">No invoices yet.</Typography></Box>
        ) : (
          <List disablePadding>
            {invoices.map((inv) => (
              <ListItem
                key={inv.id}
                divider
                secondaryAction={
                  <Button
                    size="small"
                    endIcon={<OpenInNewIcon fontSize="small" />}
                    href={inv.invoice_pdf}
                    target="_blank"
                    rel="noopener"
                  >
                    PDF
                  </Button>
                }
              >
                <ListItemText
                  primary={inv.total}
                  secondary={dayjs(inv.date).format('MMM D, YYYY')}
                />
                <Chip label={inv.paid ? 'Paid' : 'Unpaid'} color={inv.paid ? 'success' : 'error'} size="small" sx={{ mr: 6 }} />
              </ListItem>
            ))}
          </List>
        )}
      </CardContent>
    </Card>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function BillingPage() {
  return (
    <ErrorBoundary>
      <Typography variant="h4" sx={{ mb: 3 }}>Billing</Typography>
      <Stack spacing={3}>
        <SubscriptionCard />
        <PlansCard />
        <InvoicesCard />
      </Stack>
    </ErrorBoundary>
  );
}
