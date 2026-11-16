<?php // File: isdalog/tests/Feature/CatchDetailTest.php
namespace Tests\Feature;
use App\Models\Listing;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;
class CatchDetailTest extends TestCase
{
    use RefreshDatabase;
    public function test_details_keep_legacy_provenance_unknown_and_hide_private_owner_fields(): void
    {
        $listing = Listing::factory()->create(['status'=>'completed']);
        $this->get('/catch-listings/'.$listing->id)->assertRedirect('/login');
        $this->actingAs(User::factory()->create())->get('/catch-listings/'.$listing->id)->assertInertia(fn(Assert $p)=>$p->component('Catches/Show')->where('provenance',null)->where('listing.available',false)->missing('listing.seller.email')->missing('listing.pickup_otp'));
    }
    public function test_new_capture_links_the_exact_record_and_preserves_original_values(): void
    {
        \Illuminate\Support\Facades\Http::fake();
        $owner=User::factory()->create(['role'=>'fisherman']);
        $response=$this->actingAs($owner)->postJson('/catches',['submission_id'=>(string)\Illuminate\Support\Str::uuid(),'species'=>'Bangus','weight'=>5,'price_per_kg'=>100])->assertCreated();
        $listing=Listing::findOrFail($response->json('data.listing_id'));
        $this->assertEquals($response->json('data.catch_id'),$listing->catch_id);
        $listing->update(['fish_name'=>'Edited label']);
        $this->get('/catch-listings/'.$listing->id)->assertInertia(fn(Assert $p)=>$p->where('listing.fish_name','Edited label')->where('provenance.species','Bangus')->where('provenance.record_id',$listing->catch_id));
    }
}
