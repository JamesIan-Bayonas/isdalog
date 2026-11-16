<?php // File: isdalog/app/Services/AccountResponsibilities.php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class AccountResponsibilities
{
    public static function assertNoActiveOrders(int $id): void
    {
        if (DB::table('orders_logistics')->whereIn('status', ['pending_dispatch', 'en_route', 'delivered'])
            ->where(fn ($q) => $q->where('user_id', $id)->orWhere('fisherman_id', $id)->orWhere('rider_id', $id))->exists()) {
            throw ValidationException::withMessages(['account' => 'Complete or resolve active orders before changing account access. Use Orders & history or Help & support.']);
        }
    }
}
