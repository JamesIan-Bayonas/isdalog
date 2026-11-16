<?php // File: isdalog/app/Http/Controllers/WithdrawalReviewController.php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\WithdrawalRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class WithdrawalReviewController extends Controller
{
    public function index(Request $request): Response
    {
        abort_unless($request->user()->role === 'admin', 403);
        $filters = $request->validate([
            'status' => ['nullable', 'in:pending,approved,rejected,all'],
        ]);
        $status = $filters['status'] ?? 'pending';
        $withdrawals = WithdrawalRequest::with(['user:id,name', 'payout'])
            ->when($status !== 'all', fn ($query) => $query->where('status', $status))
            ->orderByDesc('created_at')->orderByDesc('id')
            ->paginate(20)->withQueryString();

        return Inertia::render('Admin/Withdrawals', [
            'withdrawals' => $withdrawals,
            'filters' => ['status' => $status],
            'flash' => ['success' => $request->session()->get('success')],
            'sandboxPayouts' => \App\Services\PayoutDisbursementService::sandboxEnabled(),
        ]);
    }

    public function review(Request $request, WithdrawalRequest $withdrawal): RedirectResponse
    {
        abort_unless($request->user()->role === 'admin', 403);
        $validated = $request->validate([
            'decision' => ['required', 'in:approved,rejected'],
            'review_note' => ['required', 'string', 'max:500', 'regex:/\S/u'],
        ]);

        return DB::transaction(function () use ($request, $withdrawal, $validated) {
            $record = WithdrawalRequest::whereKey($withdrawal->id)->lockForUpdate()->firstOrFail();
            if ($record->status !== 'pending' || $record->reviewed_at || $record->refund_transaction_id) {
                throw ValidationException::withMessages(['decision' => 'This request has already been reviewed. Refresh to see the recorded decision.']);
            }

            if ($validated['decision'] === 'rejected') {
                // Same authoritative balance and user lock used when reserving the funds.
                $refund = \App\Services\AccountLedger::move($record->user_id, \App\Services\AccountLedger::cents($record->amount), 'withdrawal_refund');
                $record->refund_transaction_id = $refund->id;
            }

            $record->status = $validated['decision'];
            $record->reviewed_by = $request->user()->id;
            $record->reviewer_name = $request->user()->name;
            $record->reviewed_at = now();
            $record->review_note = trim($validated['review_note']);
            $record->save();

            app(\App\Services\WithdrawalNotificationService::class)->record(
                $record, 'review_'.$record->status,
                $record->status === 'rejected' ? 'Withdrawal rejected — funds returned' : 'Withdrawal approved for payout',
                'Request #'.$record->id.' · ₱'.number_format((float) $record->amount, 2).'. '
                    .($record->status === 'rejected' ? 'Reserved funds were returned to your available balance. ' : 'Funds remain reserved; payment is not yet confirmed. ')
                    .'Reason: '.$record->review_note
            );

            return back()->with('success', $record->status === 'rejected'
                ? 'Withdrawal rejected. Reserved funds have been returned to the fisherman’s available balance.'
                : 'Withdrawal approved for payout. Funds remain reserved; no provider payment has been made.');
        });
    }
}
