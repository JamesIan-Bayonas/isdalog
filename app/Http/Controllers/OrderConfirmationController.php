<?php // File: isdalog/app/Http/Controllers/OrderConfirmationController.php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class OrderConfirmationController extends Controller
{
    /** Compatibility entry point: all settlement uses the same permissions and ledger. */
    public function confirm(Request $request, int $id): RedirectResponse
    {
        return app(OrderController::class)->confirm($request, $id);
    }
}
