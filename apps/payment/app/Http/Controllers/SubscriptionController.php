<?php

namespace App\Http\Controllers;

use App\Models\Plan;
use App\Services\SubscriptionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Laravel\Cashier\Exceptions\IncompletePayment;

class SubscriptionController extends Controller
{
    public function __construct(private readonly SubscriptionService $svc) {}

    // GET /subscription
    public function show(Request $request): JsonResponse
    {
        $user = $request->user();
        $sub  = $user->subscription();

        if (!$sub) {
            return response()->json(['subscription' => null]);
        }

        return response()->json([
            'subscription' => [
                'type'         => $sub->type,
                'stripe_id'    => $sub->stripe_id,
                'stripe_status'=> $sub->stripe_status,
                'stripe_price' => $sub->stripe_price,
                'quantity'     => $sub->quantity,
                'trial_ends_at'=> $sub->trial_ends_at,
                'ends_at'      => $sub->ends_at,
                'on_trial'     => $sub->onTrial(),
                'on_grace'     => $sub->onGracePeriod(),
                'active'       => $sub->active(),
                'canceled'     => $sub->canceled(),
            ],
        ]);
    }

    // POST /subscription/checkout  { plan, payment_method_id }
    public function checkout(Request $request): JsonResponse
    {
        $request->validate([
            'plan'              => 'required|string|in:pro,enterprise',
            'payment_method_id' => 'required|string',
        ]);

        try {
            $this->svc->subscribe(
                $request->user(),
                $request->input('plan'),
                $request->input('payment_method_id'),
            );
        } catch (IncompletePayment $e) {
            return response()->json([
                'requires_action'      => true,
                'payment_intent_secret' => $e->payment->client_secret,
            ], 402);
        }

        return response()->json(['message' => 'Subscription created.'], 201);
    }

    // POST /subscription/cancel
    public function cancel(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!$user->subscribed()) {
            return response()->json([
                'error' => ['code' => 'NOT_SUBSCRIBED', 'message' => 'No active subscription.'],
            ], 422);
        }

        $this->svc->cancel($user);

        return response()->json(['message' => 'Subscription will cancel at period end.']);
    }

    // POST /subscription/resume
    public function resume(Request $request): JsonResponse
    {
        $user = $request->user();

        try {
            $this->svc->resume($user);
        } catch (\RuntimeException $e) {
            return response()->json([
                'error' => ['code' => 'CANNOT_RESUME', 'message' => $e->getMessage()],
            ], 422);
        }

        return response()->json(['message' => 'Subscription resumed.']);
    }

    // GET /subscription/invoices?per_page=10&page=1
    public function invoices(Request $request): JsonResponse
    {
        $perPage = (int) $request->query('per_page', 10);
        $page    = (int) $request->query('page', 1);

        $all = $request->user()->invoices();

        $total  = count($all);
        $offset = ($page - 1) * $perPage;
        $items  = array_slice($all->all(), $offset, $perPage);

        $data = collect($items)->map(fn ($inv) => [
            'id'          => $inv->id,
            'total'       => $inv->total(),
            'date'        => $inv->date()->toDateString(),
            'paid'        => $inv->paid,
            'invoice_pdf' => $inv->invoice_pdf,
        ]);

        return response()->json([
            'data' => $data,
            'meta' => [
                'total'       => $total,
                'page'        => $page,
                'per_page'    => $perPage,
                'has_next'    => ($offset + $perPage) < $total,
            ],
        ]);
    }

    // GET /plans
    public function plans(): JsonResponse
    {
        $plans = Plan::all()->map(fn ($p) => [
            'id'             => $p->id,
            'name'           => $p->name,
            'price'          => $p->price,
            'currency'       => $p->currency,
            'interval'       => $p->interval,
            'stripe_price_id'=> $p->stripe_price_id,
            'features'       => $p->features,
        ]);

        return response()->json(['data' => $plans]);
    }
}
