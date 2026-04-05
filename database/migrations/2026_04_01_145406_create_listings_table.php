<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    // In the xxxx_create_listings_table.php file
    public function up()
    {
        Schema::create('listings', function (Blueprint $table) {
            $table->id();
            // Changed to user_id to match your Controller/Model logic
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade'); 
            
            // Added these columns to match your "Start Auction" form
            $table->string('fish_name'); 
            $table->decimal('weight_kg', 8, 2);
            $table->decimal('starting_price', 10, 2);
            $table->decimal('current_bid', 10, 2);
            $table->string('location'); 
            
            $table->enum('status', ['active', 'pending_logistics', 'completed'])->default('active');
            $table->timestamp('ends_at')->nullable(); // Made nullable for testing
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('listings');
    }
};
