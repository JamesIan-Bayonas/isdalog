<?php // File: isdalog/app/Services/MarketplaceFilters.php

namespace App\Services;

use Illuminate\Http\Request;

class MarketplaceFilters
{
    public static function validate(Request $request): array
    {
        $filters = $request->validate([
            'q' => ['nullable', 'string', 'max:100'], 'port' => ['nullable', 'string', 'max:255'],
            'min_price' => ['nullable', 'numeric', 'min:0', 'max:9999999999', 'decimal:0,2'],
            'max_price' => ['nullable', 'numeric', 'min:0', 'max:9999999999', 'decimal:0,2'],
            'min_weight' => ['nullable', 'numeric', 'min:0', 'max:999999.99', 'decimal:0,2'],
            'max_weight' => ['nullable', 'numeric', 'min:0', 'max:999999.99', 'decimal:0,2'],
            'sort' => ['nullable', 'in:newest,price_asc,price_desc,weight_asc,closing'],
            'page' => ['nullable', 'integer', 'min:1', 'max:100000'],
        ]);
        foreach (['price', 'weight'] as $range) {
            if (isset($filters['min_'.$range], $filters['max_'.$range]) && $filters['min_'.$range] > $filters['max_'.$range]) {
                throw \Illuminate\Validation\ValidationException::withMessages(['max_'.$range => 'Maximum must be at least the minimum.']);
            }
        }
        $filters['q'] = trim($filters['q'] ?? '');
        $filters['sort'] = $filters['sort'] ?? 'newest';
        return $filters;
    }
}
