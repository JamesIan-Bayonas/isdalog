<?php // File: isdalog/app/Services/AuctionExpiry.php

namespace App\Services;

use App\Events\ListingAvailabilityUpdated;
use App\Models\Listing;
use App\Models\ListingActivity;
use Illuminate\Support\Facades\DB;

class AuctionExpiry
{
    public function run(): int
    {
        $count = 0;
        Listing::where('status', 'active')->whereNull('withdrawn_at')->whereNull('expired_at')
            ->whereNotNull('ends_at')->where('ends_at', '<=', now())->whereDoesntHave('orders')
            ->select('id')->chunkById(100, function ($rows) use (&$count) {
                foreach ($rows as $row) {
                    $count += DB::transaction(function () use ($row) {
                        $listing = Listing::whereKey($row->id)->lockForUpdate()->first();
                        if (! $listing || $listing->status !== 'active' || $listing->withdrawn_at || $listing->expired_at
                            || ! $listing->ends_at || $listing->ends_at->isFuture() || $listing->orders()->exists()) {
                            return 0;
                        }
                        // Keep original deadline as effective expiry; execution may be delayed.
                        $listing->expired_at = $listing->ends_at;
                        $listing->management_version++;
                        $listing->save();
                        ListingActivity::create(['listing_id' => $listing->id, 'actor_id' => null, 'action' => 'expired',
                            'before_values' => ['availability' => 'active'], 'after_values' => ['availability' => 'expired'],
                            'reason' => 'Auction deadline reached. No automatic award or charge.']);
                        event(new ListingAvailabilityUpdated(['id' => $listing->id, 'withdrawn' => false,
                            'available' => false, 'expired' => true, 'ends_at' => $listing->ends_at->toISOString()]));

                        return 1;
                    }, 3);
                }
            });

        return $count;
    }
}
