<?php // File: isdalog/app/Http/Controllers/VocabularyController.php

namespace App\Http\Controllers;

use App\Models\FishCatch;
use App\Models\Listing;
use App\Services\MarketVocabulary;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class VocabularyController extends Controller
{
    public function index(Request $request)
    {
        abort_unless($request->user()->role === 'admin', 403);

        return Inertia::render('Admin/Vocabulary', ['terms' => DB::table('vocabulary_terms')->orderBy('kind')->orderBy('display_name')->get()->map(fn ($term) => [...(array) $term, 'aliases' => DB::table('vocabulary_aliases')->where('term_id', $term->id)->orderBy('id')->pluck('label')]),
            'unlinked' => DB::table('listings')->where(fn ($q) => $q->whereNull('species_term_id')->orWhereNull('port_term_id'))->select('id', 'fish_name', 'location', 'species_term_id', 'port_term_id')->orderByDesc('id')->paginate(15)->withQueryString(),
            'catchUnlinked' => DB::table('catches')->where(fn ($q) => $q->whereNull('species_term_id')->orWhereNull('port_term_id'))->select('id', 'species', 'location', 'species_term_id', 'port_term_id')->orderByDesc('id')->paginate(15, ['*'], 'catch_page')->withQueryString()]);
    }

    public function save(Request $request, ?int $term = null)
    {
        abort_unless($request->user()->role === 'admin', 403);
        $data = $request->validate(['kind' => ['required', 'in:port,species'], 'code' => ['required', 'string', 'max:80', 'regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/'], 'display_name' => ['required', 'string', 'max:255'], 'aliases' => ['present', 'array', 'max:30'], 'aliases.*' => ['required', 'string', 'max:255'], 'latitude' => ['nullable', 'numeric', 'between:-90,90', 'required_if:kind,port'], 'longitude' => ['nullable', 'numeric', 'between:-180,180', 'required_if:kind,port'], 'source_note' => ['required', 'string', 'min:10', 'max:2000']]);
        DB::transaction(function () use ($request, $term, $data) {
            // Serialize catalogue edits, including conflicting new aliases.
            \App\Models\User::where('role', 'admin')->orderBy('id')->lockForUpdate()->get(['id']);
            $before = $term ? DB::table('vocabulary_terms')->where('id', $term)->lockForUpdate()->first() : null;
            if ($term && ! $before) {
                abort(404);
            }
            if ($before && ($before->code !== $data['code'] || $before->kind !== $data['kind'])) {
                throw ValidationException::withMessages(['code' => 'Code and vocabulary type are permanent. Rename the display label instead.']);
            }
            if (! $term && DB::table('vocabulary_terms')->where('code', $data['code'])->exists()) {
                throw ValidationException::withMessages(['code' => 'This identifier is already used.']);
            }
            $aliases = array_unique([$data['display_name'], ...$data['aliases']]);
            foreach ($aliases as $alias) {
                $existing = DB::table('vocabulary_aliases')->where('kind', $data['kind'])->where('normalized', MarketVocabulary::normalize($alias))->first();
                if ($existing && (! $term || (int) $existing->term_id !== $term)) {
                    throw ValidationException::withMessages(['aliases' => 'An alias already belongs to another entry. Ambiguous names cannot be assigned twice.']);
                }
            }
            $values = ['kind' => $data['kind'], 'code' => $data['code'], 'display_name' => $data['display_name'], 'latitude' => $data['kind'] === 'port' ? $data['latitude'] : null, 'longitude' => $data['kind'] === 'port' ? $data['longitude'] : null, 'source_note' => $data['source_note'], 'updated_at' => now()];
            $id = $term ?? DB::table('vocabulary_terms')->insertGetId([...$values, 'created_at' => now()]);
            if ($term) {
                DB::table('vocabulary_terms')->where('id', $id)->update($values);
            }
            foreach ($aliases as $alias) {
                DB::table('vocabulary_aliases')->insertOrIgnore(['term_id' => $id, 'kind' => $data['kind'], 'label' => $alias, 'normalized' => MarketVocabulary::normalize($alias), 'created_at' => now(), 'updated_at' => now()]);
            }
            DB::table('vocabulary_changes')->insert(['term_id' => $id, 'actor_user_id' => $request->user()->id, 'before' => $before ? json_encode($before) : null, 'after' => json_encode([...$values, 'aliases' => DB::table('vocabulary_aliases')->where('term_id', $id)->pluck('label')]), 'created_at' => now()]);
        });

        return back()->with('success', 'Vocabulary saved. Original catch and listing labels are unchanged; previous names remain searchable aliases.');
    }

    public function link(Request $request, string $type, int $id)
    {
        abort_unless($request->user()->role === 'admin', 403);
        abort_unless(in_array($type, ['listing', 'catch'], true), 404);
        DB::transaction(function () use ($type, $id) {
            $model = $type === 'listing' ? Listing::class : FishCatch::class;
            $record = $model::whereKey($id)->lockForUpdate()->firstOrFail();
            MarketVocabulary::link($record, $type === 'listing' ? 'fish_name' : 'species');
        });

        return back()->with('success','Exact alias matching checked. Unrecognized labels remain unlinked for review.');
    }
}
