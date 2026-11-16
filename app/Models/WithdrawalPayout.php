<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WithdrawalPayout extends Model
{
    protected $guarded = ['id'];

    protected function casts(): array
    {
        return ['paid_at' => 'datetime', 'failed_at' => 'datetime', 'refunded_at' => 'datetime'];
    }
}
