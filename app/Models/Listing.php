<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Listing extends Model
{
    use HasFactory;

    // Add this property to allow mass assignment
    protected $fillable = [
        'user_id',
        'fish_name',
        'weight_kg',
        'starting_price',
        'current_bid',
        'location',
        'status',
    ];

    // Assuming you have relationships set up, they would be down here...
    public function user()
    {
        return $this->belongsTo(User::class);
    }
    
    public function bids()
    {
        return $this->hasMany(Bid::class);
    }
}