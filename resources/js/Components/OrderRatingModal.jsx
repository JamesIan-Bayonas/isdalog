// File: isdalog/resources/js/Components/OrderRatingModal.jsx
import React, { useState } from 'react';
import { router } from '@inertiajs/react';
import { DialogTitle } from '@headlessui/react';
import Modal from '@/Components/Modal';

export default function OrderRatingModal({ order, isOpen, onClose, theme = 'dark' }) {
    // Kept for existing callers; the root theme now controls modal colors.
    void theme;
    const [fishermanRating, setFishermanRating] = useState(5);
    const [fishermanComment, setFishermanComment] = useState('');
    const [riderRating, setRiderRating] = useState(5);
    const [riderComment, setRiderComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [pickupOtp, setPickupOtp] = useState('');
    const [errorMessage, setErrorMessage] = useState(null);

    if (!isOpen || !order) return null;

    const handleConfirm = (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setErrorMessage(null);

        router.post(
            `/orders/${order.id || order.order_id}/confirm`,
            {
                pickup_otp: pickupOtp || null,
                fisherman_rating: fishermanRating,
                fisherman_comment: fishermanComment,
                rider_rating: riderRating,
                rider_comment: riderComment,
                rating: fishermanRating, // Backward compatibility for existing schema & tests
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setIsSubmitting(false);
                    onClose();
                },
                onError: (errors) => {
                    setIsSubmitting(false);
                    setErrorMessage(errors.error || Object.values(errors)[0] || 'Verification failed. Try again.');
                },
            }
        );
    };

    const StarInput = ({ value, onChange, label }) => (
        <div className="mb-4">
            <label className="block text-xs font-semibold isd-text-secondary uppercase tracking-wider mb-1.5 font-mono">
                {label}
            </label>
            <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                    <button
                        type="button"
                        key={star}
                        onClick={() => onChange(star)}
                        aria-label={`${label}: ${star} of 5 stars`}
                        aria-pressed={star === value}
                        className={`isd-rating-star text-2xl transition-colors ${
                            star <= value ? 'isd-text-warning' : 'isd-text-secondary'
                        }`}
                    >
                        ★
                    </button>
                ))}
            </div>
        </div>
    );

    return (
        <Modal show={isOpen} onClose={onClose} closeable={!isSubmitting} maxWidth="md">
            <div className="isd-modal-content w-full rounded-2xl p-4 sm:p-6">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b isd-border">
                    <div>
                        <DialogTitle as="h2" className="text-lg font-black tracking-tight isd-text-primary">Verify & Rate Delivery</DialogTitle>
                        <p className="text-xs isd-text-muted font-mono">Order #{order.id || order.order_id}</p>
                    </div>
                    <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full isd-soft-success isd-text-success border isd-border-success">
                        Escrow Settlement
                    </span>
                </div>

                <p className="text-xs isd-text-muted my-3 font-mono leading-relaxed">
                    Confirming releases 97% net catch value to the fisherman and transfers the ₱{parseFloat(order.delivery_fee || 0).toFixed(2)} delivery fee directly to the courier's wallet balance.
                </p>

                {errorMessage && (
                    <div role="alert" className="mb-4 rounded-xl isd-soft-danger p-3 text-xs isd-text-danger border isd-border-danger font-mono">
                        {errorMessage}
                    </div>
                )}

                <form onSubmit={handleConfirm} className="space-y-4">
                    {order.logistics_type === 'self_pickup' && order.status === 'pending_dispatch' && (
                        <label className="block text-sm isd-text-primary">
                            Pickup code from the fisherman
                            <input type="text" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} required value={pickupOtp} onChange={(event) => setPickupOtp(event.target.value)} className="mt-2 block w-full rounded-lg isd-surface border isd-border" />
                            <span className="block text-xs isd-text-muted mt-1">Enter the six-digit code after collecting your catch.</span>
                        </label>
                    )}
                    <div className="rounded-xl isd-subtle p-4 border isd-border">
                        <StarInput
                            label="Catch Freshness & Spec (Fisherman)"
                            value={fishermanRating}
                            onChange={setFishermanRating}
                        />
                        <input
                            type="text"
                            aria-label="Comments on fish quality (optional)"
                            placeholder="Comments on fish quality (optional)"
                            value={fishermanComment}
                            onChange={(e) => setFishermanComment(e.target.value)}
                            className="w-full text-xs p-2.5 isd-surface border isd-border rounded-lg isd-text-primary isd-placeholder focus:ring-1 isd-focus-field outline-none transition-all"
                        />
                    </div>

                    {order.rider_id && (
                        <div className="rounded-xl isd-subtle p-4 border isd-border">
                            <StarInput
                                label="Cold-Chain Speed & Handling (Rider)"
                                value={riderRating}
                                onChange={setRiderRating}
                            />
                            <input
                                type="text"
                                aria-label="Comments on delivery speed and handling (optional)"
                                placeholder="Comments on delivery speed/handling (optional)"
                                value={riderComment}
                                onChange={(e) => setRiderComment(e.target.value)}
                                className="w-full text-xs p-2.5 isd-surface border isd-border rounded-lg isd-text-primary isd-placeholder focus:ring-1 isd-focus-field outline-none transition-all"
                            />
                        </div>
                    )}

                    <div className="flex flex-wrap justify-end gap-2.5 pt-2">
                        <button
                            type="button"
                            disabled={isSubmitting}
                            onClick={onClose}
                            className="px-4 py-2.5 text-xs font-semibold isd-text-muted isd-hover-text isd-subtle isd-hover-subtle rounded-xl transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-5 py-2.5 text-xs font-bold isd-on-action isd-action rounded-xl shadow-lg disabled:opacity-50 transition-all cursor-pointer"
                        >
                            {isSubmitting ? 'Distributing Escrow...' : 'Release Escrow & Settle'}
                        </button>
                    </div>
                </form>
            </div>
        </Modal>
    );
}
