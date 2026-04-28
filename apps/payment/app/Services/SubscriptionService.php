<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\Redis;

class SubscriptionService
{
    public function startTrial(User $user, string $plan): void
    {
        $user->newSubscription($plan, config("services.stripe.plans.$plan"))
            ->trialDays(14)
            ->create();

        $this->publishEvent($user->workspace_id, 'payment:updated', [
            'status' => 'trialing',
            'plan' => $plan,
        ]);
    }

    public function subscribe(User $user, string $plan, string $paymentMethod): void
    {
        $user->updateDefaultPaymentMethod($paymentMethod);

        $user->newSubscription($plan, config("services.stripe.plans.$plan"))->create($paymentMethod);

        $this->publishEvent($user->workspace_id, 'payment:updated', [
            'status' => 'active',
            'plan' => $plan,
        ]);
    }

    public function cancel(User $user): void
    {
        $user->subscription()->cancelAtPeriodEnd();

        $this->publishEvent($user->workspace_id, 'payment:updated', ['status' => 'canceled']);
    }

    public function resume(User $user): void
    {
        $user->subscription()->resume();

        $this->publishEvent($user->workspace_id, 'payment:updated', ['status' => 'active']);
    }

    private function publishEvent(string $workspaceId, string $event, array $data): void
    {
        Redis::publish('events', json_encode([
            'channel' => "workspace:$workspaceId",
            'event'   => $event,
            'data'    => $data,
        ]));
    }
}
