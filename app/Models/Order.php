<?php // File: isdalog/app/Models/Order.php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    protected $table = 'orders_logistics';
    protected $hidden = ['pickup_otp', 'delivery_otp'];
}
