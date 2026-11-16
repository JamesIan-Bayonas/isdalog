<?php // File: isdalog/app/Services/AccountLedger.php

namespace App\Services;

use App\Models\User;
use App\Models\Wallet;
use App\Models\WalletTransaction;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class AccountLedger
{
    public static function cents(mixed $amount): int
    {
        $value = (string) $amount;
        if (! preg_match('/^(-?)(\d{1,10})(?:\.(\d{1,2}))?$/D', $value, $matches)) {
            throw ValidationException::withMessages(['error' => 'Money must have at most two decimal places.']);
        }

        return ($matches[1] === '-' ? -1 : 1) * ((int) $matches[2] * 100 + (int) str_pad($matches[3] ?? '', 2, '0'));
    }

    public static function decimal(int $cents): string
    {
        return ($cents < 0 ? '-' : '').intdiv(abs($cents), 100).'.'.str_pad((string) (abs($cents) % 100), 2, '0', STR_PAD_LEFT);
    }

    /** User balance is authoritative. Caller must hold its surrounding domain transaction. */
    public static function move(int $userId, int $delta, string $purpose, ?int $orderId = null): WalletTransaction
    {
        if (DB::transactionLevel() < 1 || $delta === 0) {
            throw new \LogicException('Ledger movements need a transaction and a nonzero amount.');
        }
        $user = User::whereKey($userId)->lockForUpdate()->firstOrFail();
        $before = self::cents($user->wallet_balance);
        $after = $before + $delta;
        if ($after < 0 || $after > 9999999999) {
            throw ValidationException::withMessages(['error' => 'Insufficient funds or account balance limit exceeded.']);
        }
        $wallet = Wallet::firstOrCreate(['user_id' => $userId], ['balance' => 0]);
        $wallet = Wallet::whereKey($wallet->id)->lockForUpdate()->firstOrFail();
        $difference = $before - self::cents($wallet->balance);
        if ($difference !== 0) {
            WalletTransaction::create(['wallet_id' => $wallet->id, 'order_id' => null,
                'type' => $difference > 0 ? 'credit' : 'debit', 'purpose' => 'balance_reconciliation',
                'amount' => self::decimal(abs($difference)), 'balance_after' => self::decimal($before)]);
        }
        $user->update(['wallet_balance' => self::decimal($after)]);
        $wallet->update(['balance' => self::decimal($after)]);

        return WalletTransaction::create(['wallet_id' => $wallet->id, 'order_id' => $orderId,
            'type' => $delta > 0 ? 'credit' : 'debit', 'purpose' => $purpose,
            'amount' => self::decimal(abs($delta)), 'balance_after' => self::decimal($after)]);
    }
}
