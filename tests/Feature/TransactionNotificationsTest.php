<?php // File: isdalog/tests/Feature/TransactionNotificationsTest.php
namespace Tests\Feature;
use App\Models\User;
use App\Models\Listing;
use App\Models\WithdrawalNotification;
use App\Services\TransactionNotifications;
use Illuminate\Support\Facades\DB;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
class TransactionNotificationsTest extends TestCase {
    use RefreshDatabase;
    public function test_offer_and_outbid_notices_are_private_and_link_to_listing():void {
        \Illuminate\Support\Facades\Event::fake();
        $seller=User::factory()->create(['role'=>'fisherman']);$first=User::factory()->create(['role'=>'buyer']);$second=User::factory()->create(['role'=>'buyer']);
        $batch=Listing::factory()->create(['user_id'=>$seller->id,'status'=>'active','current_bid'=>100]);
        $this->actingAs($first)->post(route('bids.store',$batch),['bid_amount'=>110])->assertSessionHasNoErrors();
        $this->actingAs($second)->post(route('bids.store',$batch),['bid_amount'=>120])->assertSessionHasNoErrors();
        $this->assertEquals(2,WithdrawalNotification::where('user_id',$seller->id)->count());
        $notice=WithdrawalNotification::where('user_id',$first->id)->firstOrFail();
        $this->post('/notifications/'.$notice->id.'/open')->assertNotFound();
        $this->actingAs($first)->post('/notifications/'.$notice->id.'/open')->assertRedirect(route('catches.show',$batch));
        $this->assertNotNull($notice->fresh()->read_at);
    }
    public function test_retry_deduplication_and_rollback_leave_consistent_read_state():void {
        $user=User::factory()->create();$batch=Listing::factory()->create();
        DB::transaction(function()use($user,$batch){for($i=0;$i<2;$i++)TransactionNotifications::record([$user->id],'same-event','Notice','Persisted update','listing',$batch->id);});
        $this->assertDatabaseCount('withdrawal_notifications',1);
        try{DB::transaction(function()use($user,$batch){TransactionNotifications::record([$user->id],'aborted','Notice','Not committed','listing',$batch->id);throw new \RuntimeException('Synthetic rollback');});}catch(\RuntimeException $e){}
        $this->assertDatabaseCount('withdrawal_notifications',1);
        $this->actingAs($user)->patch('/notifications/read-all')->assertRedirect();
        $this->assertEquals(0,WithdrawalNotification::whereNull('read_at')->count());
    }
    public function test_order_and_settlement_notices_follow_committed_participants_without_replay_duplicates():void {
        \Illuminate\Support\Facades\Event::fake();
        $seller=User::factory()->create(['role'=>'fisherman']);$buyer=User::factory()->create(['role'=>'buyer','wallet_balance'=>500]);
        $batch=Listing::factory()->create(['user_id'=>$seller->id,'status'=>'active','current_bid'=>100]);
        $this->actingAs($buyer)->post(route('orders.store',$batch),['logistics_type'=>'self_pickup'])->assertSessionHasNoErrors();
        $order=DB::table('orders_logistics')->where('listing_id',$batch->id)->first();
        $notice=WithdrawalNotification::where('user_id',$buyer->id)->where('subject_type','order')->firstOrFail();
        $this->post('/notifications/'.$notice->id.'/open')->assertRedirect(route('orders.show',$order->id));
        $this->post(route('orders.confirm',$order->id),['pickup_otp'=>$order->pickup_otp])->assertSessionHasNoErrors();
        $this->post(route('orders.confirm',$order->id),['pickup_otp'=>$order->pickup_otp])->assertSessionHasErrors('error');
        $this->assertEquals(2,WithdrawalNotification::where('user_id',$buyer->id)->count());
        $this->assertEquals(2,WithdrawalNotification::where('user_id',$seller->id)->count());
    }
}
