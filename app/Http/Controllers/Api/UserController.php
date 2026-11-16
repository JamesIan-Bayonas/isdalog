<?php

// File: isdalog/app/Http/Controllers/Api/UserController.php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class UserController extends Controller
{
    public function handshake(Request $request): JsonResponse
    {
        $input = $request->validate(['telegram_chat_id' => ['required', 'string', 'max:64']]);
        $user = User::where('telegram_chat_id', $input['telegram_chat_id'])->where('role', 'fisherman')->first();
        if (! $user) {
            return response()->json(['status' => 'error', 'data' => null, 'message' => 'Link a fisherman account from your web profile first.'], 403);
        }

        return response()->json(['status' => 'success', 'data' => ['name' => $user->name], 'message' => 'Account linked.']);
    }

    public function linkTelegramAccount(Request $request): JsonResponse
    {
        $input = $request->validate([
            'token' => ['required', 'string', 'size:32'],
            'telegram_chat_id' => ['required', 'string', 'max:64'],
            'telegram_username' => ['nullable', 'string', 'max:255'],
        ]);
        $key = 'telegram_bind_'.$input['token'];

        return Cache::lock('telegram_link_'.hash('sha256', $input['token']), 15)->block(3, function () use ($input, $key) {
            $id = Cache::get($key);
            if (! $id) {
                return response()->json(['status' => 'error', 'data' => null, 'message' => 'Link code expired or already used. Generate a new code in your profile.'], 422);
            }
            try {
                return DB::transaction(function () use ($id, $input, $key) {
                    $user = User::whereKey($id)->lockForUpdate()->firstOrFail();
                    if ($user->role !== 'fisherman') {
                        return response()->json(['status' => 'error', 'data' => null, 'message' => 'A fisherman account is required.'], 403);
                    }
                    if (User::where('telegram_chat_id', $input['telegram_chat_id'])->where('id', '!=', $id)->exists()) {
                        return response()->json(['status' => 'error', 'data' => null, 'message' => 'Telegram account is already linked.'], 409);
                    }
                    $user->update(['telegram_chat_id' => $input['telegram_chat_id']]);
                    Cache::forget($key);

                    return response()->json(['status' => 'success', 'data' => ['name' => $user->name], 'user' => ['name' => $user->name], 'message' => 'Account connected.']);
                });
            } catch (\Illuminate\Database\UniqueConstraintViolationException $exception) {
                return response()->json(['status' => 'error', 'data' => null, 'message' => 'Telegram account is already linked.'], 409);
            }
        });
    }
}
