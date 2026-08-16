<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Listing extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'fish_name',
        'weight_kg',
        'starting_price',
        'current_bid',
        'location',
        'status',
        'ends_at',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function fisherman(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function bids(): HasMany
    {
        return $this->hasMany(Bid::class);
    }
}   