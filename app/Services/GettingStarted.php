<?php // File: isdalog/app/Services/GettingStarted.php
namespace App\Services;
use App\Models\User;
use Illuminate\Support\Facades\DB;
class GettingStarted
{
    public static function forUser(User $user): array
    {
        $item = fn($title,$detail,$route,$label,$complete=false)=>compact('title','detail','route','label','complete');
        $profile=$item('Your contact details', $user->contact_number ? 'A contact number is saved. Keep it current for handovers.' : 'Add a contact number so participants can coordinate handovers.', 'profile.edit','Review profile',(bool)$user->contact_number);
        if($user->role==='fisherman') {
            $has=DB::table('listings')->where('user_id',$user->id)->exists();
            return [$profile,$item('Publish a catch',$has?'You have catch listings. Review their current offers and availability.':'Start with the fish name, batch weight, asking price and port. A photo is optional.',$has?'catches.index':'catches.create',$has?'My catches':'Sell your catch',$has),
                $item('Follow sales & pickups','Review each sale’s actual handover step and payment record. Telegram linking is optional; website capture works independently.','orders.index','Orders & history')];
        }
        if($user->role==='buyer') {
            $has=DB::table('orders_logistics')->where('user_id',$user->id)->where('status','!=','completed')->exists();
            return [$profile,$item('Find a suitable batch','Compare species, landing port, weight and price per kilogram. An offer is not a completed purchase.','marketplace.index','Browse catches'),
                $item($has?'Your order needs follow-up':'Understand the next handover',$has?'You have orders in progress. Check the next step before confirming receipt.':'After buying, review codes and fulfillment in Orders & history. Wallet credits are not proof of external payment.','orders.index','View orders')];
        }
        if($user->role==='rider') {
            $verified=$user->status==='verified';
            return [$profile,$item('Rider account access',$verified?'Your account is enabled for claiming courier jobs; this does not certify licensing or identity.':'Your rider access has not been approved. Review your profile; claiming jobs remains unavailable.',$verified?'dispatch.index':'profile.edit',$verified?'Find courier jobs':'Review account',$verified),
                $item('Complete assigned work','Get pickup/delivery codes from the correct participant at physical handover. Your assigned orders and history are private to authorized participants.','orders.index','Assigned orders')];
        }
        if($user->role==='admin') {
            $pending=DB::table('withdrawal_requests')->where('status','pending')->exists();
            return [$item('Review users','Check actual account requests and verification records; access does not imply official agency affiliation.','admin.users','User management'),
                $item('Withdrawal review',$pending?'Withdrawal requests are awaiting review. Approval is not payout completion.':'No withdrawal requests currently await review. Approved requests still require a separate payout outcome.','admin.withdrawals.index','Review withdrawals'),
                $item('Operational records','Inspect recorded orders and settlement evidence. Simulator outcomes are not real provider payments.','orders.index','Orders & history')];
        }
        return [$profile];
    }
}
