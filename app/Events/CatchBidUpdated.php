<?php

namespace App\Events;

use App\Models\Listing;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class CatchBidUpdated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public Listing $listing;

    /**
     * Create a new event instance.
     */
    public function __construct(Listing $listing)
    {
        $this->listing = $listing;
    }

    /**
     * Broadcast on specific listing channel and global marketplace channel.
     */
    public function broadcastOn(): array
    {
        return [
            new Channel('marketplace.' . $this->listing->id),
            new Channel('marketplace'),
        ];
    }

    /**
     * The data payload broadcasted to Inertia / React listeners.
     */
    public function broadcastWith(): array
    {
        return [
            'id' => $this->listing->id,
            'listing_id' => $this->listing->id,
            'current_bid' => (float) $this->listing->current_bid,
            'status' => $this->listing->status,
            'updated_at' => $this->listing->updated_at,
        ];
    }
}