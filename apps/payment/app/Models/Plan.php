<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Plan extends Model
{
    protected $fillable = ['name', 'stripe_price_id', 'price', 'currency', 'interval', 'features'];

    protected function casts(): array
    {
        return ['features' => 'array', 'price' => 'integer'];
    }

    public static function free(): array
    {
        return [
            'name'           => 'free',
            'stripe_price_id'=> null,
            'price'          => 0,
            'currency'       => 'usd',
            'interval'       => null,
            'features'       => ['5 members', '1 GB storage', 'Basic support'],
        ];
    }
}
