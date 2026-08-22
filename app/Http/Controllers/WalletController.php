<?php
// app/Http/Controllers/WalletController.php
namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Wallet;
use App\Models\WalletTransaction;
use App\Models\WithdrawalRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class WalletController extends Controller
{
    public function requestWithdrawal(Request $request): JsonResponse
{
        $validated = $request->validate([
            'amount'         => 'required|numeric|min:50',
            'payment_method' => 'required|in:gcash,maya',
            'account_name'   => 'required|string|max:100',
            'account_number' => 'required|string|max:20',
        ]);

        return DB::transaction(function () use ($validated, $request) {
            $user = $request->user();
            $wallet = Wallet::where('user_id', $user->id)->lockForUpdate()->firstOrFail();

            if ($wallet->balance < $validated['amount']) {
                return response()->json([
                    'message' => 'Insufficient wallet balance.'
                ], 422);
            }

            // Deduct balance to hold funds
            $wallet->balance -= $validated['amount'];
            $wallet->save();

            $withdrawal = WithdrawalRequest::create([
                'user_id'        => $user->id,
                'amount'         => $validated['amount'],
                'payment_method' => $validated['payment_method'],
            'account_name'   => $validated['account_name'],
                'account_number' => $validated['account_number'],
                'status'         => 'pending',
            ]);

            WalletTransaction::create([
                'wallet_id'     => $wallet->id,
                'order_id'      => null,
                'type'          => 'debit',
                'purpose'       => 'withdrawal',
                'amount'        => $validated['amount'],
                'balance_after' => $wallet->balance,
            ]);

            return response()->json([
                'status'     => 'success',
                'message'    => 'Withdrawal request submitted successfully.',
                'withdrawal' => $withdrawal,
            ]);
        });
    }

    /**
     * Deposit demonstration or top-up funds into the authenticated operator's wallet.
     */
    public function deposit(Request $request): RedirectResponse|JsonResponse
    {
        $validated = $request->validate([
            'amount' => ['required', 'numeric', 'min:1', 'max:100000'],
        ]);

        $user = $request->user();
        $amount = (float) $validated['amount'];

        DB::transaction(function () use ($user, $amount) {
            // 1. Lock and increment the User virtual wallet balance
            /** @var \App\Models\User $lockedUser */
            $lockedUser = User::where('id', $user->id)->lockForUpdate()->firstOrFail();
            $lockedUser->wallet_balance = (float) $lockedUser->wallet_balance + $amount;
            $lockedUser->save();

            // 2. Synchronize double-entry Wallets and Transactions ledger
            /** @var \App\Models\Wallet $wallet */
            $wallet = Wallet::firstOrCreate(
                ['user_id' => $lockedUser->id],
                ['balance' => 0.00]
            );
            $wallet->balance = (float) $wallet->balance + $amount;
            $wallet->save();

            WalletTransaction::create([
                'wallet_id'     => $wallet->id,
                'order_id'      => null,
                'type'          => 'credit',
                'purpose'       => 'deposit',
                'amount'        => $amount,
                'balance_after' => $wallet->balance,
            ]);
        });

        if ($request->wantsJson() && ! $request->header('X-Inertia')) {
            return response()->json([
                'status'         => 'success',
                'message'        => 'Funds successfully deposited into your wallet.',
                'wallet_balance' => (float) $user->fresh()->wallet_balance,
            ]);
        }

        return redirect()->back()->with(
            'success',
            '₱' . number_format($amount, 2) . ' successfully deposited to your wallet balance.'
        );
    }
}