<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AdminController extends Controller
{
    /**
     * Render the User Management Dashboard.
     */
    public function manageUsers(Request $request)
    {
        // Guardrail: Strictly limit access to administrators
        if ($request->user()->role !== 'admin') {
            abort(403, 'Unauthorized action. Admin access required.');
        }

        // Fetch all users along with their compliance documentation states
        $users = User::select('id', 'name', 'email', 'role', 'status', 'contact_number', 'license_number', 'vehicle_plate', 'created_at')
                     ->orderBy('created_at', 'desc')
                     ->get();

        return Inertia::render('Admin/UserManagement', [
            'users' => $users
        ]);
    }

    /**
     * Officially Approve a Pending Rider Verification Request
     */
    public function approveRider(Request $request, $id)
    {
        if ($request->user()->role !== 'admin') {
            abort(403, 'Unauthorized action.');
        }

        $user = User::findOrFail($id);
        
        // Mutate the account parameters to full operational authorization status
        $user->update([
            'role' => 'rider',
            'status' => 'verified'
        ]);

        return redirect()->back()->with([
            'success' => "Rider status for {$user->name} has been verified. Logistics clearance granted."
        ]);
    }

    /**
     * Reject/Suspend a User Account or Compliance Request
     */
    public function rejectUser(Request $request, $id)
    {
        if ($request->user()->role !== 'admin') {
            abort(403, 'Unauthorized action.');
        }

        $user = User::findOrFail($id);
        
        // Mark account back to unverified or suspended state gate lock
        $user->update([
            'status' => 'unverified'
        ]);

        return redirect()->back()->with([
            'error' => "Application request for {$user->name} has been rejected/reset."
        ]);
    }

    /**
     * Keep your original generic fallback update role function if needed
     */
    public function updateRole(Request $request, $id)
    {
        if ($request->user()->role !== 'admin') {
            abort(403, 'Unauthorized action.');
        }

        $validated = $request->validate([
            'role' => 'required|in:fisherman,buyer,rider,admin'
        ]);

        $user = User::findOrFail($id);
        $user->role = $validated['role'];
        $user->save();

        return redirect()->back()->with([
            'success' => "{$user->name} role updated to {$user->role}."
        ]);
    }
}