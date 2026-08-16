<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Services\PayoutDisbursementService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class WalletController extends Controller
{
    /**
     * Top up the authenticated user's virtual wallet balance.
     */
    public function deposit(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'amount' => ['required', 'numeric', 'min:50', 'max:500000'],
            'payment_method' => ['required', 'string', 'in:gcash,maya,bank_transfer'],
        ]);

        $user = $request->user();

        DB::transaction(function () use ($user, $validated) {
            $user->increment('wallet_balance', $validated['amount']);
        });

        return redirect()->back()->with(
            'success',
            '₱' . number_format($validated['amount'], 2) . ' successfully deposited via ' . strtoupper($validated['payment_method']) . '.'
        );
    }

    /**
     * Withdraw funds from the authenticated user's virtual wallet via external payout rails.
     */
    public function withdraw(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'amount' => ['required', 'numeric', 'min:100', 'max:500000'],
            'payout_method' => ['required', 'string', 'in:gcash,maya,bank_transfer'],
            'account_number' => ['required', 'string', 'max:50'],
            'account_name' => ['required', 'string', 'max:255'],
        ]);

        $amount = (float) $validated['amount'];
        $user = $request->user();

        $payoutResult = DB::transaction(function () use ($user, $amount, $validated) {
            /** @var User $lockedUser */
            $lockedUser = User::where('id', $user->id)->lockForUpdate()->first();

            if ((float) $lockedUser->wallet_balance < $amount) {
                return [
                    'status' => 'insufficient_balance',
                ];
            }

            $disbursement = PayoutDisbursementService::disburse(
                $validated['payout_method'],
                $validated['account_number'],
                $validated['account_name'],
                $amount
            );

            if (! $disbursement['success']) {
                return [
                    'status' => 'gateway_failure',
                    'message' => $disbursement['message'],
                ];
            }

            $lockedUser->decrement('wallet_balance', $amount);

            return [
                'status' => 'success',
                'reference_id' => $disbursement['reference_id'],
            ];
        });

        if ($payoutResult['status'] === 'insufficient_balance') {
            return redirect()->back()->withErrors([
                'amount' => 'Insufficient wallet balance for this withdrawal amount.',
            ]);
        }

        if ($payoutResult['status'] === 'gateway_failure') {
            return redirect()->back()->withErrors([
                'payout_method' => $payoutResult['message'] ?? 'Payout disbursement gateway transaction failed.',
            ]);
        }

        return redirect()->back()->with(
            'success',
            '₱' . number_format($amount, 2) . ' successfully withdrawn to ' . strtoupper($validated['payout_method']) . ' (' . $validated['account_number'] . ') [Ref: ' . $payoutResult['reference_id'] . '].'
        );
    }
}