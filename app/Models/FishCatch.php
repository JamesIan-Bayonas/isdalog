<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class FishCatch extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id', 
        'species', 
        'weight', 
        'location', 
        'latitude', 
        'longitude', 
        'logged_at'
    ];

    // Relationship to User
    public function user()
    {
        return $this->belongsTo(User::class);
    }
}