<?php // File: isdalog/database/migrations/2026_11_04_160000_add_sale_facts.php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders_logistics', function (Blueprint $t) {
            $t->decimal('sale_weight_kg', 10, 2)->nullable();
            $t->string('sale_fish_name')->nullable();
            $t->string('sale_location')->nullable();
            $t->foreignId('sale_species_term_id')->nullable()->constrained('vocabulary_terms')->restrictOnDelete();
            $t->foreignId('sale_port_term_id')->nullable()->constrained('vocabulary_terms')->restrictOnDelete();
            $t->foreignId('sale_catch_id')->nullable()->constrained('catches')->restrictOnDelete();
            $t->timestamp('sale_snapshot_at')->nullable();
            $t->index(['status', 'completed_at'], 'orders_completed_window');
        });
    }

    public function down(): void
    {
        Schema::table('orders_logistics', function (Blueprint $t) {
            $t->dropIndex('orders_completed_window');
            $t->dropConstrainedForeignId('sale_species_term_id');
            $t->dropConstrainedForeignId('sale_port_term_id');
            $t->dropConstrainedForeignId('sale_catch_id');
            $t->dropColumn(['sale_weight_kg', 'sale_fish_name', 'sale_location', 'sale_snapshot_at']);
        });
    }
};
