<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow; // <-- Crucial for instant speed
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class CatchBidUpdated implements ShouldBroadcastNow 
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $listing_id;
    public $current_bid;

    // We pass the listing and the new price into the megaphone
    public function __construct($listing_id, $current_bid)
    {
        $this->listing_id = $listing_id;
        $this->current_bid = $current_bid;
    }

    // We broadcast this to a public "marketplace" radio channel
    public function broadcastOn(): array
    {
        return [
            new Channel('marketplace'),
        ];
    }
}