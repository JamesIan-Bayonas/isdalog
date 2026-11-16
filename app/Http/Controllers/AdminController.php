<?php // File: isdalog/app/Http/Controllers/AdminController.php

namespace App\Http\Controllers;

use App\Models\User;
use App\Services\AccountResponsibilities;
use App\Services\TransactionNotifications;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class AdminController extends Controller
{
    public function manageUsers(Request $request)
    {
        abort_unless($request->user()->role === 'admin', 403);

        return Inertia::render('Admin/UserManagement', ['users' => User::select('id', 'name', 'email', 'role', 'status', 'contact_number', 'requested_role', 'bfar_registration_number', 'vehicle_details')->orderByDesc('id')->get()]);
    }

    public function approveRider(Request $request, int $id)
    {
        return $this->decide($request, $id, 'approve');
    }

    public function rejectUser(Request $request, int $id)
    {
        return $this->decide($request, $id, 'reject');
    }

    public function updateRole(Request $request, int $id)
    {
        return $this->decide($request, $id, 'role');
    }

    public function toggleVerification(Request $request, User $user)
    {
        return $this->decide($request, $user->id, 'verification');
    }

    private function decide(Request $request, int $id, string $action)
    {
        abort_unless($request->user()->role === 'admin', 403);
        $data = $request->validate(['reason' => ['required', 'string', 'min:10', 'max:1000'], 'role' => [$action === 'role' ? 'required' : 'nullable', 'in:buyer,fisherman,rider,admin']]);
        DB::transaction(function () use ($request, $id, $action, $data) {
            $user = User::whereKey($id)->lockForUpdate()->firstOrFail();
            if ($user->id === $request->user()->id) {
                throw ValidationException::withMessages(['account' => 'Another administrator must review your account.']);
            }
            AccountResponsibilities::assertNoActiveOrders($id);
            $previousRole = $user->role;
            $previousStatus = $user->status;
            if (in_array($action, ['approve', 'reject'], true)) {
                if ($user->status !== 'pending_review' || ! in_array($user->requested_role, ['fisherman', 'rider'], true)) {
                    throw ValidationException::withMessages(['account' => 'This account has no pending role application. Refresh the page.']);
                }
                if ($action === 'approve') {
                    $field = $user->requested_role === 'rider' ? 'vehicle_details' : 'bfar_registration_number';
                    if (! $user->contact_number || ! $user->$field) {
                        throw ValidationException::withMessages(['account' => 'Contact number and role details are required before approval.']);
                    }
                    $user->role = $user->requested_role;
                    $user->status = 'verified';
                    $user->requested_role = null;
                } else {
                    $user->status = 'unverified';
                }
            } elseif ($action === 'role') {
                $user->role = $data['role'];
                $user->status = 'unverified';
                $user->requested_role = null;
            } else {
                if ($user->status === 'pending_review') {
                    throw ValidationException::withMessages(['account' => 'Review the pending application first.']);
                }
                if ($user->status !== 'verified' && (! $user->contact_number || ($user->role === 'rider' && ! $user->vehicle_details) || ($user->role === 'fisherman' && ! $user->bfar_registration_number))) {
                    throw ValidationException::withMessages(['account' => 'Complete the contact and role details before approval.']);
                }
                $user->status = $user->status === 'verified' ? 'unverified' : 'verified';
            }
            $user->save();
            $review = DB::table('account_reviews')->insertGetId(['user_id' => $id, 'reviewer_id' => $request->user()->id, 'action' => $action, 'previous_role' => $previousRole, 'previous_status' => $previousStatus, 'resulting_role' => $user->role, 'resulting_status' => $user->status, 'reason' => $data['reason'], 'created_at' => now(), 'updated_at' => now()]);
            TransactionNotifications::record([$id], "account-review:$review", 'Account review updated', 'Read the decision and next steps in your profile.', 'account', $id);
        });

        return back()->with('success','Account decision saved with its reason.');
    }
}
