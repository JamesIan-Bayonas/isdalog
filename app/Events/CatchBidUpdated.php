<?php

namespace App\Events;

use App\Models\Listing;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class CatchBidUpdated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $listing;

    /**
     * Create a new event instance.
     */
    public function __construct(Listing $listing)
    {
        $this->listing = $listing;
    }

    /**
     * Get the channels the event should broadcast on.
     */
    public function broadcastOn(): array
    {
        // We broadcast on a specific channel for this listing
        return [
            new Channel('marketplace.' . $this->listing->id),
        ];
    }

    /**
     * The data to broadcast to React.
     */
    public function broadcastWith(): array
    {
        return [
            'id' => $this->listing->id,
            'current_bid' => $this->listing->current_bid,
            'updated_at' => $this->listing->updated_at,
        ];
    }
}