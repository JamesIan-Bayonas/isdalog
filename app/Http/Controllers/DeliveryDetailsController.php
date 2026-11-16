<?php // File: isdalog/app/Http/Controllers/DeliveryDetailsController.php
namespace App\Http\Controllers;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
class DeliveryDetailsController extends Controller {
    public function update(Request $r,int $order){
        $data=$r->validate(['destination_area'=>['required','string','max:100','regex:/\S/u'],'delivery_address'=>['required','string','max:500','regex:/\S/u'],'recipient_name'=>['required','string','max:100','regex:/\S/u'],'recipient_phone'=>['required','string','regex:/^(?:09\d{9}|\+?639\d{9})$/D'],'delivery_instructions'=>['nullable','string','max:1000']]);
        return DB::transaction(function()use($r,$order,$data){
            $row=DB::table('orders_logistics')->where('id',$order)->lockForUpdate()->firstOrFail();
            abort_unless($r->user()->role==='buyer'&&(int)$row->user_id===(int)$r->user()->id,403);
            if($row->logistics_type!=='request_rider'||$row->status!=='pending_dispatch'||$row->rider_id||$row->picked_up_at)throw ValidationException::withMessages(['delivery'=>'Delivery details can be changed only before courier assignment and pickup.']);
            foreach($data as $key=>$value)$data[$key]=is_string($value)?trim($value):$value;
            DB::table('orders_logistics')->where('id',$order)->update([...$data,'delivery_details_saved_at'=>now(),'updated_at'=>now()]);
            \App\Services\TransactionNotifications::order($order,'delivery_details_saved','Delivery details available','Buyer delivery details are saved for order #'.$order.'. Assigned participants can review them.');
            return back()->with('success','Delivery details saved. Recorded delivery charge remains unchanged.');
        },3);
    }
}
