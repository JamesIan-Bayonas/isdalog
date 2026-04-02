<?php
namespace App\Models;

use App\Models\Bid;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Listing extends Model
{
    use HasFactory;
    /**
     * A listing has many bids.
     */
    public function bids(): HasMany
    {
        return $this->hasMany(Bid::class);
    }

    /**
     * A listing belongs to a fisherman (user).
     */
    public function fisherman(): BelongsTo
    {
        return $this->belongsTo(User::class, 'fisherman_id');
    }
}