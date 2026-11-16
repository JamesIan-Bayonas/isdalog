<?php // File: isdalog/app/Http/Controllers/SupportController.php

namespace App\Http\Controllers;

use App\Models\User;
use App\Services\TransactionNotifications;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class SupportController extends Controller
{
    public function index(Request $request)
    {
        $admin = $request->user()->role === 'admin';

        return Inertia::render('Support/Index', ['requests' => DB::table('support_requests')->select('id', 'category', 'subject', 'message', 'status', 'response', 'created_at', 'resolved_at')->when($admin, fn ($q) => $q->addSelect(['submitted_by' => User::select('email')->whereColumn('users.id', 'support_requests.user_id')]))->when(! $admin, fn ($q) => $q->where('user_id', $request->user()->id))->orderByRaw("case when status = 'open' then 0 else 1 end")->orderByDesc('id')->paginate(15)->withQueryString(), 'isAdmin' => $admin]);
    }

    public function store(Request $request)
    {
        $data = $request->validate(['category' => ['required', 'in:account,technical,safety,other'], 'subject' => ['required', 'string', 'min:5', 'max:150'], 'message' => ['required', 'string', 'min:20', 'max:3000']]);
        DB::transaction(function () use ($request, $data) {
            $id = DB::table('support_requests')->insertGetId([...$data, 'user_id' => $request->user()->id, 'status' => 'open', 'created_at' => now(), 'updated_at' => now()]);
            TransactionNotifications::record(User::where('role', 'admin')->pluck('id')->all(), "support:$id:opened", 'New support request', 'A private support request needs review.', 'support', $id);
        });

        return back()->with('success', 'Request recorded. An administrator can respond here; response times are not guaranteed.');
    }

    public function resolve(Request $request, int $support)
    {
        abort_unless($request->user()->role === 'admin', 403);
        $data = $request->validate(['response' => ['required', 'string', 'min:10', 'max:3000']]);
        DB::transaction(function () use ($request, $support, $data) {
            $record = DB::table('support_requests')->where('id', $support)->lockForUpdate()->first();
            abort_unless($record, 404);
            if ($record->status !== 'open') {
                throw ValidationException::withMessages(['response' => 'This request has already been answered. Refresh to read the response.']);
            }
            DB::table('support_requests')->where('id', $support)->update([...$data, 'status' => 'answered', 'reviewer_id' => $request->user()->id, 'resolved_at' => now(), 'updated_at' => now()]);
            TransactionNotifications::record([$record->user_id], "support:$support:answered", 'Support response available', 'Read the administrator response in Help & support.', 'support', $support);
        });

        return back()->with('success','Response saved.');
    }
}
