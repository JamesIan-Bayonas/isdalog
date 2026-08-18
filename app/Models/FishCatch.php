<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FishCatch extends Model
{
    use HasFactory;

    // Explicitly tell Laravel which table to connect to
    protected $table = 'catches';

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'user_id',
        'species',
        'image_url',
        'weight',
        'location',
        'latitude',
        'longitude',
        'wind_speed',
        'temperature',
        'weather_condition',
        'logged_at',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'weight' => 'decimal:2',
            'latitude' => 'decimal:8',
            'longitude' => 'decimal:8',
            'wind_speed' => 'decimal:2',
            'temperature' => 'decimal:2',
            'logged_at' => 'datetime',
        ];
    }

    /**
     * Get the user that logged the catch.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}