<?php // File: isdalog/app/Console/Commands/LinkMarketVocabulary.php

namespace App\Console\Commands;

use App\Services\MarketVocabulary;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class LinkMarketVocabulary extends Command
{
    protected $signature = 'vocabulary:link {--apply : Save exact alias matches; otherwise report only}';

    protected $description = 'Link unassigned vocabulary IDs without rewriting original labels or timestamps';

    public function handle(): int
    {
        $matches = 0;
        foreach ([\App\Models\Listing::class => 'fish_name', \App\Models\FishCatch::class => 'species'] as $model => $field) {
            $model::where(fn ($q) => $q->whereNull('species_term_id')->orWhereNull('port_term_id'))->chunkById(100, function ($records) use ($model, $field, &$matches) {
                foreach ($records as $record) {
                    if ((! $record->species_term_id && MarketVocabulary::resolve('species', $record->$field)) || (! $record->port_term_id && MarketVocabulary::resolve('port', $record->location))) {
                        $matches++;
                        if ($this->option('apply')) {
                            DB::transaction(function () use ($model, $record, $field) {
                                $locked = $model::whereKey($record->id)->lockForUpdate()->first();
                                if ($locked) {
                                    MarketVocabulary::link($locked, $field);
                                }
                            });
                        }
                    }
                }
            });
        }
        $this->info(($this->option('apply') ? 'Applied exact matches to ' : 'Dry run: exact matches available for ').$matches.' records. Original labels preserved.');

        return self::SUCCESS;
    }
}
