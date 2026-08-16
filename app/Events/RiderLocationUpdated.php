<?php

namespace App\Events;

use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class RiderLocationUpdated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public int $orderId;
    public float $latitude;
    public float $longitude;

    /**
     * Create a new event instance.
     */
    public function __construct(int $orderId, float $latitude, float $longitude)
    {
        $this->orderId = $orderId;
        $this->latitude = $latitude;
        $this->longitude = $longitude;
    }

    /**
     * Broadcast to the secure, isolated order tracking channel.
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('orders.' . $this->orderId),
        ];
    }

    /**
     * The geospatial payload delivered to WebSocket client listeners.
     */
    public function broadcastWith(): array
    {
        return [
            'order_id' => $this->orderId,
            'latitude' => $this->latitude,
            'longitude' => $this->longitude,
        ];
    }
}