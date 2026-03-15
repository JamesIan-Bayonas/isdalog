<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('catches', function (Blueprint $table) {
            $table->id();
            
            // Relational link to the specific fisherman
            $table->foreignId('user_id')->nullable()->constrained()->onDelete('set null');
            
            $table->string('species');
            $table->decimal('weight', 8, 2);
            $table->string('location')->default('Dipolog City Port');
            $table->timestamp('logged_at')->useCurrent();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('catches');
    }
};