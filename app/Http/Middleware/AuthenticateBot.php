<?php

// File: isdalog/app/Http/Middleware/AuthenticateBot.php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class AuthenticateBot
{
    public function handle(Request $request, Closure $next)
    {
        $secret = (string) config('ingestion.bot_secret');
        if ($secret === '' || ! hash_equals($secret, (string) $request->header('X-Isdalog-Bot-Secret'))) {
            return response()->json(['status' => 'error', 'data' => null, 'message' => 'Bot authentication required.'], 401);
        }
        $request->attributes->set('authenticated_bot', true);

        return $next($request);
    }
}
