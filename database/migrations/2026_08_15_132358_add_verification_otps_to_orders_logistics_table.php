<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('orders_logistics', function (Blueprint $table) {
            $table->string('pickup_otp', 6)->nullable()->after('delivery_fee');
            $table->string('delivery_otp', 6)->nullable()->after('pickup_otp');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('orders_logistics', function (Blueprint $table) {
            $table->dropColumn(['pickup_otp', 'delivery_otp']);
        });
    }
};