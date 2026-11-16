<?php // File: isdalog/app/Services/MarketBenchmarks.php

namespace App\Services;

use Illuminate\Support\Facades\DB;

class MarketBenchmarks
{
    public static function forListings($listings): array
    {
        $end = now();
        $start = $end->copy()->subDays(30);
        $keys = [];
        $names = [];
        foreach ($listings as $listing) {
            $names[] = MarketVocabulary::normalize($listing->fish_name);
            $names[] = MarketVocabulary::normalize($listing->location);
        }
        $aliases = DB::table('vocabulary_aliases')->whereIn('normalized', array_unique($names))->get()->keyBy(fn ($a) => $a->kind.':'.$a->normalized);
        foreach ($listings as $listing) {
            $keys[$listing->id] = [$listing->species_term_id ?? ($aliases->get('species:'.MarketVocabulary::normalize($listing->fish_name))?->term_id), $listing->port_term_id ?? ($aliases->get('port:'.MarketVocabulary::normalize($listing->location))?->term_id)];
        }
        $species = array_unique(array_filter(array_column($keys, 0)));
        $ports = array_unique(array_filter(array_column($keys, 1)));
        $groups = DB::table('orders_logistics as orders')->join('order_settlements as settlements', 'settlements.order_id', '=', 'orders.id')
            ->where('orders.status', 'completed')->whereNotNull('orders.sale_snapshot_at')->where('orders.sale_snapshot_at', '<=', $end)
            ->whereBetween('orders.completed_at', [$start, $end])->whereColumn('orders.sale_snapshot_at', '<=', 'orders.completed_at')
            ->where('orders.sale_weight_kg', '>', 0)->where('orders.final_price', '>', 0)->where('orders.escrow_balance', 0)
            ->whereIn('orders.sale_species_term_id', $species)->whereIn('orders.sale_port_term_id', $ports)
            ->whereNotExists(fn ($q) => $q->selectRaw('1')->from('order_issues')->whereColumn('order_issues.order_id', 'orders.id')->where('order_issues.status', 'open'))
            ->whereNotExists(fn ($q) => $q->selectRaw('1')->from('order_refunds')->whereColumn('order_refunds.order_id', 'orders.id'))
            ->select('orders.sale_species_term_id', 'orders.sale_port_term_id')
            ->selectRaw('COUNT(*) as samples, AVG(orders.final_price * 1.0 / orders.sale_weight_kg) as average_per_kg, MIN(orders.final_price * 1.0 / orders.sale_weight_kg) as low_per_kg, MAX(orders.final_price * 1.0 / orders.sale_weight_kg) as high_per_kg, MIN(orders.completed_at) as first_sale_at, MAX(orders.completed_at) as last_sale_at')
            ->groupBy('orders.sale_species_term_id', 'orders.sale_port_term_id')->get()->keyBy(fn ($g) => $g->sale_species_term_id.':'.$g->sale_port_term_id);
        $labels = DB::table('vocabulary_terms')->whereIn('id', array_unique([...$species, ...$ports]))->pluck('display_name', 'id');
        $result = [];
        foreach ($keys as $id => [$s,$p]) {
            $group = $groups->get($s.':'.$p);
            $count = (int) ($group->samples ?? 0);
            $enough = $count >= 3;
            $result[$id] = ['status' => ! $s || ! $p ? 'unclassified' : ($enough ? 'available' : 'insufficient'), 'samples' => $count, 'minimum_samples' => 3, 'period_days' => 30,
                'window_start' => $start->toISOString(), 'window_end' => $end->toISOString(), 'species' => $labels->get($s), 'port' => $labels->get($p),
                'average_per_kg' => $enough ? round((float) $group->average_per_kg, 2) : null, 'low_per_kg' => $enough ? round((float) $group->low_per_kg, 2) : null, 'high_per_kg' => $enough ? round((float) $group->high_per_kg, 2) : null,
                'first_sale_at' => $enough ? $group->first_sale_at : null, 'last_sale_at' => $enough ? $group->last_sale_at : null];
        }

        return $result;
    }
}
