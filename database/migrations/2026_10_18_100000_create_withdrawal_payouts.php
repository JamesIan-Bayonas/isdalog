<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('withdrawal_payouts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('withdrawal_request_id')->unique()->constrained()->cascadeOnDelete();
            $table->string('reference')->unique();
            $table->string('provider_reference')->nullable();
            $table->string('mode');
            $table->string('status');
            $table->foreignId('initiated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('paid_at')->nullable();
            $table->timestamp('failed_at')->nullable();
            $table->timestamp('refunded_at')->nullable();
            $table->string('failure_reason')->nullable();
            $table->timestamps();
        });
        Schema::create('payout_events', function (Blueprint $table) {
            $table->id();
            $table->foreignId('withdrawal_payout_id')->constrained()->cascadeOnDelete();
            $table->string('event_id')->unique();
            $table->string('payload_hash', 64);
            $table->string('status');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payout_events');
        Schema::dropIfExists('withdrawal_payouts');
    }
};
