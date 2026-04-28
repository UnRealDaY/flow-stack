<?php

namespace App\Jobs;

use App\Models\User;
use App\Services\EventPublisher;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Laravel\Cashier\Subscription;

class ProcessStripeEvent implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;
    public int $backoff = 30;

    public function __construct(
        private readonly string $eventId,
        private readonly string $eventType,
        private readonly array $data,
    ) {}

    public function handle(): void
    {
        match ($this->eventType) {
            'invoice.payment_succeeded'     => $this->onPaymentSucceeded(),
            'invoice.payment_failed'        => $this->onPaymentFailed(),
            'customer.subscription.deleted' => $this->onSubscriptionDeleted(),
            default => Log::info("Unhandled Stripe event: {$this->eventType}"),
        };
    }

    // ── invoice.payment_succeeded ─────────────────────────────────────────────

    private function onPaymentSucceeded(): void
    {
        $customerId = $this->data['customer'] ?? null;
        if (!$customerId) {
            return;
        }

        $user = User::where('stripe_id', $customerId)->first();
        if (!$user) {
            Log::warning("ProcessStripeEvent: no user for customer {$customerId}");
            return;
        }

        // Cashier syncs subscription status automatically on webhook; we just
        // publish an internal event so realtime/core-api can react.
        EventPublisher::payment($user->workspace_id, 'payment_succeeded');

        Log::info("payment_succeeded for workspace {$user->workspace_id}");
    }

    // ── invoice.payment_failed ────────────────────────────────────────────────

    private function onPaymentFailed(): void
    {
        $customerId = $this->data['customer'] ?? null;
        if (!$customerId) {
            return;
        }

        $user = User::where('stripe_id', $customerId)->first();
        if (!$user) {
            Log::warning("ProcessStripeEvent: no user for customer {$customerId}");
            return;
        }

        // Mark the Cashier subscription as past_due so the app can gate features.
        $sub = $user->subscriptions()->active()->first();
        if ($sub) {
            $sub->stripe_status = Subscription::STATUS_PAST_DUE;
            $sub->save();
        }

        EventPublisher::payment($user->workspace_id, 'payment_failed');

        Log::warning("payment_failed for workspace {$user->workspace_id}");
    }

    // ── customer.subscription.deleted ─────────────────────────────────────────

    private function onSubscriptionDeleted(): void
    {
        $stripeSubId = $this->data['id'] ?? null;
        if (!$stripeSubId) {
            return;
        }

        $sub = Subscription::where('stripe_id', $stripeSubId)->with('user')->first();
        if (!$sub) {
            Log::warning("ProcessStripeEvent: no subscription for stripe_id {$stripeSubId}");
            return;
        }

        // Cashier will have already set ends_at; we publish the event so
        // core-api can downgrade the workspace plan to free.
        EventPublisher::payment($sub->user->workspace_id, 'subscription_deleted');

        Log::info("subscription_deleted for workspace {$sub->user->workspace_id}");
    }
}
