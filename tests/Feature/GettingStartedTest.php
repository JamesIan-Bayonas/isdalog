<?php // File: isdalog/tests/Feature/GettingStartedTest.php
namespace Tests\Feature;
use App\Models\User;
use App\Models\Listing;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;
class GettingStartedTest extends TestCase {
    use RefreshDatabase;
    public function test_new_fisherman_is_guided_to_web_capture_without_requiring_telegram():void {
        $user=User::factory()->create(['role'=>'fisherman','contact_number'=>null,'telegram_chat_id'=>null]);
        $this->actingAs($user)->get('/dashboard')->assertInertia(fn(Assert $p)=>$p->has('gettingStarted',3)->where('gettingStarted.0.complete',false)->where('gettingStarted.1.route','catches.create')->where('gettingStarted.1.complete',false));
        Listing::factory()->create(['user_id'=>$user->id]);
        $this->get('/dashboard')->assertInertia(fn(Assert $p)=>$p->where('gettingStarted.1.route','catches.index')->where('gettingStarted.1.complete',true));
    }
    public function test_role_guidance_targets_eligible_routes_and_actual_rider_verification():void {
        foreach(['buyer','rider','admin'] as $role){
            $user=User::factory()->create(['role'=>$role,'status'=>'unverified']);
            $items=\App\Services\GettingStarted::forUser($user);
            foreach($items as $item)$this->assertTrue(\Illuminate\Support\Facades\Route::has($item['route']));
            if($role==='rider'){
                $this->assertEquals('profile.edit',$items[1]['route']);$this->assertFalse($items[1]['complete']);
                $user->update(['status'=>'verified']);$this->assertEquals('dispatch.index',\App\Services\GettingStarted::forUser($user)[1]['route']);
            }
            if($role==='buyer')$this->assertEquals('marketplace.index',$items[1]['route']);
        }
    }
    public function test_guidance_is_dashboard_only_and_guest_gets_no_private_state():void {
        $this->get('/dashboard')->assertRedirect('/login');
        $this->actingAs(User::factory()->create(['role'=>'buyer']))->get('/marketplace')->assertInertia(fn(Assert $p)=>$p->where('gettingStarted',null));
    }
}
