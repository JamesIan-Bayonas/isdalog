<?php // File: isdalog/app/Http/Controllers/OrderResolutionController.php
namespace App\Http\Controllers;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use App\Services\AccountLedger;
use App\Services\TransactionNotifications;
use Inertia\Inertia;
class OrderResolutionController extends Controller {
    private function locked(int $id){return DB::table('orders_logistics')->where('id',$id)->lockForUpdate()->firstOrFail();}
    private function participant(Request $r,$order):void {abort_unless(in_array((int)$r->user()->id,[(int)$order->user_id,(int)$order->fisherman_id,(int)$order->rider_id],true),403);}
    private function refund($order,int $actor,string $kind,string $reason):void {
        $held=AccountLedger::cents($order->escrow_balance);$required=AccountLedger::cents($order->final_price)+AccountLedger::cents($order->delivery_fee);
        if(AccountLedger::cents($order->final_price)<=0||AccountLedger::cents($order->delivery_fee)<0||$held<=0||$held!==$required||DB::table('order_settlements')->where('order_id',$order->id)->exists()||DB::table('order_refunds')->where('order_id',$order->id)->exists())throw ValidationException::withMessages(['resolution'=>'Refund blocked: reserved funds do not match an unsettled order.']);
        $entry=AccountLedger::move($order->user_id,$held,'order_refund',$order->id);
        DB::table('order_refunds')->insert(['order_id'=>$order->id,'buyer_id'=>$order->user_id,'actor_id'=>$actor,'transaction_id'=>$entry->id,'amount'=>AccountLedger::decimal($held),'kind'=>$kind,'reason'=>$reason,'created_at'=>now(),'updated_at'=>now()]);
        DB::table('orders_logistics')->where('id',$order->id)->update(['status'=>$kind==='cancellation'?'cancelled':'refunded','escrow_balance'=>0,'updated_at'=>now()]);
        TransactionNotifications::order($order->id,'refunded','Reserved funds returned','Order #'.$order->id.' was closed and its reserved balance returned to the buyer’s internal wallet. No external payment reversal is claimed.');
    }
    public function cancel(Request $r,int $order){
        $data=$r->validate(['reason'=>['required','string','max:1000','regex:/\S/u']]);
        return DB::transaction(function()use($r,$order,$data){$row=$this->locked($order);
            abort_unless(in_array((int)$r->user()->id,[(int)$row->user_id,(int)$row->fisherman_id],true),403);
            if($row->status!=='pending_dispatch'||$row->rider_id||$row->picked_up_at)throw ValidationException::withMessages(['resolution'=>'Cancellation is available only before pickup and courier assignment.']);
            $this->refund($row,$r->user()->id,'cancellation',trim($data['reason']));return back()->with('success','Order cancelled. Reserved funds returned to the buyer wallet.');
        },3);
    }
    public function report(Request $r,int $order){
        $data=$r->validate(['category'=>['required','in:quality,weight,delay,missing,other'],'description'=>['required','string','max:2000','regex:/\S/u'],'evidence'=>['nullable','string','max:2000']]);
        return DB::transaction(function()use($r,$order,$data){$row=$this->locked($order);$this->participant($r,$row);
            if(!in_array($row->status,['en_route','delivered','completed'],true)||DB::table('order_issues')->where('order_id',$order)->exists())throw ValidationException::withMessages(['resolution'=>'This order is not eligible for a new issue, or already has a case.']);
            $id=DB::table('order_issues')->insertGetId(['order_id'=>$order,'reported_by'=>$r->user()->id,...$data,'status'=>'open','created_at'=>now(),'updated_at'=>now()]);
            TransactionNotifications::order($order,'issue','Order issue opened','Order #'.$order.' has an issue for review. Any unreleased settlement is paused.');
            TransactionNotifications::record(\App\Models\User::where('role','admin')->pluck('id')->all(),'issue:'.$id,'Order issue awaiting review','Review the reported issue for order #'.$order.'.','order',$order);
            return back()->with('success','Issue recorded for administrator review.');
        },3);
    }
    public function index(Request $r){abort_unless($r->user()->role==='admin',403);return Inertia::render('Admin/OrderIssues',['issues'=>DB::table('order_issues')->orderByRaw("CASE WHEN status = 'open' THEN 0 ELSE 1 END")->orderByDesc('id')->paginate(20)]);}
    public function review(Request $r,int $order){
        abort_unless($r->user()->role==='admin',403);$data=$r->validate(['decision'=>['required','in:dismiss,refund'],'note'=>['required','string','max:1000','regex:/\S/u']]);
        return DB::transaction(function()use($r,$order,$data){$row=$this->locked($order);$issue=DB::table('order_issues')->where('order_id',$order)->lockForUpdate()->firstOrFail();
            if($issue->status!=='open')throw ValidationException::withMessages(['resolution'=>'This case has already been reviewed.']);
            if($data['decision']==='refund'){
                if(!in_array($row->status,['en_route','delivered'],true))throw ValidationException::withMessages(['resolution'=>'A completed payout cannot be reversed here.']);
                $this->refund($row,$r->user()->id,'reviewed_refund',trim($data['note']));
            }
            DB::table('order_issues')->where('id',$issue->id)->update(['status'=>$data['decision']==='refund'?'refunded':'dismissed','reviewed_by'=>$r->user()->id,'review_note'=>trim($data['note']),'reviewed_at'=>now(),'updated_at'=>now()]);
            TransactionNotifications::order($order,'issue_reviewed','Order issue reviewed','Order #'.$order.' has a recorded review decision. Open the case to read the outcome.');return back()->with('success','Review recorded.');
        },3);
    }
}
