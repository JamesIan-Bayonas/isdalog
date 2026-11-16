<?php // File: isdalog/app/Services/SaleFacts.php

namespace App\Services;

use App\Models\FishCatch;
use App\Models\Listing;

class SaleFacts
{
    public static function capture(Listing $listing): array
    {
        return ['sale_weight_kg' => $listing->weight_kg, 'sale_fish_name' => $listing->fish_name, 'sale_location' => $listing->location,
            'sale_species_term_id' => $listing->species_term_id ?? MarketVocabulary::resolve('species', $listing->fish_name),
            'sale_port_term_id' => $listing->port_term_id ?? MarketVocabulary::resolve('port', $listing->location),
            'sale_catch_id' => $listing->catch_id && FishCatch::whereKey($listing->catch_id)->where('user_id', $listing->user_id)->exists() ? $listing->catch_id : null,
            'sale_snapshot_at' => now()];
    }
}
