<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('listings', function (Blueprint $table) {
            $table->timestamp('withdrawn_at')->nullable();
            $table->text('withdrawn_reason')->nullable();
            $table->unsignedInteger('management_version')->default(0);
        });
        Schema::create('listing_activities', function (Blueprint $table) {
            $table->id();
            $table->foreignId('listing_id')->constrained()->cascadeOnDelete();
            $table->foreignId('actor_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('action');
            $table->json('before_values');
            $table->json('after_values');
            $table->text('reason')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        if (\Illuminate\Support\Facades\DB::table('listings')->whereNotNull('withdrawn_at')->exists()) {
            throw new \RuntimeException('Reconcile withdrawn listings before rollback to avoid relisting them.');
        }
        Schema::dropIfExists('listing_activities');
        Schema::table('listings', fn (Blueprint $table) => $table->dropColumn(['withdrawn_at', 'withdrawn_reason', 'management_version']));
    }
};
