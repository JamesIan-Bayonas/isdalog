<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    // In the xxxx_create_orders_logistics_table.php file
    public function up()
    {
        Schema::create('orders_logistics', function (Blueprint $table) {
            $table->id();
            $table->foreignId('listing_id')->constrained('listings')->onDelete('cascade');
            $table->foreignId('winner_id')->constrained('users')->onDelete('cascade');
            $table->enum('delivery_type', ['pickup', 'rider_delivery']);
            $table->foreignId('rider_id')->nullable()->constrained('users')->onDelete('set null');
            $table->decimal('fish_total', 10, 2);
            $table->decimal('delivery_fee', 8, 2)->default(0); // The flat rate
            $table->enum('status', ['awaiting_pickup', 'rider_dispatched', 'delivered'])->default('awaiting_pickup');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('orders_logistics');
    }
};
