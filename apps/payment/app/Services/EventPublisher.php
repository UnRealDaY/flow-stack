<?php

namespace App\Services;

use Illuminate\Support\Facades\Redis;
use PHPUnit\Framework\Assert;

class EventPublisher
{
    /** @var array<array{workspaceId: string, status: string, plan: string|null}>|null */
    private static ?array $recorded = null;

    // ── Test helpers ──────────────────────────────────────────────────────────

    public static function fake(): void
    {
        static::$recorded = [];
    }

    public static function assertPublished(string $workspaceId, string $status, ?string $plan = null): void
    {
        Assert::assertNotNull(static::$recorded, 'EventPublisher::fake() was not called.');

        $found = collect(static::$recorded)->contains(function ($e) use ($workspaceId, $status, $plan) {
            return $e['workspaceId'] === $workspaceId
                && $e['status'] === $status
                && $e['plan'] === $plan;
        });

        Assert::assertTrue(
            $found,
            "No EventPublisher::payment() call for workspace={$workspaceId} status={$status}."
        );
    }

    public static function reset(): void
    {
        static::$recorded = null;
    }

    // ── Real implementations ──────────────────────────────────────────────────

    /**
     * Publish a payment status change so the realtime service can push it to connected clients.
     */
    public static function payment(string $workspaceId, string $status, ?string $plan = null): void
    {
        if (static::$recorded !== null) {
            static::$recorded[] = ['workspaceId' => $workspaceId, 'status' => $status, 'plan' => $plan];
            return;
        }

        $data = ['status' => $status];
        if ($plan !== null) {
            $data['plan'] = $plan;
        }

        static::publish($workspaceId, 'payment:updated', $data);
    }

    public static function publish(string $workspaceId, string $event, array $data): void
    {
        if (static::$recorded !== null) {
            return; // in fake mode, only payment() calls are recorded
        }

        Redis::publish('events', json_encode([
            'channel' => "workspace:{$workspaceId}",
            'event'   => $event,
            'data'    => $data,
        ]));
    }
}
