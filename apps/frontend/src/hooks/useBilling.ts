import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

const PAYMENT_BASE = process.env.NEXT_PUBLIC_API_URL?.replace('4000', '4002') ?? 'http://localhost:4002';

export type Subscription = {
  type: string;
  stripe_status: string;
  trial_ends_at: string | null;
  ends_at: string | null;
  on_trial: boolean;
  on_grace: boolean;
  active: boolean;
  canceled: boolean;
};

export type Plan = {
  id: number;
  name: string;
  price: number;
  currency: string;
  interval: string | null;
  stripe_price_id: string | null;
  features: string[];
};

export type Invoice = {
  id: string;
  total: string;
  date: string;
  paid: boolean;
  invoice_pdf: string;
};

const call = <T,>(path: string) =>
  api.get<T>(`${PAYMENT_BASE}/api${path}`, { baseURL: '' }).then((r) => r.data);

const post = <T,>(path: string, data?: unknown) =>
  api.post<T>(`${PAYMENT_BASE}/api${path}`, data, { baseURL: '' }).then((r) => r.data);

export function useSubscription() {
  return useQuery<{ subscription: Subscription | null }>({
    queryKey: ['subscription'],
    queryFn: () => call('/subscription'),
  });
}

export function usePlans() {
  return useQuery<{ data: Plan[] }>({
    queryKey: ['plans'],
    queryFn: () => call('/plans'),
  });
}

export function useInvoices() {
  return useQuery<{ data: Invoice[]; meta: object }>({
    queryKey: ['invoices'],
    queryFn: () => call('/subscription/invoices'),
  });
}

export function useCancelSubscription() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => post('/subscription/cancel'),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['subscription'] }),
  });
}

export function useResumeSubscription() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => post('/subscription/resume'),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['subscription'] }),
  });
}

export function useCheckout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { plan: string; payment_method_id: string }) =>
      post('/subscription/checkout', payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['subscription'] }),
  });
}
