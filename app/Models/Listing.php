<?php // File: isdalog/app/Models/Listing.php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Listing extends Model
{
    use HasFactory;

    protected static function booted(): void
    {
        static::saving(fn ($record) => \App\Services\MarketVocabulary::attach($record, 'fish_name'));
    }

    protected $fillable = [
        'user_id',
        'catch_id',
        'fish_name',
        'image_url',
        'weight_kg',
        'starting_price',
        'current_bid',
        'location',
        'status',
        'ends_at',
    ];

    protected function casts(): array
    {
        return ['ends_at' => 'datetime', 'expired_at' => 'datetime'];
    }

    public function isOpenForTrading(): bool
    {
        return $this->status === 'active' && ! $this->withdrawn_at && ! $this->expired_at
            && (! $this->ends_at || $this->ends_at->isFuture());
    }

    public function scopeOpenForTrading($query)
    {
        return $query->where('status', 'active')->whereNull('withdrawn_at')->whereNull('expired_at')
            ->where(fn ($q) => $q->whereNull('ends_at')->orWhere('ends_at', '>', now()))
            ->whereDoesntHave('orders');
    }

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

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }

    public function activities(): HasMany
    {
        return $this->hasMany(ListingActivity::class);
    }
}
