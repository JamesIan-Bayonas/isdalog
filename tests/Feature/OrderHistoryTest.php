<?php // File: isdalog/tests/Feature/OrderHistoryTest.php
namespace Tests\Feature;
use App\Models\User;
use App\Models\Listing;
use Illuminate\Support\Facades\DB;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;
class OrderHistoryTest extends TestCase {
    use RefreshDatabase;
    private function order(): array {
        $seller=User::factory()->create(['role'=>'fisherman']);$buyer=User::factory()->create(['role'=>'buyer']);$rider=User::factory()->create(['role'=>'rider','status'=>'verified']);
        $batch=Listing::factory()->create(['user_id'=>$seller->id]);
        $id=DB::table('orders_logistics')->insertGetId(['listing_id'=>$batch->id,'user_id'=>$buyer->id,'fisherman_id'=>$seller->id,'rider_id'=>$rider->id,'final_price'=>100,'escrow_balance'=>100,'status'=>'en_route','logistics_type'=>'request_rider','pickup_otp'=>'123456','delivery_otp'=>'654321','created_at'=>now(),'updated_at'=>now()]);
        return [$id,$seller,$buyer,$rider];
    }
    public function test_participants_can_view_but_outsiders_cannot_read_or_list_an_order():void {
        [$id,$seller,$buyer,$rider]=$this->order();
        foreach([$seller,$buyer,$rider] as $user) $this->actingAs($user)->get('/orders/'.$id)->assertOk();
        $this->actingAs(User::factory()->create())->get('/orders/'.$id)->assertNotFound();
        $this->get('/orders')->assertInertia(fn(Assert $p)=>$p->component('Orders/Index')->has('orders.data',0));
    }
    public function test_codes_are_scoped_by_role_and_stage():void {
        [$id,$seller,$buyer,$rider]=$this->order();
        $this->actingAs($rider)->get('/orders/'.$id)->assertInertia(fn(Assert $p)=>$p->where('handover.code',null)->missing('order.delivery_otp')->missing('order.pickup_otp')->where('canDeliver',true));
        $this->actingAs($buyer)->get('/orders/'.$id)->assertInertia(fn(Assert $p)=>$p->where('handover.code','654321')->where('canConfirm',false));
        DB::table('orders_logistics')->where('id',$id)->update(['status'=>'delivered']);
        $this->get('/orders/'.$id)->assertInertia(fn(Assert $p)=>$p->where('handover.code',null)->where('canConfirm',true)->where('order.delivered_at',null));
    }
    public function test_self_pickup_history_settlement_and_unknown_milestones():void {
        [$id,$seller,$buyer]=$this->order();
        DB::table('orders_logistics')->where('id',$id)->update(['rider_id'=>null,'logistics_type'=>'self_pickup','status'=>'pending_dispatch']);
        $this->actingAs($seller)->get('/orders/'.$id)->assertInertia(fn(Assert $p)=>$p->where('handover.code','123456'));
        $this->actingAs($buyer)->post('/orders/'.$id.'/confirm',['pickup_otp'=>'123456'])->assertSessionHasNoErrors();
        $this->get('/orders?status=completed')->assertInertia(fn(Assert $p)=>$p->has('orders.data',1));
        $this->get('/orders/'.$id)->assertInertia(fn(Assert $p)=>$p->where('settlement.fisherman_amount',97)->where('canConfirm',false)->where('handover.code',null));
        $this->assertNotNull(DB::table('orders_logistics')->where('id',$id)->value('completed_at'));
    }
}
