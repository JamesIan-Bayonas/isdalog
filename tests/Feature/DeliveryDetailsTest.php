<?php // File: isdalog/tests/Feature/DeliveryDetailsTest.php
namespace Tests\Feature;
use App\Models\User;
use App\Models\Listing;
use Illuminate\Support\Facades\DB;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;
class DeliveryDetailsTest extends TestCase {
    use RefreshDatabase;
    private function order():array {
        \Illuminate\Support\Facades\Event::fake();$seller=User::factory()->create(['role'=>'fisherman']);$buyer=User::factory()->create(['role'=>'buyer','wallet_balance'=>500]);$rider=User::factory()->create(['role'=>'rider','status'=>'verified']);
        $batch=Listing::factory()->create(['user_id'=>$seller->id,'status'=>'active','current_bid'=>100]);
        $this->actingAs($buyer)->post(route('orders.store',$batch),['logistics_type'=>'request_rider'])->assertSessionHasNoErrors();
        return [DB::table('orders_logistics')->where('listing_id',$batch->id)->first(),$buyer,$rider];
    }
    private function data():array{return ['destination_area'=>'Dipolog','delivery_address'=>'Test street, sample landmark','recipient_name'=>'Test recipient','recipient_phone'=>'09171234567','delivery_instructions'=>'Meet at gate'];}
    public function test_new_courier_orders_require_details_before_claim_and_cannot_edit_after_claim():void {
        [$order,$buyer,$rider]=$this->order();
        $this->actingAs($rider)->get('/dispatch')->assertInertia(fn(Assert $p)=>$p->has('availableJobs',0));
        $this->post('/dispatch/orders/'.$order->id.'/claim',['pickup_otp'=>$order->pickup_otp])->assertSessionHasErrors('error');
        $this->actingAs($buyer)->patch('/orders/'.$order->id.'/delivery-details',$this->data())->assertSessionHasNoErrors();
        $this->actingAs($rider)->get('/dispatch')->assertInertia(fn(Assert $p)=>$p->has('availableJobs',1)->missing('availableJobs.0.delivery_address')->missing('availableJobs.0.recipient_phone'));
        $this->post('/dispatch/orders/'.$order->id.'/claim',['pickup_otp'=>$order->pickup_otp])->assertSessionHasNoErrors();
        $this->get('/dispatch')->assertInertia(fn(Assert $p)=>$p->where('activeRuns.0.delivery_address','Test street, sample landmark')->where('activeRuns.0.recipient_phone','09171234567'));
        $this->actingAs($buyer)->patch('/orders/'.$order->id.'/delivery-details',$this->data())->assertSessionHasErrors('delivery');
        $this->assertDatabaseHas('orders_logistics',['id'=>$order->id,'delivery_fee'=>0,'escrow_balance'=>100]);
    }
    public function test_details_are_validated_and_cannot_be_read_or_changed_by_others():void {
        [$order,$buyer,$rider]=$this->order();
        $bad=$this->data();$bad['recipient_phone']='123';
        $this->patch('/orders/'.$order->id.'/delivery-details',$bad)->assertSessionHasErrors('recipient_phone');
        $this->actingAs($rider)->patch('/orders/'.$order->id.'/delivery-details',$this->data())->assertForbidden();
        $this->get('/orders/'.$order->id)->assertNotFound();
        $this->assertNull(DB::table('orders_logistics')->where('id',$order->id)->value('delivery_details_saved_at'));
    }
}
