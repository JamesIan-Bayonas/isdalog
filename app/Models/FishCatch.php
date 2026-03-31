<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class FishCatch extends Model
{
    use HasFactory;

    // Explicitly tell Laravel which table to connect to
    protected $table = 'catches';

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