<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Stripe
    |--------------------------------------------------------------------------
    */
    'stripe' => [
        'key'    => env('STRIPE_KEY'),
        'secret' => env('STRIPE_SECRET'),

        // Webhook signing secret (from `stripe listen --print-secret`)
        'webhook' => [
            'secret'    => env('STRIPE_WEBHOOK_SECRET'),
            'tolerance' => 300, // seconds
        ],

        // Map plan slug → Stripe Price ID
        'plans' => [
            'pro'        => env('STRIPE_PRICE_PRO'),
            'enterprise' => env('STRIPE_PRICE_ENTERPRISE'),
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Redis (internal event bus)
    |--------------------------------------------------------------------------
    */
    'redis_event_bus' => [
        'url'     => env('REDIS_URL', 'redis://localhost:6379'),
        'channel' => 'events',
    ],

];
