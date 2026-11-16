<?php // File: isdalog/app/Http/Controllers/CatchManagementController.php

namespace App\Http\Controllers;

use App\Events\ListingAvailabilityUpdated;
use App\Models\Listing;
use App\Models\ListingActivity;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class CatchManagementController extends Controller
{
    public function index(Request $request)
    {
        abort_unless($request->user()->role === 'fisherman', 403);
        $filters = $request->validate(['listing' => ['nullable', 'integer', 'min:1']]);
        return Inertia::render('Catches/Manage', [
            'listings' => Listing::where('user_id', $request->user()->id)
                ->when($filters['listing'] ?? null, fn ($query, $id) => $query->whereKey($id))
                ->withCount(['bids', 'activities'])->withExists('orders')
                ->with(['activities' => fn ($query) => $query->latest('id')->limit(5)])
                ->latest('id')->paginate(12)->withQueryString(),
            'selectedListing' => $filters['listing'] ?? null,
            'flash' => ['success' => $request->session()->get('success')],
        ]);
    }

    public function update(Request $request, Listing $listing)
    {
        $this->authorizeOwner($request, $listing);
        $validated = $request->validate([
            'management_version' => ['required', 'integer', 'min:0'],
            'fish_name' => ['required', 'string', 'max:255', 'regex:/\S/u'],
            'weight_kg' => ['required', 'numeric', 'min:0.1', 'max:999999.99', 'decimal:0,2'],
            'starting_price' => ['required', 'numeric', 'min:1', 'max:99999999.99', 'decimal:0,2'],
            'location' => ['required', 'string', 'max:255', 'regex:/\S/u'],
        ]);
        return DB::transaction(function () use ($request, $listing, $validated) {
            $record = $this->lockEditable($listing, $validated['management_version']);
            $before = $this->snapshot($record);
            $after = [
                'fish_name' => trim($validated['fish_name']), 'weight_kg' => number_format((float) $validated['weight_kg'], 2, '.', ''),
                'starting_price' => number_format((float) $validated['starting_price'], 2, '.', ''), 'location' => trim($validated['location']),
            ];
            if ($before === $after) return back()->with('success', 'No catch listing changes were needed.');
            $record->fill($after);
            $record->current_bid = $after['starting_price'];
            $record->management_version++;
            $record->save();
            $this->audit($request, $record, 'edited', $before, $after);
            return back()->with('success', 'Catch listing updated. The original catch record is unchanged.');
        });
    }

    public function withdraw(Request $request, Listing $listing)
    {
        $this->authorizeOwner($request, $listing);
        $validated = $request->validate([
            'management_version' => ['required', 'integer', 'min:0'],
            'reason' => ['required', 'string', 'max:500', 'regex:/\S/u'],
        ]);
        return DB::transaction(function () use ($request, $listing, $validated) {
            $record = $this->lockEditable($listing, $validated['management_version']);
            $record->withdrawn_at = now();
            $record->withdrawn_reason = trim($validated['reason']);
            $record->management_version++;
            $record->save();
            $this->audit($request, $record, 'withdrawn', ['availability' => 'available'], ['availability' => 'withdrawn'], $record->withdrawn_reason);
            return back()->with('success', 'Catch withdrawn from the marketplace. Its history has been retained.');
        });
    }

    private function authorizeOwner(Request $request, Listing $listing): void
    {
        abort_unless($request->user()->role === 'fisherman' && (int) $listing->user_id === (int) $request->user()->id, 403);
    }

    private function lockEditable(Listing $listing, int $version): Listing
    {
        $record = Listing::whereKey($listing->id)->lockForUpdate()->firstOrFail();
        if (! $record->isOpenForTrading() || $record->bids()->exists() || $record->orders()->exists()) {
            throw ValidationException::withMessages(['listing' => 'This catch cannot be changed: it has bids, an order, or is no longer available.']);
        }
        if ((int) $record->management_version !== $version) {
            throw ValidationException::withMessages(['listing' => 'This listing changed since you opened it. Refresh before editing.']);
        }
        return $record;
    }

    private function snapshot(Listing $record): array
    {
        return ['fish_name' => $record->fish_name, 'weight_kg' => number_format((float) $record->weight_kg, 2, '.', ''),
            'starting_price' => number_format((float) $record->starting_price, 2, '.', ''), 'location' => $record->location];
    }

    private function audit(Request $request, Listing $record, string $action, array $before, array $after, ?string $reason = null): void
    {
        ListingActivity::create(['listing_id' => $record->id, 'actor_id' => $request->user()->id,
            'action' => $action, 'before_values' => $before, 'after_values' => $after, 'reason' => $reason]);
        event(new ListingAvailabilityUpdated(['id' => $record->id, ...$this->snapshot($record),
            'current_bid' => $record->current_bid, 'withdrawn' => (bool) $record->withdrawn_at]));
    }
}
