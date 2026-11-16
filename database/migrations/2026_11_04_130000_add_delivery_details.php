<?php // File: isdalog/database/migrations/2026_11_04_130000_add_delivery_details.php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
return new class extends Migration {
    public function up():void { Schema::table('orders_logistics',function(Blueprint $t){
        $t->boolean('delivery_details_required')->default(false);$t->string('destination_area')->nullable();$t->text('delivery_address')->nullable();$t->string('recipient_name')->nullable();$t->string('recipient_phone',30)->nullable();$t->text('delivery_instructions')->nullable();$t->timestamp('delivery_details_saved_at')->nullable();
    }); }
    public function down():void { Schema::table('orders_logistics',fn(Blueprint $t)=>$t->dropColumn(['delivery_details_required','destination_area','delivery_address','recipient_name','recipient_phone','delivery_instructions','delivery_details_saved_at'])); }
};
