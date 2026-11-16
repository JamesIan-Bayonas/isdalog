<?php // File: isdalog/app/Services/TransactionNotifications.php
namespace App\Services;
use App\Models\WithdrawalNotification;
use Illuminate\Support\Facades\DB;
class TransactionNotifications {
    public static function record(array $recipients,string $key,string $title,string $message,string $type,int $id):void {
        if(DB::transactionLevel()<1)throw new \LogicException('Notification must share its domain transaction.');
        if(!in_array($type,['order','listing','withdrawal_review','account','support'],true))throw new \InvalidArgumentException('Unsupported notification destination.');
        foreach(array_unique(array_filter($recipients)) as $recipient) WithdrawalNotification::firstOrCreate(['user_id'=>$recipient,'event_key'=>$key],
            ['withdrawal_request_id'=>null,'kind'=>'transaction','title'=>$title,'message'=>$message,'subject_type'=>$type,'subject_id'=>$id]);
    }
    public static function order(int $id,string $kind,string $title,string $message):void {
        $order=DB::table('orders_logistics')->where('id',$id)->first();
        self::record([$order->user_id,$order->fisherman_id,$order->rider_id],"order:$id:$kind",$title,$message,'order',$id);
    }
}
