<?php

namespace App\Services;

use App\Models\User;
use Laravel\Cashier\Exceptions\IncompletePayment;

class SubscriptionService
{
    // ── Trial ─────────────────────────────────────────────────────────────────

    public function startTrial(User $user, string $plan): void
    {
        $user->newSubscription($plan, config("services.stripe.plans.{$plan}"))
            ->trialDays(14)
            ->create();

        EventPublisher::payment($user->workspace_id, 'trialing', $plan);
    }

    // ── Subscribe (trial → paid) ───────────────────────────────────────────────

    public function subscribe(User $user, string $plan, string $paymentMethodId): void
    {
        $user->updateDefaultPaymentMethod($paymentMethodId);

        try {
            $user->newSubscription($plan, config("services.stripe.plans.{$plan}"))
                ->create($paymentMethodId);
        } catch (IncompletePayment $e) {
            // 3-D Secure required — surface the payment intent client secret to the frontend
            throw $e;
        }

        EventPublisher::payment($user->workspace_id, 'active', $plan);
    }

    // ── Cancel (at period end — no immediate loss of access) ─────────────────

    public function cancel(User $user): void
    {
        $user->subscription()->cancelAtPeriodEnd();

        EventPublisher::payment($user->workspace_id, 'canceled');
    }

    // ── Resume (before period ends) ────────────────────────────────────────────

    public function resume(User $user): void
    {
        if (!$user->subscription()->onGracePeriod()) {
            throw new \RuntimeException('Subscription cannot be resumed — grace period has ended.');
        }

        $user->subscription()->resume();

        EventPublisher::payment($user->workspace_id, 'active');
    }

    // ── Refund ────────────────────────────────────────────────────────────────

    public function refundLastCharge(User $user): void
    {
        $invoice = $user->invoices()->first();
        if (!$invoice) {
            throw new \RuntimeException('No invoice found to refund.');
        }

        $user->refund($invoice->payment_intent);

        EventPublisher::payment($user->workspace_id, 'refunded');
    }
}
