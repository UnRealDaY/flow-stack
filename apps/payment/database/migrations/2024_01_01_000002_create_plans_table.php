<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('plans', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();          // free | pro | enterprise
            $table->string('stripe_price_id')->nullable();
            $table->unsignedInteger('price')->default(0); // in cents
            $table->string('currency', 3)->default('usd');
            $table->string('interval')->nullable();    // month | year
            $table->json('features')->default('[]');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('plans');
    }
};
