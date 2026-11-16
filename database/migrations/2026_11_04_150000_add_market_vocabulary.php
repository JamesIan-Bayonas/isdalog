<?php // File: isdalog/database/migrations/2026_11_04_150000_add_market_vocabulary.php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('vocabulary_terms', function (Blueprint $t) {
            $t->id();
            $t->string('kind', 10);
            $t->string('code', 80)->unique();
            $t->string('display_name');
            $t->decimal('latitude', 10, 7)->nullable();
            $t->decimal('longitude', 11, 7)->nullable();
            $t->text('source_note');
            $t->timestamps();
        });
        Schema::create('vocabulary_aliases', function (Blueprint $t) {
            $t->id();
            $t->foreignId('term_id')->constrained('vocabulary_terms')->restrictOnDelete();
            $t->string('kind', 10);
            $t->string('label');
            $t->string('normalized');
            $t->unique(['kind', 'normalized']);
            $t->timestamps();
        });
        Schema::create('vocabulary_changes', function (Blueprint $t) {
            $t->id();
            $t->foreignId('term_id')->constrained('vocabulary_terms')->restrictOnDelete();
            $t->unsignedBigInteger('actor_user_id');
            $t->json('before')->nullable();
            $t->json('after');
            $t->timestamp('created_at');
        });
        foreach (['listings', 'catches'] as $table) {
            Schema::table($table, function (Blueprint $t) {
                $t->foreignId('species_term_id')->nullable()->constrained('vocabulary_terms')->restrictOnDelete();
                $t->foreignId('port_term_id')->nullable()->constrained('vocabulary_terms')->restrictOnDelete();
            });
        }
        $now = now();
        foreach ([
            ['port', 'port-galas', 'Galas Port', 8.5800, 123.3300, 'Legacy landing_ports configuration; approximate reference only, not surveyed coordinates.', []],
            ['port', 'port-dipolog', 'Dipolog Port', 8.5725, 123.3211, 'Legacy landing_ports configuration; approximate reference only, not surveyed coordinates.', []],
            ['port', 'port-sicayab', 'Sicayab Port', 8.5910, 123.3450, 'Legacy landing_ports configuration; approximate reference only, not surveyed coordinates.', []],
            ['port', 'port-dapitan', 'Dapitan Port', 8.6512, 123.4211, 'Legacy landing_ports configuration; approximate reference only, not surveyed coordinates.', []],
            ['species', 'species-milkfish', 'Milkfish', null, null, 'BFAR April 2018 table: Chanos chanos / Milkfish / Bangus. https://www.bfar.da.gov.ph/wp-content/uploads/2021/05/NCPMR-April2018.pdf', ['Bangus', 'Chanos chanos']],
        ] as [$kind,$code,$name,$lat,$lon,$source,$aliases]) {
            $id = DB::table('vocabulary_terms')->insertGetId(['kind' => $kind, 'code' => $code, 'display_name' => $name, 'latitude' => $lat, 'longitude' => $lon, 'source_note' => $source, 'created_at' => $now, 'updated_at' => $now]);
            foreach ([$name, ...$aliases] as $alias) {
                DB::table('vocabulary_aliases')->insert(['term_id' => $id, 'kind' => $kind, 'label' => $alias, 'normalized' => mb_strtolower(trim($alias)), 'created_at' => $now, 'updated_at' => $now]);
            }
        }
    }

    public function down(): void
    {
        foreach (['listings', 'catches'] as $table) {
            Schema::table($table, function (Blueprint $t) {
                $t->dropConstrainedForeignId('species_term_id');
                $t->dropConstrainedForeignId('port_term_id');
            });
        }
        Schema::dropIfExists('vocabulary_changes');
        Schema::dropIfExists('vocabulary_aliases');
        Schema::dropIfExists('vocabulary_terms');
    }
};
