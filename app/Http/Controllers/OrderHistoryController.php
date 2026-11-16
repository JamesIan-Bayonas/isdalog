<?php // File: isdalog/app/Http/Controllers/OrderHistoryController.php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class OrderHistoryController extends Controller
{
    private function records(Request $request)
    {
        return DB::table('orders_logistics as orders')->join('listings', 'orders.listing_id', '=', 'listings.id')
            ->leftJoin('users as sellers', 'orders.fisherman_id', '=', 'sellers.id')
            ->leftJoin('users as buyers', 'orders.user_id', '=', 'buyers.id')
            ->leftJoin('users as riders', 'orders.rider_id', '=', 'riders.id')
            ->when($request->user()->role !== 'admin', fn ($query) => $query->where(fn ($q) => $q
                ->where('orders.user_id', $request->user()->id)->orWhere('orders.fisherman_id', $request->user()->id)->orWhere('orders.rider_id', $request->user()->id)))
            ->select('orders.id', 'orders.listing_id', 'orders.user_id', 'orders.fisherman_id', 'orders.rider_id', 'orders.status',
                'orders.logistics_type', 'orders.final_price', 'orders.delivery_fee', 'orders.escrow_balance', 'orders.created_at',
                'orders.picked_up_at', 'orders.delivered_at', 'orders.completed_at', 'orders.sale_snapshot_at',
                DB::raw('COALESCE(orders.sale_fish_name,listings.fish_name) as fish_name'), DB::raw('COALESCE(orders.sale_weight_kg,listings.weight_kg) as weight_kg'), DB::raw('COALESCE(orders.sale_location,listings.location) as location'),
                'sellers.name as seller_name', 'buyers.name as buyer_name', 'riders.name as rider_name');
    }

    public function index(Request $request)
    {
        $filters = $request->validate(['status' => ['nullable', 'in:all,active,completed'], 'page' => ['nullable', 'integer', 'min:1']]);
        $status = $filters['status'] ?? 'active';
        $orders = $this->records($request)->when($status === 'active', fn ($q) => $q->whereIn('orders.status', ['pending_dispatch', 'en_route', 'delivered']))
            ->when($status === 'completed', fn ($q) => $q->whereIn('orders.status', ['completed', 'cancelled', 'refunded']))->orderByDesc('orders.id')->paginate(15)->withQueryString();

        return Inertia::render('Orders/Index', ['orders' => $orders, 'status' => $status]);
    }

    public function show(Request $request, int $order)
    {
        $record = $this->records($request)->where('orders.id', $order)->first();
        abort_unless($record, 404);
        $buyer = (int) $record->user_id === (int) $request->user()->id && $request->user()->role === 'buyer';
        $seller = (int) $record->fisherman_id === (int) $request->user()->id && $request->user()->role === 'fisherman';
        $code = null;
        $codeKind = null;
        if ($seller && $record->status === 'pending_dispatch') {
            $codeKind = 'Pickup';
            $code = DB::table('orders_logistics')->where('id', $order)->value('pickup_otp');
        }
        if ($buyer && $record->logistics_type === 'request_rider' && in_array($record->status, ['pending_dispatch', 'en_route'])) {
            $codeKind = 'Delivery';
            $code = DB::table('orders_logistics')->where('id', $order)->value('delivery_otp');
        }
        $settlement = DB::table('order_settlements')->where('order_id', $order)->first(['funded_amount', 'fisherman_amount', 'rider_amount', 'platform_fee', 'created_at']);
        $issue = DB::table('order_issues')->where('order_id', $order)->first();
        $delivery = DB::table('orders_logistics')->where('id', $order)->first(['destination_area', 'delivery_address', 'recipient_name', 'recipient_phone', 'delivery_instructions', 'delivery_details_saved_at', 'delivery_details_required']);
        $refund = DB::table('order_refunds')->where('order_id', $order)->first(['amount', 'kind', 'reason', 'created_at']);

        $isOriginalSeller = (int) $record->fisherman_id === (int) $request->user()->id;
        $repeatInquiry = ((int) $record->user_id === (int) $request->user()->id || $isOriginalSeller) ? DB::table('repeat_inquiries')->where('order_id', $order)
            ->first(['message', 'reply', 'created_at', 'replied_at']) : null;

        return Inertia::render('Orders/Show', ['trace' => \App\Services\OrderTrace::forOrder($order, $request->user()), 'order' => $record, 'repeatInquiry' => $repeatInquiry, 'canAskAgain' => $buyer && $record->status === 'completed' && ! $repeatInquiry, 'canReplyAgain' => $isOriginalSeller && $repeatInquiry && ! $repeatInquiry->replied_at, 'settlement' => $settlement, 'handover' => ['kind' => $codeKind, 'code' => $code],
            'delivery' => $delivery, 'canEditDelivery' => $buyer && $record->logistics_type === 'request_rider' && $record->status === 'pending_dispatch' && ! $record->rider_id && ! $record->picked_up_at,
            'issue' => $issue, 'refund' => $refund,
            'canCancel' => in_array((int) $request->user()->id, [(int) $record->user_id, (int) $record->fisherman_id], true) && $record->status === 'pending_dispatch' && ! $record->rider_id && ! $record->picked_up_at,
            'canReport' => in_array((int) $request->user()->id, [(int) $record->user_id, (int) $record->fisherman_id, (int) $record->rider_id], true) && ! $issue && in_array($record->status, ['en_route', 'delivered', 'completed'], true),
            'canReview' => $request->user()->role === 'admin' && $issue && $issue->status === 'open',
            'canDispatch' => in_array($request->user()->role, ['rider', 'admin'], true),
            'canConfirm' => (! $issue || $issue->status !== 'open') && $buyer && ($record->status === 'delivered' || ($record->logistics_type === 'self_pickup' && $record->status === 'pending_dispatch')),
            'canDeliver' => $request->user()->role === 'rider' && $request->user()->status === 'verified' && (int) $record->rider_id === (int) $request->user()->id && $record->status === 'en_route' && $record->logistics_type === 'request_rider']);
    }
}
