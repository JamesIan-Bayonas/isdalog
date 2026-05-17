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

        // Fetch all users to display in the data table
        $users = User::select('id', 'name', 'email', 'role', 'contact_number', 'created_at')
                     ->orderBy('created_at', 'desc')
                     ->get();

        return Inertia::render('Admin/UserManagement', [
            'users' => $users
        ]);
    }

    /**
     * Securely update a user's role.
     */
    public function updateRole(Request $request, $id)
    {
        if ($request->user()->role !== 'admin') {
            abort(403, 'Unauthorized action.');
        }

        // Validate strictly against your database Enums
        $validated = $request->validate([
            'role' => 'required|in:fisherman,buyer,rider,admin'
        ]);

        $user = User::findOrFail($id);
        $user->role = $validated['role'];
        $user->save();

        return redirect()->back()->with([
            'success' => "{$user->name} has been successfully promoted to {$user->role}."
        ]);
    }
}