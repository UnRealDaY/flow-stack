# payment

Laravel · Cashier · Stripe

Stateless billing API. Handles subscriptions, webhooks, and plan transitions.

## Stack

- **Framework**: Laravel 11
- **Auth**: Sanctum (token-based, stateless)
- **Billing**: Laravel Cashier (Stripe)
- **Queues**: Laravel Jobs + Redis

## Plans

| Plan       | Price  |
|------------|--------|
| Free       | $0     |
| Pro        | $29/mo |
| Enterprise | custom |

## Subscription flow

`trial → active → canceled → refunded`

Each transition is a dedicated method in `SubscriptionService` — states are never mixed.

## Webhook safety

Every incoming Stripe event is deduplicated on `stripe_event_id` before processing. Jobs handle all async billing logic so webhook responses are always fast.

## Dev

```bash
composer install
cp .env.example .env && php artisan key:generate
php artisan migrate
php artisan serve --port=8001
php artisan queue:work
```
