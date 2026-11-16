<?php // File: isdalog/database/migrations/2026_11_04_100000_add_order_milestones.php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
return new class extends Migration {
    public function up(): void { Schema::table('orders_logistics', function(Blueprint $table) {
        $table->timestamp('picked_up_at')->nullable(); $table->timestamp('delivered_at')->nullable(); $table->timestamp('completed_at')->nullable();
    }); }
    public function down(): void { Schema::table('orders_logistics', fn(Blueprint $table)=>$table->dropColumn(['picked_up_at','delivered_at','completed_at'])); }
};
