<?php // File: isdalog/tests/Feature/OrderResolutionTest.php
namespace Tests\Feature;
use App\Models\User;
use App\Models\Listing;
use Illuminate\Support\Facades\DB;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
class OrderResolutionTest extends TestCase {
    use RefreshDatabase;
    private function order(string $state='pending_dispatch'):array {
        \Illuminate\Support\Facades\Event::fake();$seller=User::factory()->create(['role'=>'fisherman']);$buyer=User::factory()->create(['role'=>'buyer','wallet_balance'=>500]);$admin=User::factory()->create(['role'=>'admin']);
        $batch=Listing::factory()->create(['user_id'=>$seller->id,'status'=>'active','current_bid'=>100]);
        $this->actingAs($buyer)->post(route('orders.store',$batch),['logistics_type'=>'self_pickup'])->assertSessionHasNoErrors();
        $id=DB::table('orders_logistics')->where('listing_id',$batch->id)->value('id');
        DB::table('orders_logistics')->where('id',$id)->update(['status'=>$state]);return [$id,$seller,$buyer,$admin];
    }
    public function test_pre_pickup_cancellation_returns_money_once_and_blocks_handover():void {
        [$id,,$buyer]=$this->order();
        $this->post('/orders/'.$id.'/cancel',['reason'=>'Plans changed'])->assertSessionHasNoErrors();
        $this->post('/orders/'.$id.'/cancel',['reason'=>'Retry'])->assertSessionHasErrors('resolution');
        $this->assertEquals(500,$buyer->fresh()->wallet_balance);$this->assertDatabaseCount('order_refunds',1);
        $this->post('/orders/'.$id.'/confirm')->assertSessionHasErrors('error');
        $this->assertDatabaseHas('orders_logistics',['id'=>$id,'status'=>'cancelled','escrow_balance'=>0]);
    }
    public function test_late_cancellation_and_foreign_actions_are_denied():void {
        [$id]=$this->order('en_route');$this->post('/orders/'.$id.'/cancel',['reason'=>'Late'])->assertSessionHasErrors('resolution');
        $this->actingAs(User::factory()->create())->post('/orders/'.$id.'/issues',['category'=>'quality','description'=>'Problem'])->assertForbidden();
        $this->get('/admin/order-issues')->assertForbidden();$this->assertDatabaseCount('order_refunds',0);
    }
    public function test_issue_pauses_settlement_and_admin_refund_is_final():void {
        [$id,,$buyer,$admin]=$this->order('delivered');
        $this->post('/orders/'.$id.'/issues',['category'=>'weight','description'=>'Weight does not match'])->assertSessionHasNoErrors();
        $this->post('/orders/'.$id.'/issues',['category'=>'weight','description'=>'Duplicate'])->assertSessionHasErrors('resolution');
        $this->post('/orders/'.$id.'/confirm')->assertSessionHasErrors('error');
        $this->post('/orders/'.$id.'/review',['decision'=>'refund','note'=>'Unauthorized'])->assertForbidden();
        $this->actingAs($admin)->post('/orders/'.$id.'/review',['decision'=>'refund','note'=>'Reviewed evidence; full return'])->assertSessionHasNoErrors();
        $this->post('/orders/'.$id.'/review',['decision'=>'refund','note'=>'Retry'])->assertSessionHasErrors('resolution');
        $this->assertEquals(500,$buyer->fresh()->wallet_balance);$this->assertDatabaseCount('order_refunds',1);$this->assertDatabaseHas('order_issues',['order_id'=>$id,'status'=>'refunded','reviewed_by'=>$admin->id]);
    }
    public function test_dismissal_resumes_eligible_settlement():void {
        [$id,,$buyer,$admin]=$this->order('delivered');
        $this->post('/orders/'.$id.'/issues',['category'=>'other','description'=>'Please check'])->assertSessionHasNoErrors();
        $this->actingAs($admin)->post('/orders/'.$id.'/review',['decision'=>'dismiss','note'=>'Resolved without refund'])->assertSessionHasNoErrors();
        $this->actingAs($buyer)->post('/orders/'.$id.'/confirm')->assertSessionHasNoErrors();$this->assertDatabaseCount('order_settlements',1);$this->assertDatabaseCount('order_refunds',0);
    }
    public function test_refund_ledger_failure_rolls_back_cancellation():void {
        [$id,,$buyer]=$this->order();
        DB::statement("CREATE TRIGGER reject_refund BEFORE INSERT ON order_refunds BEGIN SELECT RAISE(ABORT, 'Synthetic audit failure'); END");
        $this->post('/orders/'.$id.'/cancel',['reason'=>'Cancel'])->assertStatus(500);
        $this->assertEquals(400,$buyer->fresh()->wallet_balance);$this->assertDatabaseHas('orders_logistics',['id'=>$id,'status'=>'pending_dispatch','escrow_balance'=>100]);$this->assertDatabaseCount('order_refunds',0);
    }
    public function test_completed_payout_cannot_be_reversed_by_an_issue_review():void {
        [$id,,$buyer,$admin]=$this->order('delivered');
        $this->post('/orders/'.$id.'/confirm')->assertSessionHasNoErrors();
        $this->post('/orders/'.$id.'/issues',['category'=>'quality','description'=>'Reported after receipt'])->assertSessionHasNoErrors();
        $this->actingAs($admin)->post('/orders/'.$id.'/review',['decision'=>'refund','note'=>'Attempt paid reversal'])->assertSessionHasErrors('resolution');
        $this->assertEquals(400,$buyer->fresh()->wallet_balance);$this->assertDatabaseCount('order_refunds',0);$this->assertDatabaseCount('order_settlements',1);
    }
    public function test_cancelled_cargo_cannot_be_claimed_and_claimed_cargo_cannot_be_cancelled():void {
        [$id,,$buyer]=$this->order();
        DB::table('orders_logistics')->where('id',$id)->update(['logistics_type'=>'request_rider']);
        $code=DB::table('orders_logistics')->where('id',$id)->value('pickup_otp');
        $this->post('/orders/'.$id.'/cancel',['reason'=>'Before pickup'])->assertSessionHasNoErrors();
        $rider=User::factory()->create(['role'=>'rider','status'=>'verified']);
        $this->actingAs($rider)->post('/dispatch/orders/'.$id.'/claim',['pickup_otp'=>$code])->assertSessionHasErrors('error');
        [$second,,$buyer]=$this->order();
        DB::table('orders_logistics')->where('id',$second)->update(['logistics_type'=>'request_rider']);
        $code=DB::table('orders_logistics')->where('id',$second)->value('pickup_otp');
        $this->actingAs($rider)->post('/dispatch/orders/'.$second.'/claim',['pickup_otp'=>$code])->assertSessionHasNoErrors();
        $this->actingAs($buyer)->post('/orders/'.$second.'/cancel',['reason'=>'Too late'])->assertSessionHasErrors('resolution');
    }
}
