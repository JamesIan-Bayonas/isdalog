<?php // File: isdalog/database/migrations/2026_11_04_120000_add_order_resolution.php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;
return new class extends Migration {
    public function up():void {
        Schema::table('orders_logistics',fn(Blueprint $t)=>$t->enum('status',['pending_dispatch','en_route','delivered','completed','cancelled','refunded'])->default('pending_dispatch')->change());
        Schema::create('order_issues',function(Blueprint $t){$t->id();$t->foreignId('order_id')->unique()->constrained('orders_logistics')->restrictOnDelete();$t->foreignId('reported_by')->constrained('users');$t->string('category');$t->text('description');$t->text('evidence')->nullable();$t->string('status')->default('open');$t->foreignId('reviewed_by')->nullable()->constrained('users');$t->text('review_note')->nullable();$t->timestamp('reviewed_at')->nullable();$t->timestamps();});
        Schema::create('order_refunds',function(Blueprint $t){$t->id();$t->foreignId('order_id')->unique()->constrained('orders_logistics')->restrictOnDelete();$t->foreignId('buyer_id')->constrained('users');$t->foreignId('actor_id')->constrained('users');$t->foreignId('transaction_id')->constrained('wallet_transactions')->restrictOnDelete();$t->decimal('amount',12,2);$t->string('kind');$t->text('reason');$t->timestamps();});
    }
    public function down():void {
        if(DB::table('order_issues')->exists()||DB::table('order_refunds')->exists()||DB::table('orders_logistics')->whereIn('status',['cancelled','refunded'])->exists())throw new RuntimeException('Preserve resolution records before schema rollback.');
        Schema::dropIfExists('order_refunds');Schema::dropIfExists('order_issues');
        Schema::table('orders_logistics',fn(Blueprint $t)=>$t->enum('status',['pending_dispatch','en_route','delivered','completed'])->default('pending_dispatch')->change());
    }
};
