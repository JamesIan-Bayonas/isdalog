import { useState } from 'react';
import { DialogDescription, DialogTitle } from '@headlessui/react';
import { MapPinIcon, PhotoIcon, XMarkIcon } from '@heroicons/react/24/outline';
import Modal from '@/Components/Modal';
import { Link } from '@inertiajs/react';

const money = (value) => `₱${value.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function CatchPhoto({ listing }) {
    const [failed, setFailed] = useState(false);
    return (
        <div className="isd-catch-photo">
            {listing.image_url && !failed ? (
                <img src={listing.image_url} alt={`Catch photograph: ${listing.fish_name}`} loading="lazy" onError={() => setFailed(true)} />
            ) : (
                <div className="isd-catch-photo-fallback">
                    <PhotoIcon aria-hidden="true" />
                    <span>Catch photo unavailable</span>
                </div>
            )}
        </div>
    );
}

export default function FishermanCatchCard({ listing, onAccept, isProcessing, errorMessage }) {
    const [showDetails, setShowDetails] = useState(false);
    // Preserve the existing auction card's price selection and action eligibility.
    const startingPrice = Number(listing.starting_price || 0);
    const topOffer = Number(listing.current_bid || listing.highest_bid || startingPrice);
    const bidderName = listing.highest_bidder_name || listing.top_bidder_name || 'No bids yet';
    const bidsCount = listing.bids_count ?? (listing.bids ? listing.bids.length : (listing.has_bids ? 1 : 0));
    const hasBids = listing.has_bids || bidsCount > 0;

    const offerSummary = (
        <dl className="isd-catch-offer-summary">
            <div><dt>Starting price · batch total</dt><dd>{money(startingPrice)}</dd></div>
            <div><dt>Highest offer · batch total</dt><dd className={hasBids ? 'isd-catch-offer-value' : ''}>{hasBids ? money(topOffer) : 'No offers yet'}</dd></div>
            <div><dt>Leading buyer</dt><dd>{bidderName}</dd></div>
        </dl>
    );
    const error = !isProcessing && errorMessage && (
        <div className="isd-catch-error" role="alert">
            <strong>Unable to accept offer</strong>
            <p>{errorMessage}</p>
        </div>
    );
    const acceptAction = hasBids ? (
        <button type="button" className="isd-ui-button isd-ui-button-primary isd-catch-accept" disabled={isProcessing}
            aria-busy={isProcessing} onClick={() => onAccept(listing.id)}>
            {isProcessing ? 'Locking escrow…' : `Accept ${money(topOffer)} offer`}
        </button>
    ) : <p className="isd-catch-waiting">Waiting for buyer offers</p>;

    return (
        <>
            <article id={`fisherman-auction-${listing.id}`} tabIndex={-1} className="isd-fisherman-anchor isd-catch-card" aria-labelledby={`catch-title-${listing.id}`}>
                <CatchPhoto key={listing.image_url || 'no-photo'} listing={listing} />
                <div className="isd-catch-card-body">
                    <div className="isd-catch-badges">
                        <span>Auction #{listing.id}</span>
                        <span>{bidsCount} {bidsCount === 1 ? 'bid' : 'bids'} placed</span>
                    </div>
                    <h4 id={`catch-title-${listing.id}`}>{listing.fish_name}</h4>
                    <p className="isd-catch-location"><MapPinIcon aria-hidden="true" />{listing.location || 'Landing location not provided'}</p>
                    <p className="isd-catch-weight">{listing.weight_kg} kg <span>batch weight</span></p>
                    {offerSummary}
                    {!showDetails && error}
                    <div className="isd-catch-actions">
                        <Link className="isd-ui-button isd-ui-button-secondary" href={route('catches.index', { listing: listing.id })}>Manage listing</Link>
                        <button type="button" className="isd-ui-button isd-ui-button-secondary" aria-haspopup="dialog"
                            aria-label={`View catch and offer details for ${listing.fish_name}, auction ${listing.id}`} onClick={() => setShowDetails(true)}>
                            View catch & offers
                        </button>
                        {acceptAction}
                    </div>
                </div>
            </article>

            <Modal show={showDetails} onClose={() => setShowDetails(false)} maxWidth="2xl">
                <div className="isd-catch-dialog">
                    <div className="isd-catch-dialog-heading">
                        <div>
                            <p className="isd-catch-eyebrow">Auction #{listing.id}</p>
                            <DialogTitle as="h3">{listing.fish_name}</DialogTitle>
                        </div>
                        <button type="button" className="isd-catch-close" aria-label="Close catch details" onClick={() => setShowDetails(false)}><XMarkIcon aria-hidden="true" /></button>
                    </div>
                    <DialogDescription className="isd-fisherman-supporting">Review this catch and its leading offer. Prices shown are for the whole batch.</DialogDescription>
                    <CatchPhoto key={listing.image_url || 'no-photo'} listing={listing} />
                    <dl className="isd-catch-facts">
                        <div><dt>Batch weight</dt><dd>{listing.weight_kg} kg</dd></div>
                        <div><dt>Landing location</dt><dd>{listing.location || 'Not provided'}</dd></div>
                        <div><dt>Bids placed</dt><dd>{bidsCount}</dd></div>
                    </dl>
                    {offerSummary}
                    <p className="isd-fisherman-supporting">{hasBids ? 'Accepting awards this catch to the leading buyer and locks their funds in escrow.' : 'You can accept an offer once a buyer places a bid.'}</p>
                    {error}
                    <div className="isd-catch-dialog-actions">
                        <button type="button" className="isd-ui-button isd-ui-button-secondary" onClick={() => setShowDetails(false)}>Back to catches</button>
                        {acceptAction}
                    </div>
                </div>
            </Modal>
        </>
    );
}
