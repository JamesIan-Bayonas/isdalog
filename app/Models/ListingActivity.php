<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ListingActivity extends Model
{
    protected $guarded = ['id'];

    protected function casts(): array
    {
        return ['before_values' => 'array', 'after_values' => 'array'];
    }
}
