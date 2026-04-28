<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\SubscriptionController;
use App\Http\Controllers\WebhookController;

/*
|--------------------------------------------------------------------------
| Payment API routes — all stateless via Sanctum token
|--------------------------------------------------------------------------
*/

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/subscription', [SubscriptionController::class, 'show']);
    Route::post('/subscription/checkout', [SubscriptionController::class, 'checkout']);
    Route::post('/subscription/cancel', [SubscriptionController::class, 'cancel']);
    Route::post('/subscription/resume', [SubscriptionController::class, 'resume']);
    Route::get('/subscription/invoices', [SubscriptionController::class, 'invoices']);
    Route::get('/plans', [SubscriptionController::class, 'plans']);
});

// Stripe webhook — no auth, verified by signature
Route::post('/webhook/stripe', [WebhookController::class, 'handle']);

// Health check — used by Docker and load balancers
Route::get('/health', function () {
    $db = 'ok';
    try {
        \Illuminate\Support\Facades\DB::select('SELECT 1');
    } catch (\Throwable) {
        $db = 'error';
    }

    $status = $db === 'ok' ? 200 : 503;

    return response()->json(['status' => $db === 'ok' ? 'ok' : 'degraded', 'db' => $db], $status);
});
