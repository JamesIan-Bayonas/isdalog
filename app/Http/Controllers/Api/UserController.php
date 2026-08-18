<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class UserController extends Controller
{
    /**
     * Link an authenticated web user's account with their Telegram chat ID via deep link token.
     */
    public function linkTelegramAccount(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'token' => ['required', 'string'],
            'telegram_chat_id' => ['required', 'string'],
            'telegram_username' => ['nullable', 'string', 'max:255'],
        ]);

        $cacheKey = 'telegram_bind_' . $validated['token'];
        $userId = Cache::get($cacheKey);

        if (! $userId) {
            return response()->json([
                'status' => 'error',
                'message' => 'The linking authorization code has expired or is invalid. Please generate a new one from your profile.',
            ], 422);
        }

        /** @var User|null $user */
        $user = User::find($userId);

        if (! $user) {
            return response()->json([
                'status' => 'error',
                'message' => 'Target user account not found.',
            ], 404);
        }

        // Check if this Telegram ID is already linked to another account
        $existingLinkedUser = User::where('telegram_chat_id', $validated['telegram_chat_id'])
            ->where('id', '!=', $user->id)
            ->first();

        if ($existingLinkedUser) {
            return response()->json([
                'status' => 'error',
                'message' => 'This Telegram account is already linked to another operator account.',
            ], 409);
        }

        $user->update([
            'telegram_chat_id' => $validated['telegram_chat_id'],
        ]);

        Cache::forget($cacheKey);

        return response()->json([
            'status' => 'success',
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'telegram_chat_id' => $user->telegram_chat_id,
            ],
            'message' => "Account successfully connected! Hello, {$user->name}.",
        ]);
    }
}