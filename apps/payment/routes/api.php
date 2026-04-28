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
