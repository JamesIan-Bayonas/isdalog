<?php // File: isdalog/tests/Feature/AccountTrustSupportTest.php

namespace Tests\Feature;

use App\Models\Listing;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class AccountTrustSupportTest extends TestCase
{
    use RefreshDatabase;

    public function test_requested_role_is_approved_with_a_reason_and_audit_and_cannot_be_replayed(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $applicant = User::factory()->create(['role' => 'buyer', 'status' => 'pending_review', 'requested_role' => 'fisherman', 'contact_number' => '09171234567', 'bfar_registration_number' => 'Self reported 123']);
        $url = '/admin/users/'.$applicant->id.'/approve-rider';
        $this->actingAs($applicant)->patch($url, ['reason' => 'Checked supplied details'])->assertForbidden();
        $this->actingAs($admin)->patch($url)->assertSessionHasErrors('reason');
        $this->patch($url, ['reason' => 'Reviewed supplied reference; access granted.'])->assertSessionHasNoErrors();
        $this->assertDatabaseHas('users', ['id' => $applicant->id, 'role' => 'fisherman', 'status' => 'verified', 'requested_role' => null]);
        $this->assertDatabaseHas('account_reviews', ['user_id' => $applicant->id, 'reviewer_id' => $admin->id, 'previous_role' => 'buyer', 'resulting_role' => 'fisherman']);
        $this->patch($url, ['reason' => 'Repeated review request'])->assertSessionHasErrors('account');
        $this->assertDatabaseCount('account_reviews', 1);
        $this->actingAs($applicant)->get('/profile')->assertInertia(fn (Assert $p) => $p->where('accountReviews.0.reason', 'Reviewed supplied reference; access granted.'));
        $other = User::factory()->create();
        $this->actingAs($other)->get('/profile')->assertInertia(fn (Assert $p) => $p->has('accountReviews', 0));
    }

    public function test_rejected_application_can_be_corrected_and_pending_application_cannot_be_overwritten(): void
    {
        $user = User::factory()->create(['role' => 'buyer', 'status' => 'unverified']);
        $admin = User::factory()->create(['role' => 'admin']);
        $data = ['requested_role' => 'rider', 'vehicle_details' => 'Motorcycle plate ABC 123'];
        $this->actingAs($user)->patch('/profile/upgrade', $data)->assertSessionHasErrors('requested_role');
        $this->patch('/profile', ['name' => $user->name, 'email' => $user->email, 'contact_number' => 'bad'])->assertSessionHasErrors('contact_number');
        $this->patch('/profile', ['name' => $user->name, 'email' => $user->email, 'contact_number' => '+639171234567'])->assertSessionHasNoErrors();
        $this->patch('/profile/upgrade', $data)->assertSessionHasNoErrors();
        $this->patch('/profile/upgrade', ['requested_role' => 'fisherman', 'bfar_registration_number' => 'Overwrite'])->assertForbidden();
        $this->actingAs($admin)->patch('/admin/users/'.$user->id.'/reject', ['reason' => 'Please provide a complete vehicle reference.'])->assertSessionHasNoErrors();
        $this->actingAs($user->fresh())->patch('/profile/upgrade', $data)->assertSessionHasNoErrors();
        $this->assertDatabaseHas('users', ['id' => $user->id, 'status' => 'pending_review', 'requested_role' => 'rider', 'role' => 'buyer']);
    }

    public function test_active_responsibilities_block_access_changes_and_account_deletion(): void
    {
        \Illuminate\Support\Facades\Event::fake();
        $seller = User::factory()->create(['role' => 'fisherman', 'status' => 'verified']);
        $buyer = User::factory()->create(['role' => 'buyer', 'wallet_balance' => 500]);
        $admin = User::factory()->create(['role' => 'admin']);
        $listing = Listing::factory()->create(['user_id' => $seller->id, 'status' => 'active', 'current_bid' => 100]);
        $this->actingAs($buyer)->post(route('orders.store', $listing), ['logistics_type' => 'self_pickup'])->assertSessionHasNoErrors();
        $this->actingAs($admin)->patch('/admin/users/'.$seller->id.'/toggle-verification', ['reason' => 'Trying to remove account access'])->assertSessionHasErrors('account');
        $this->patch('/admin/users/'.$seller->id.'/role', ['reason' => 'Trying to change account role', 'role' => 'buyer'])->assertSessionHasErrors('account');
        $this->actingAs($buyer)->delete('/profile', ['password' => 'password'])->assertSessionHasErrors('account');
        $this->assertDatabaseHas('users', ['id' => $seller->id, 'role' => 'fisherman', 'status' => 'verified']);
        $this->assertDatabaseCount('account_reviews', 0);
    }

    public function test_support_is_private_admin_only_response_is_durable_and_duplicate_safe(): void
    {
        $user = User::factory()->create(['role' => 'buyer']);
        $other = User::factory()->create(['role' => 'rider']);
        $admin = User::factory()->create(['role' => 'admin']);
        $this->actingAs($user)->post('/support', ['category' => 'account', 'subject' => 'Role review help', 'message' => 'Please help me correct my submitted vehicle details.'])->assertSessionHasNoErrors();
        $id = DB::table('support_requests')->value('id');
        $this->actingAs($other)->get('/support')->assertOk()->assertInertia(fn (Assert $p) => $p->has('requests.data', 0));
        $this->patch('/support/'.$id, ['response' => 'I cannot answer this'])->assertForbidden();
        $this->actingAs($admin)->get('/support')->assertOk()->assertInertia(fn (Assert $p) => $p->has('requests.data', 1)->where('requests.data.0.submitted_by', $user->email));
        $this->patch('/support/'.$id, ['response' => 'Update your vehicle details and submit again.'])->assertSessionHasNoErrors();
        $this->patch('/support/'.$id, ['response' => 'Replace previous response'])->assertSessionHasErrors('response');
        $this->assertDatabaseHas('support_requests', ['id' => $id, 'status' => 'answered', 'response' => 'Update your vehicle details and submit again.', 'reviewer_id' => $admin->id]);
        $this->actingAs($user)->get('/support')->assertOk()->assertInertia(fn (Assert $p) => $p->where('requests.data.0.response', 'Update your vehicle details and submit again.')->missing('requests.data.0.reviewer_id')->missing('requests.data.0.submitted_by'));
        $notice = DB::table('withdrawal_notifications')->where('user_id', $user->id)->where('subject_type', 'support')->value('id');
        $this->post('/notifications/'.$notice.'/open')->assertRedirect('/support');
        $this->actingAs($other)->post('/notifications/'.$notice.'/open')->assertNotFound();
    }
}
