<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class FishCatch extends Model
{
    use HasFactory;

    // Explicitly define the table name since 'catches' might confuse Laravel's pluralizer
    protected $table = 'catches';

    protected $fillable = [
        'user_id',
        'species',
        'weight',
        'location',
        'latitude',
        'longitude'
    ];
}