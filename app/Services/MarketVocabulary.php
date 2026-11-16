<?php // File: isdalog/app/Services/MarketVocabulary.php

namespace App\Services;

use Illuminate\Support\Facades\DB;

class MarketVocabulary
{
    public static function normalize(?string $label): string
    {
        return mb_strtolower(trim($label ?? ''));
    }

    public static function resolve(string $kind, ?string $label): ?int
    {
        $id = DB::table('vocabulary_aliases')->where('kind', $kind)->where('normalized', self::normalize($label))->value('term_id');

        return $id === null ? null : (int) $id;
    }

    public static function attach($record, string $speciesField): void
    {
        if (! $record->exists || $record->isDirty($speciesField)) {
            $record->species_term_id = self::resolve('species', $record->$speciesField);
        }
        if (! $record->exists || $record->isDirty('location')) {
            $record->port_term_id = self::resolve('port', $record->location);
        }
    }

    public static function searchSpecies($query, string $input): void
    {
        $pattern = '%'.str_replace(['!', '%', '_'], ['!!', '!%', '!_'], self::normalize($input)).'%';
        $terms = DB::table('vocabulary_aliases')->where('kind', 'species')->whereRaw("normalized LIKE ? ESCAPE '!'", [$pattern])->pluck('term_id');
        $aliases = DB::table('vocabulary_aliases')->whereIn('term_id', $terms)->pluck('normalized');
        $query->where(function ($q) use ($pattern, $terms, $aliases) {
            $q->whereRaw("LOWER(fish_name) LIKE ? ESCAPE '!'", [$pattern])->orWhereIn('species_term_id', $terms)->orWhereIn(DB::raw('LOWER(TRIM(fish_name))'), $aliases);
        });
    }

    public static function filterPort($query, string $label): void
    {
        $id = self::resolve('port', $label);
        if (! $id) {
            $query->where('location', $label);

            return;
        }
        $aliases = DB::table('vocabulary_aliases')->where('term_id', $id)->pluck('normalized');
        $query->where(fn ($q) => $q->where('port_term_id', $id)->orWhereIn(DB::raw('LOWER(TRIM(location))'), $aliases));
    }

    public static function ports(): array
    {
        return DB::table('vocabulary_terms')->where('kind', 'port')->orderBy('id')->get()->map(fn ($p) => ['id' => $p->id, 'code' => $p->code, 'name' => $p->display_name, 'lat' => $p->latitude === null ? null : (float) $p->latitude, 'lon' => $p->longitude === null ? null : (float) $p->longitude])->all();
    }

    public static function link($record, string $speciesField): void
    {
        if (! $record->species_term_id) {
            $record->species_term_id = self::resolve('species', $record->$speciesField);
        }
        if (! $record->port_term_id) {
            $record->port_term_id = self::resolve('port', $record->location);
        }
        // Query builder intentionally avoids timestamps/events and preserves every original label.
        DB::table($record->getTable())->where('id', $record->id)->update(['species_term_id' => $record->species_term_id, 'port_term_id' => $record->port_term_id]);
    }
}
