<?php

use Illuminate\Support\Facades\Broadcast;
use Illuminate\Support\Facades\DB;

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

// Secure Cargo Telemetry Channel
Broadcast::channel('orders.{orderId}', function ($user, $orderId) {
    $order = DB::table('orders_logistics')->where('id', $orderId)->first();

    if (!$order) {
        return false;
    }

    // Role-Based Access Control (RBAC): Only transaction participants and admins may subscribe
    return $user->role === 'admin' ||
           (int) $user->id === (int) $order->user_id ||
           (int) $user->id === (int) $order->fisherman_id ||
           (int) $user->id === (int) $order->rider_id;
});