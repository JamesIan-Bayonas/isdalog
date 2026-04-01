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
            // This automatically links to the ID in the users table
            $table->foreignId('fisherman_id')->constrained('users')->onDelete('cascade'); 
            $table->string('catch_details'); // e.g., "20kg Tulingan"
            $table->decimal('starting_bid', 10, 2);
            $table->string('landing_site'); 
            $table->enum('status', ['active', 'pending_logistics', 'completed'])->default('active');
            $table->timestamp('ends_at');
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
