<?php // File: isdalog/app/Http/Controllers/WalletController.php
// app/Http/Controllers/WalletController.php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\WithdrawalRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class WalletController extends Controller
{
    /** Reserve funds for review; this does not call a payout provider. */
    public function withdraw(Request $request): RedirectResponse
    {
        abort_unless($request->user()->role === 'fisherman', 403);
        $validated = $request->validate([
            'amount' => ['required', 'numeric', 'min:100', 'decimal:0,2'],
            'payout_method' => ['required', 'in:gcash,maya'],
            'account_name' => ['required', 'string', 'max:100'],
            'account_number' => ['required', 'string', 'max:20'],
        ]);

        return DB::transaction(function () use ($request, $validated) {
            $user = User::whereKey($request->user()->id)->lockForUpdate()->firstOrFail();
            $amount = $validated['amount'];
            if (\App\Services\AccountLedger::cents($amount) > \App\Services\AccountLedger::cents($user->wallet_balance)) {
                throw \Illuminate\Validation\ValidationException::withMessages([
                    'amount' => 'The withdrawal amount exceeds your available balance.',
                ]);
            }

            \App\Services\AccountLedger::move($user->id, -\App\Services\AccountLedger::cents($amount), 'withdrawal');
            WithdrawalRequest::create([
                'user_id' => $user->id,
                'amount' => $amount,
                'payment_method' => $validated['payout_method'],
                'account_name' => $validated['account_name'],
                'account_number' => $validated['account_number'],
                'status' => 'pending',
            ]);

            return redirect()->back()->with('success', 'Withdrawal request recorded. Funds are reserved pending review; payout is not yet confirmed.');
        });
    }

    public function requestWithdrawal(Request $request): JsonResponse
    {
        $request->merge(['payout_method' => $request->input('payment_method')]);
        $this->withdraw($request);

        return response()->json(['status' => 'success', 'message' => 'Withdrawal request recorded; payout is not confirmed.']);
    }

    /**
     * Deposit demonstration or top-up funds into the authenticated operator's wallet.
     */
    public function deposit(Request $request): RedirectResponse|JsonResponse
    {
        abort_unless(\App\Services\IntegrationState::demoFundingEnabled(), 503, 'Wallet funding is unavailable. No live payment provider is configured.');
        $validated = $request->validate([
            'amount' => ['required', 'numeric', 'min:50', 'max:100000', 'decimal:0,2'],
        ]);

        $user = $request->user();
        $amount = $validated['amount'];

        DB::transaction(function () use ($user, $amount) {
            \App\Services\AccountLedger::move($user->id, \App\Services\AccountLedger::cents($amount), 'deposit');
        });

        if ($request->wantsJson() && ! $request->header('X-Inertia')) {
            return response()->json([
                'status' => 'success',
                'message' => 'Demo credit recorded. No real payment was made.',
                'wallet_balance' => (float) $user->fresh()->wallet_balance,
            ]);
        }

        return redirect()->back()->with(
            'success',
            '₱'.number_format($amount, 2).' demo credit recorded. No real payment was made.'
        );
    }
}
