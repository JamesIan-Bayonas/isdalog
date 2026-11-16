<?php // File: isdalog/app/Http/Controllers/WithdrawalNotificationController.php

namespace App\Http\Controllers;

use App\Models\WithdrawalNotification;
use Illuminate\Http\Request;
use Inertia\Inertia;

class WithdrawalNotificationController extends Controller
{
    public function index(Request $request)
    {
        $validated = $request->validate(['filter' => ['nullable', 'in:all,unread']]);
        $filter = $validated['filter'] ?? 'all';
        return Inertia::render('Notifications/Index', [
            'notifications' => WithdrawalNotification::where('user_id', $request->user()->id)
                ->when($filter === 'unread', fn ($query) => $query->whereNull('read_at'))
                ->orderByDesc('id')->paginate(20)->withQueryString(),
            'filter' => $filter,
        ]);
    }

    public function read(Request $request, int $notification)
    {
        $record = $this->owned($request, $notification);
        $this->markRead($record);
        return back();
    }

    public function open(Request $request, int $notification)
    {
        $record = $this->owned($request, $notification);
        $this->markRead($record);
        if ($record->subject_type === 'support') return redirect()->route('support.index');
        if ($record->subject_type === 'account') return redirect()->route('profile.edit');
        if ($record->subject_type === 'order') return redirect()->route('orders.show', $record->subject_id);
        if ($record->subject_type === 'listing') return redirect()->route('catches.show', $record->subject_id);
        if ($record->subject_type === 'withdrawal_review') {
            abort_unless($request->user()->role === 'admin', 403);
            return redirect()->route('admin.withdrawals.index');
        }
        return redirect()->route('dashboard', ['withdrawal' => $record->withdrawal_request_id]);
    }

    public function readAll(Request $request)
    {
        WithdrawalNotification::where('user_id', $request->user()->id)->whereNull('read_at')->update(['read_at' => now()]);
        return back();
    }

    private function owned(Request $request, int $id): WithdrawalNotification
    {
        return WithdrawalNotification::where('user_id', $request->user()->id)->findOrFail($id);
    }

    private function markRead(WithdrawalNotification $record): void
    {
        WithdrawalNotification::whereKey($record->id)->whereNull('read_at')->update(['read_at' => now()]);
    }
}
