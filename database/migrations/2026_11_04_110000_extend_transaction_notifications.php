<?php // File: isdalog/database/migrations/2026_11_04_110000_extend_transaction_notifications.php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
return new class extends Migration {
    public function up():void { Schema::table('withdrawal_notifications',function(Blueprint $table){
        $table->unsignedBigInteger('withdrawal_request_id')->nullable()->change();
        $table->string('event_key')->nullable(); $table->string('subject_type')->nullable(); $table->unsignedBigInteger('subject_id')->nullable();
        $table->unique(['user_id','event_key'],'notification_recipient_event_unique');
    }); }
    public function down():void {
        if(\Illuminate\Support\Facades\DB::table('withdrawal_notifications')->whereNull('withdrawal_request_id')->exists()) throw new \RuntimeException('Retain or export transaction notifications before removing their schema.');
        Schema::table('withdrawal_notifications',function(Blueprint $table){$table->dropUnique('notification_recipient_event_unique');$table->dropColumn(['event_key','subject_type','subject_id']);$table->unsignedBigInteger('withdrawal_request_id')->nullable(false)->change();});
    }
};
