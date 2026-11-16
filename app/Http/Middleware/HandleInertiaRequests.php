<?php // File: isdalog/app/Http/Middleware/HandleInertiaRequests.php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        return [
            ...parent::share($request),
            'flash' => ['success' => fn () => $request->session()->get('success'), 'error' => fn () => $request->session()->get('error')],
            'gettingStarted' => fn () => $request->routeIs('dashboard') && $request->user() ? \App\Services\GettingStarted::forUser($request->user()) : null,
            'integrations' => \App\Services\IntegrationState::publicState(),
            'withdrawalUnreadCount' => fn () => $request->user()
                ? \App\Models\WithdrawalNotification::where('user_id', $request->user()->id)->whereNull('read_at')->count()
                : 0,
            'auth' => [
                'user' => $request->user() ? [
                    ...$request->user()->toArray(),
                    'role' => $request->user()->role, // Explicitly share the role
                ] : null,
            ],
        ];
    }
}
