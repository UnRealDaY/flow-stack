<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        DB::table('stripe_plans')->upsert([
            [
                'name'            => 'free',
                'stripe_price_id' => null,
                'price'           => 0,
                'currency'        => 'usd',
                'interval'        => null,
                'features'        => json_encode(['5 members', '1 GB storage', 'Basic support']),
                'created_at'      => now(),
                'updated_at'      => now(),
            ],
            [
                'name'            => 'pro',
                'stripe_price_id' => env('STRIPE_PRICE_PRO'),
                'price'           => 1900,
                'currency'        => 'usd',
                'interval'        => 'month',
                'features'        => json_encode(['25 members', '50 GB storage', 'Priority support', 'Analytics']),
                'created_at'      => now(),
                'updated_at'      => now(),
            ],
            [
                'name'            => 'enterprise',
                'stripe_price_id' => env('STRIPE_PRICE_ENTERPRISE'),
                'price'           => 9900,
                'currency'        => 'usd',
                'interval'        => 'month',
                'features'        => json_encode(['Unlimited members', '1 TB storage', '24/7 support', 'Analytics', 'SSO']),
                'created_at'      => now(),
                'updated_at'      => now(),
            ],
        ], ['name'], ['stripe_price_id', 'price', 'currency', 'interval', 'features', 'updated_at']);
    }
}
