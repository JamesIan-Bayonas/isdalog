<?php

namespace App\Services;

use App\Models\WithdrawalNotification;
use App\Models\WithdrawalRequest;

class WithdrawalNotificationService
{
    /** Called inside the financial transaction: an aborted change cannot publish a notice. */
    public function record(WithdrawalRequest $request, string $kind, string $title, string $message): void
    {
        WithdrawalNotification::firstOrCreate([
            'withdrawal_request_id' => $request->id, 'kind' => $kind,
        ], ['user_id' => $request->user_id, 'title' => $title, 'message' => $message]);
    }
}
