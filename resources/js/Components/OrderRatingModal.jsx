import React, { useState } from 'react';
import { router } from '@inertiajs/react';

export default function OrderRatingModal({ order, isOpen, onClose }) {
    const [fishermanRating, setFishermanRating] = useState(5);
    const [fishermanComment, setFishermanComment] = useState('');
    const [riderRating, setRiderRating] = useState(5);
    const [riderComment, setRiderComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState(null);

    if (!isOpen || !order) return null;

    const handleConfirm = (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setErrorMessage(null);

        router.post(
            `/orders/${order.id || order.order_id}/confirm`,
            {
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
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 font-mono">
                {label}
            </label>
            <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                    <button
                        type="button"
                        key={star}
                        onClick={() => onChange(star)}
                        className={`text-2xl transition-colors ${
                            star <= value ? 'text-amber-400' : 'text-slate-700'
                        }`}
                    >
                        ★
                    </button>
                ))}
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
            <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl text-slate-100">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <div>
                        <h2 className="text-lg font-black tracking-tight text-white">Verify & Rate Delivery</h2>
                        <p className="text-xs text-slate-400 font-mono">Order #{order.id || order.order_id}</p>
                    </div>
                    <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                        Escrow Settlement
                    </span>
                </div>

                <p className="text-xs text-slate-400 my-3 font-mono leading-relaxed">
                    Confirming releases 97% net catch value to the fisherman and transfers the ₱{parseFloat(order.delivery_fee || 0).toFixed(2)} delivery fee directly to the courier's wallet balance.
                </p>

                {errorMessage && (
                    <div className="mb-4 rounded-xl bg-red-500/10 p-3 text-xs text-red-400 border border-red-500/30 font-mono">
                        {errorMessage}
                    </div>
                )}

                <form onSubmit={handleConfirm} className="space-y-4">
                    <div className="rounded-xl bg-slate-950/50 p-4 border border-slate-800/80">
                        <StarInput
                            label="Catch Freshness & Spec (Fisherman)"
                            value={fishermanRating}
                            onChange={setFishermanRating}
                        />
                        <input
                            type="text"
                            placeholder="Comments on fish quality (optional)"
                            value={fishermanComment}
                            onChange={(e) => setFishermanComment(e.target.value)}
                            className="w-full text-xs p-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder:text-slate-600 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all"
                        />
                    </div>

                    {order.rider_id && (
                        <div className="rounded-xl bg-slate-950/50 p-4 border border-slate-800/80">
                            <StarInput
                                label="Cold-Chain Speed & Handling (Rider)"
                                value={riderRating}
                                onChange={setRiderRating}
                            />
                            <input
                                type="text"
                                placeholder="Comments on delivery speed/handling (optional)"
                                value={riderComment}
                                onChange={(e) => setRiderComment(e.target.value)}
                                className="w-full text-xs p-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder:text-slate-600 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all"
                            />
                        </div>
                    )}

                    <div className="flex justify-end gap-2.5 pt-2">
                        <button
                            type="button"
                            disabled={isSubmitting}
                            onClick={onClose}
                            className="px-4 py-2.5 text-xs font-semibold text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-800 rounded-xl transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-5 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 rounded-xl shadow-lg shadow-emerald-950/40 disabled:opacity-50 transition-all cursor-pointer"
                        >
                            {isSubmitting ? 'Distributing Escrow...' : 'Release Escrow & Settle'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}