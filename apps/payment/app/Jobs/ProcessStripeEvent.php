<?php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

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
            'invoice.payment_succeeded' => $this->onPaymentSucceeded(),
            'invoice.payment_failed'    => $this->onPaymentFailed(),
            'customer.subscription.deleted' => $this->onSubscriptionDeleted(),
            default => Log::info("Unhandled Stripe event: {$this->eventType}"),
        };
    }

    private function onPaymentSucceeded(): void
    {
        // Update subscription status, send receipt email via job chain
    }

    private function onPaymentFailed(): void
    {
        // Notify user, mark subscription past_due
    }

    private function onSubscriptionDeleted(): void
    {
        // Downgrade workspace to free plan
    }
}
