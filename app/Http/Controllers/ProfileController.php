<?php

namespace App\Http\Controllers;

use App\Http\Requests\ProfileUpdateRequest;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Redirect;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{
    /**
     * Display the user's profile form.
     */
    public function edit(Request $request): Response
    {
        return Inertia::render('Profile/Edit', [
            'mustVerifyEmail' => $request->user() instanceof MustVerifyEmail,
            'status' => session('status'),
        ]);
    }

    /**
     * Update the user's profile information.
     */
    public function update(ProfileUpdateRequest $request): RedirectResponse
    {
        $request->user()->fill($request->validated());

        if ($request->user()->isDirty('email')) {
            $request->user()->email_verified_at = null;
        }

        $request->user()->save();

        return Redirect::route('profile.edit')->with('success', 'Profile updated successfully.');
    }

    /**
     * Process an operator upgrade compliance request.
     */
    public function upgradeRole(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'requested_role' => ['required', 'string', 'in:fisherman,rider'],
            'bfar_registration_number' => ['nullable', 'string', 'max:255', 'required_if:requested_role,fisherman'],
            'vehicle_details' => ['nullable', 'string', 'max:255', 'required_if:requested_role,rider'],
        ]);

        $request->user()->update([
            'requested_role' => $validated['requested_role'],
            'bfar_registration_number' => $validated['bfar_registration_number'] ?? null,
            'vehicle_details' => $validated['vehicle_details'] ?? null,
            'status' => 'pending_review',
        ]);

        return Redirect::route('profile.edit')->with('success', 'Compliance documents submitted. Account is pending BFAR administrative review.');
    }

    /**
     * Delete the user's account.
     */
    public function destroy(Request $request): RedirectResponse
    {
        $request->validate([
            'password' => ['required', 'current_password'],
        ]);

        $user = $request->user();

        Auth::logout();

        $user->delete();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return Redirect::to('/');
    }
}