// src/components/OrderRatingModal.jsx
import React, { useState } from 'react';
import axios from 'axios';

export default function OrderRatingModal({ order, isOpen, onClose, onSettlementComplete }) {
  const [fishermanRating, setFishermanRating] = useState(5);
  const [fishermanComment, setFishermanComment] = useState('');
  const [riderRating, setRiderRating] = useState(5);
  const [riderComment, setRiderComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleConfirm = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await axios.post(`/api/orders/${order.id}/confirm`, {
        fisherman_rating: fishermanRating,
        fisherman_comment: fishermanComment,
        rider_rating: riderRating,
        rider_comment: riderComment,
      });

      onSettlementComplete(response.data);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Verification failed. Try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const StarInput = ({ value, onChange, label }) => (
    <div className="mb-4">
      <label className="block text-sm font-semibold text-gray-700 mb-1">{label}</label>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            type="button"
            key={star}
            onClick={() => onChange(star)}
            className={`text-2xl transition-colors ${
              star <= value ? 'text-amber-400' : 'text-gray-300'
            }`}
          >
            ★
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Verify & Rate Delivery</h2>
        <p className="text-xs text-gray-500 mb-4">
          Confirming releases payment to the fisherman (97%) and rider (₱{order.delivery_fee}).
        </p>

        {error && (
          <div className="mb-4 rounded bg-red-50 p-2.5 text-sm text-red-600 border border-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleConfirm}>
          <div className="border-b pb-3 mb-3">
            <StarInput
              label="Catch Quality (Fisherman)"
              value={fishermanRating}
              onChange={setFishermanRating}
            />
            <input
              type="text"
              placeholder="Comments on fish freshness/packaging (optional)"
              value={fishermanComment}
              onChange={(e) => setFishermanComment(e.target.value)}
              className="w-full text-xs p-2 border rounded border-gray-300 focus:outline-blue-500"
            />
          </div>

          <div className="pb-3 mb-4">
            <StarInput
              label="Delivery Service (Rider)"
              value={riderRating}
              onChange={setRiderRating}
            />
            <input
              type="text"
              placeholder="Comments on speed/handling (optional)"
              value={riderComment}
              onChange={(e) => setRiderComment(e.target.value)}
              className="w-full text-xs p-2 border rounded border-gray-300 focus:outline-blue-500"
            />
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50"
            >
              {isSubmitting ? 'Processing Payout...' : 'Confirm Receipt'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}