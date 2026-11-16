<?php // File: isdalog/database/migrations/2026_11_03_120000_add_settlement_ledger.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (DB::table('wallets')->select('user_id')->groupBy('user_id')->havingRaw('COUNT(*) > 1')->exists()) {
            throw new RuntimeException('Reconcile duplicate wallets before applying the account constraint.');
        }
        Schema::table('wallets', fn (Blueprint $table) => $table->unique('user_id', 'wallets_user_unique'));
        Schema::create('order_settlements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->unique()->constrained('orders_logistics')->restrictOnDelete();
            $table->decimal('funded_amount', 12, 2);
            $table->decimal('fisherman_amount', 12, 2);
            $table->decimal('rider_amount', 12, 2);
            $table->decimal('platform_fee', 12, 2);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('order_settlements');
        Schema::table('wallets', fn (Blueprint $table) => $table->dropUnique('wallets_user_unique'));
    }
};
