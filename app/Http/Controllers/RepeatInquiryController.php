<?php // File: isdalog/app/Http/Controllers/RepeatInquiryController.php

namespace App\Http\Controllers;

use App\Services\TransactionNotifications;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class RepeatInquiryController extends Controller
{
    public function store(Request $request, int $order)
    {
        $data = $request->validate(['message' => ['required', 'string', 'max:1000']]);

        DB::transaction(function () use ($request, $order, $data) {
            $record = DB::table('orders_logistics')->where('id', $order)->lockForUpdate()->first();
            abort_unless($record && (int) $record->user_id === (int) $request->user()->id, 404);
            abort_unless($request->user()->role === 'buyer' && $record->status === 'completed', 403);

            if (DB::table('repeat_inquiries')->where('order_id', $order)->exists()) {
                return;
            }

            DB::table('repeat_inquiries')->insert(['order_id' => $order, 'message' => $data['message'], 'created_at' => now(), 'updated_at' => now()]);
            TransactionNotifications::record([$record->fisherman_id], "order:$order:repeat-inquiry", 'Repeat buying inquiry', 'A past buyer asked about a new purchase. Open the order to reply.', 'order', $order);
        }, 3);

        return back();
    }

    public function reply(Request $request, int $order)
    {
        $data = $request->validate(['reply' => ['required', 'string', 'max:1000']]);

        DB::transaction(function () use ($request, $order, $data) {
            $record = DB::table('orders_logistics')->where('id', $order)->lockForUpdate()->first();
            abort_unless($record && (int) $record->fisherman_id === (int) $request->user()->id, 404);
            $inquiry = DB::table('repeat_inquiries')->where('order_id', $order)->first();
            abort_unless($inquiry, 404);
            if ($inquiry->replied_at) {
                throw ValidationException::withMessages(['reply' => 'This inquiry already has a reply.']);
            }

            DB::table('repeat_inquiries')->where('id', $inquiry->id)->update(['reply' => $data['reply'], 'replied_at' => now(), 'updated_at' => now()]);
            TransactionNotifications::record([$record->user_id], "order:$order:repeat-reply", 'Repeat buying reply', 'The seller replied to your inquiry. Open the order to read the reply.', 'order', $order);
        }, 3);

        return back();
    }
}
