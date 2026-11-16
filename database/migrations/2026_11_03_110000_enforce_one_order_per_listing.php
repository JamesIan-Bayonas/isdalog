<?php // File: isdalog/database/migrations/2026_11_03_110000_enforce_one_order_per_listing.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Preserve historical orders and money: stop for review instead of deleting duplicates.
        if (DB::table('orders_logistics')->select('listing_id')->groupBy('listing_id')->havingRaw('COUNT(*) > 1')->exists()) {
            throw new RuntimeException('Duplicate listing orders exist. Reconcile their orders and escrow before applying the unique sale constraint.');
        }
        Schema::table('orders_logistics', function (Blueprint $table) {
            $table->unique('listing_id', 'orders_logistics_listing_unique');
        });
    }

    public function down(): void
    {
        Schema::table('orders_logistics', function (Blueprint $table) {
            $table->dropUnique('orders_logistics_listing_unique');
        });
    }
};
