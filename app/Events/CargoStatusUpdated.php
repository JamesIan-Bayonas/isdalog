<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class CargoStatusUpdated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public int $orderId;
    public string $status;
    public ?string $riderName;
    public string $updatedAt;

    /**
     * Create a new event instance.
     */
    public function __construct(int $orderId, string $status, ?string $riderName = null)
    {
        $this->orderId = $orderId;
        $this->status = $status;
        $this->riderName = $riderName;
        $this->updatedAt = now()->toIso8601String();
    }

    /**
     * Broadcast to specific private order tracking channel and general logistics channel.
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('orders.' . $this->orderId), // Secured telemetry scope
            new Channel('logistics.dispatch'), // Public dispatch board
        ];
    }

    /**
     * The payload delivered to WebSocket client listeners.
     */
    public function broadcastWith(): array
    {
        return [
            'order_id' => $this->orderId,
            'status' => $this->status,
            'rider_name' => $this->riderName,
            'updated_at' => $this->updatedAt,
        ];
    }
}