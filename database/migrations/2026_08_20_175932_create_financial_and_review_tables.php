<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (! Schema::hasTable('wallets')) {
            Schema::create('wallets', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->constrained()->cascadeOnDelete();
                $table->decimal('balance', 12, 2)->default(0.00);
                $table->timestamps();
            });
        }

        if (! Schema::hasTable('wallet_transactions')) {
            Schema::create('wallet_transactions', function (Blueprint $table) {
                $table->id();
                $table->foreignId('wallet_id')->constrained()->cascadeOnDelete();
                $table->foreignId('order_id')->nullable()->constrained('orders_logistics')->nullOnDelete();
                $table->enum('type', ['credit', 'debit']);
                $table->string('purpose'); // 'catch_sale', 'platform_fee', 'delivery_fee', 'withdrawal'
                $table->decimal('amount', 12, 2);
                $table->decimal('balance_after', 12, 2);
                $table->timestamps();
            });
        }

        if (! Schema::hasTable('order_reviews')) {
            Schema::create('order_reviews', function (Blueprint $table) {
                $table->id();
                $table->foreignId('order_id')->constrained('orders_logistics')->cascadeOnDelete();
                $table->foreignId('reviewer_id')->constrained('users');
                $table->foreignId('reviewee_id')->constrained('users');
                $table->enum('target_type', ['fisherman', 'rider']);
                $table->unsignedTinyInteger('rating'); // 1 to 5
                $table->text('comment')->nullable();
                $table->timestamps();
            });
        }

        if (! Schema::hasTable('withdrawal_requests')) {
            Schema::create('withdrawal_requests', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->constrained()->cascadeOnDelete();
                $table->decimal('amount', 12, 2);
                $table->enum('payment_method', ['gcash', 'maya']);
                $table->string('account_name');
                $table->string('account_number');
                $table->enum('status', ['pending', 'approved', 'rejected'])->default('pending');
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('withdrawal_requests');
        Schema::dropIfExists('order_reviews');
        Schema::dropIfExists('wallet_transactions');
        Schema::dropIfExists('wallets');
    }
};