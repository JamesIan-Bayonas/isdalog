<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WithdrawalNotification extends Model
{
    protected $guarded = ['id'];

    protected function casts(): array
    {
        return ['read_at' => 'datetime'];
    }
}
