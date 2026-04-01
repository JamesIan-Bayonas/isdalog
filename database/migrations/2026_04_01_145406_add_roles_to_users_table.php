<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    // In the xxxx_add_roles_to_users_table.php file
    public function up()
    {
        Schema::table('users', function (Blueprint $table) {
            $table->enum('role', ['fisherman', 'buyer', 'rider'])->default('buyer');
            $table->string('contact_number')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            //
        });
    }
};
