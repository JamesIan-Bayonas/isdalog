<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class OrderDispatched implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $order;

    /**
     * Create a new event instance.
     */
    public function __construct($order)
    {
        $this->order = $order;
    }

    /**
     * Broadcast on a public logistics channel.
     */
    public function broadcastOn(): array
    {
        return [
            new Channel('logistics.dispatch'),
        ];
    }

    /**
     * Format the payload sent to React.
     */
    public function broadcastWith(): array
    {
        return [
            'order_id' => $this->order->order_id,
            'fish_name' => $this->order->fish_name,
            'weight_kg' => $this->order->weight_kg,
            'final_price' => $this->order->final_price,
            'location' => $this->order->location,
        'status' => 'pending_dispatch',
        ];
    }
}