<?php

namespace Tests\Feature;

use App\Models\StripeEvent;
use App\Models\User;
use Tests\TestCase;
use Illuminate\Support\Str;

class WebhookControllerTest extends TestCase
{
    private string $secret = 'whsec_fake';

    private function buildPayload(array $body): array
    {
        $json = json_encode($body);
        $ts   = time();
        $sig  = hash_hmac('sha256', "{$ts}.{$json}", $this->secret);

        return [
            'body'    => $json,
            'headers' => [
                'Stripe-Signature' => "t={$ts},v1={$sig}",
                'Content-Type'     => 'application/json',
            ],
        ];
    }

    public function test_webhook_missing_signature_returns_400(): void
    {
        $response = $this->postJson('/api/webhook/stripe', ['type' => 'test']);
        $response->assertStatus(400);
    }

    public function test_webhook_invalid_signature_returns_400(): void
    {
        $response = $this->withHeaders([
            'Stripe-Signature' => 't=1234,v1=badsig',
        ])->postJson('/api/webhook/stripe', ['type' => 'test']);

        $response->assertStatus(400);
    }

    public function test_duplicate_event_is_ignored_with_200(): void
    {
        $eventId = 'evt_' . Str::random(16);

        StripeEvent::create([
            'stripe_event_id' => $eventId,
            'type'            => 'invoice.payment_succeeded',
            'processed_at'    => now(),
        ]);

        $payload = ['id' => $eventId, 'type' => 'invoice.payment_succeeded', 'data' => ['object' => []]];
        $req     = $this->buildPayload($payload);

        $response = $this->withHeaders($req['headers'])
            ->call('POST', '/api/webhook/stripe', [], [], [], [], $req['body']);

        $response->assertStatus(200);
        $response->assertJson(['message' => 'Already processed.']);
    }

    public function test_new_event_is_stored_and_queued(): void
    {
        $eventId = 'evt_' . Str::random(16);
        $payload = [
            'id'   => $eventId,
            'type' => 'invoice.payment_succeeded',
            'data' => ['object' => ['customer' => 'cus_test']],
        ];
        $req = $this->buildPayload($payload);

        $response = $this->withHeaders($req['headers'])
            ->call('POST', '/api/webhook/stripe', [], [], [], [], $req['body']);

        $response->assertStatus(202);
        $this->assertDatabaseHas('stripe_events', ['stripe_event_id' => $eventId]);
    }
}
