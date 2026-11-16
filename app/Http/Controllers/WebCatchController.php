<?php // File: isdalog/app/Http/Controllers/WebCatchController.php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class WebCatchController extends Controller
{
    public function create(Request $request): Response
    {
        abort_unless($request->user()->role === 'fisherman', 403);

        return Inertia::render('Catches/Create', ['ports' => \App\Services\MarketVocabulary::ports(), 'speciesNames' => \Illuminate\Support\Facades\DB::table('vocabulary_aliases')->where('kind', 'species')->orderBy('label')->pluck('label')]);
    }
}
