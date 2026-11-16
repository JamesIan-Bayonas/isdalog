<?php // File: isdalog/app/Http/Controllers/ProfileController.php

namespace App\Http\Controllers;

use App\Http\Requests\ProfileUpdateRequest;
use App\Models\User;
use App\Services\AccountResponsibilities;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Redirect;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{
    /**
     * Display the user's profile form.
     */
    public function edit(Request $request): Response
    {
        return Inertia::render('Profile/Edit', [
            'accountReviews' => \Illuminate\Support\Facades\DB::table('account_reviews')->where('user_id', $request->user()->id)->select('action', 'resulting_role', 'resulting_status', 'reason', 'created_at')->orderByDesc('id')->limit(10)->get(),
            'mustVerifyEmail' => $request->user() instanceof MustVerifyEmail,
            'status' => session('status'),
            'botUsername' => env('TELEGRAM_BOT_USERNAME', 'isdalog_connect_bot'),
        ]);
    }

    /**
     * Generate a short-lived one-time pairing token for Telegram deep linking.
     */
    public function generateTelegramLinkToken(Request $request): JsonResponse
    {
        $user = $request->user();
        $token = Str::random(32);

        // Valid for 10 minutes
        Cache::put('telegram_bind_'.$token, $user->id, now()->addMinutes(10));

        $botUsername = env('TELEGRAM_BOT_USERNAME', 'isdalog_connect_bot');
        $deepLinkUrl = "https://t.me/{$botUsername}?start=link_{$token}";

        return response()->json([
            'status' => 'success',
            'token' => $token,
            'deep_link' => $deepLinkUrl,
            'expires_in_minutes' => 10,
        ]);
    }

    /**
     * Unlink the connected Telegram account.
     */
    public function unlinkTelegramAccount(Request $request): RedirectResponse
    {
        $request->user()->update([
            'telegram_chat_id' => null,
        ]);

        return Redirect::route('profile.edit')->with('success', 'Telegram account disconnected successfully.');
    }

    /**
     * Update the user's profile information.
     */
    public function update(ProfileUpdateRequest $request): RedirectResponse
    {
        $request->user()->fill($request->validated());

        if ($request->user()->isDirty('email')) {
            $request->user()->email_verified_at = null;
        }

        $request->user()->save();

        return Redirect::route('profile.edit')->with('success', 'Profile updated successfully.');
    }

    /**
     * Process an operator upgrade compliance request.
     */
    public function upgradeRole(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'requested_role' => ['required', 'string', 'in:fisherman,rider'],
            'bfar_registration_number' => ['nullable', 'string', 'max:255', 'required_if:requested_role,fisherman'],
            'vehicle_details' => ['nullable', 'string', 'max:255', 'required_if:requested_role,rider'],
        ]);

        DB::transaction(function () use ($request, $validated) {
            $user = User::whereKey($request->user()->id)->lockForUpdate()->firstOrFail();
            if (! $user->contact_number) {
                throw ValidationException::withMessages(['requested_role' => 'Save your contact number in Profile information first.']);
            }
            if ($user->status === 'pending_review' || ($user->role !== 'buyer' && $user->status === 'verified') || $user->role === 'admin') {
                abort(403);
            }
            AccountResponsibilities::assertNoActiveOrders($user->id);
            $user->update([
                'requested_role' => $validated['requested_role'],
                'bfar_registration_number' => $validated['bfar_registration_number'] ?? null,
                'vehicle_details' => $validated['vehicle_details'] ?? null,
                'status' => 'pending_review',
            ]);
        });

        return Redirect::route('profile.edit')->with('success', 'Role details submitted for IsdaLog administrator review. This is not government certification.');
    }

    /**
     * Delete the user's account.
     */
    public function destroy(Request $request): RedirectResponse
    {
        $request->validate([
            'password' => ['required', 'current_password'],
        ]);

        DB::transaction(function () use ($request) {
            $user = User::whereKey($request->user()->id)->lockForUpdate()->firstOrFail();
            AccountResponsibilities::assertNoActiveOrders($user->id);
            if ($user->wallet_balance != 0
                || DB::table('orders_logistics')->where(fn ($q) => $q->where('user_id', $user->id)->orWhere('fisherman_id', $user->id)->orWhere('rider_id', $user->id))->exists()
                || DB::table('support_requests')->where('user_id', $user->id)->orWhere('reviewer_id', $user->id)->exists()
                || DB::table('account_reviews')->where('user_id', $user->id)->orWhere('reviewer_id', $user->id)->exists()
                || DB::table('wallet_transactions')->whereIn('wallet_id', DB::table('wallets')->select('id')->where('user_id', $user->id))->exists()
                || DB::table('withdrawal_requests')->where('user_id', $user->id)->exists()) {
                throw ValidationException::withMessages(['password' => 'This account has financial or support records. Request account closure through Help & support so records and responsibilities can be reviewed.']);
            }
            $user->delete();
        });
        Auth::logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return Redirect::to('/');
    }
}
