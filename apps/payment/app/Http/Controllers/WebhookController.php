<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use App\Jobs\ProcessStripeEvent;
use App\Models\StripeEvent;
use Stripe\Webhook;
use Stripe\Exception\SignatureVerificationException;

class WebhookController extends Controller
{
    public function handle(Request $request)
    {
        $payload = $request->getContent();
        $sig = $request->header('Stripe-Signature');

        try {
            $event = Webhook::constructEvent($payload, $sig, config('services.stripe.webhook_secret'));
        } catch (SignatureVerificationException $e) {
            return response()->json(['error' => 'Invalid signature'], 400);
        }

        // Idempotency: ignore duplicate events
        if (StripeEvent::where('stripe_event_id', $event->id)->exists()) {
            return response()->json(['status' => 'duplicate'], 200);
        }

        StripeEvent::create(['stripe_event_id' => $event->id, 'type' => $event->type]);

        // Never block webhook response — dispatch async
        ProcessStripeEvent::dispatch($event->id, $event->type, $event->data->object->toArray());

        return response()->json(['status' => 'queued'], 200);
    }
}
