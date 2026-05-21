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
        Schema::create('orders_logistics', function (Blueprint $table) {
            // Keep $table->id() exactly as it is since your controllers now use 'id as order_id'
            $table->id(); 
            
            // Core Relations
            $table->foreignId('listing_id')->constrained('listings')->onDelete('cascade');
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade'); // FIXED: Changed from winner_id to user_id
            $table->foreignId('fisherman_id')->constrained('users')->onDelete('cascade'); // Added to track the catch owner
            $table->foreignId('rider_id')->nullable()->constrained('users')->onDelete('set null');
            
            // Financial Ledger Columns
            $table->decimal('final_price', 10, 2); // FIXED: Changed from fish_total to final_price
            $table->decimal('escrow_balance', 10, 2)->default(0); // Added to isolate cash during transit
            $table->decimal('delivery_fee', 8, 2)->default(0); 
            
            // Logistics Configuration Enums
            $table->enum('logistics_type', ['self_pickup', 'request_rider']); // FIXED: Changed column and value enums
            $table->enum('status', ['pending_dispatch', 'en_route', 'delivered', 'completed'])->default('pending_dispatch'); // FIXED: Synchronized enums
            
            // Feedback Review Metrics
            $table->integer('rating')->nullable(); // Added for the confirmation handshake step
            
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