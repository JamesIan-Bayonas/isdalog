// src/components/RiderPayoutForm.jsx
import React, { useState } from 'react';
import axios from 'axios';

export default function RiderPayoutForm({ currentBalance, onPayoutRequested }) {
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('gcash');
  const [accountName, setAccountName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const res = await axios.post('/api/rider/withdraw', {
        amount: parseFloat(amount),
        payment_method: method,
        account_name: accountName,
        account_number: accountNumber,
      });

      setMessage({ type: 'success', text: res.data.message });
      setAmount('');
      setAccountNumber('');
      if (onPayoutRequested) onPayoutRequested();
    } catch (err) {
      setMessage({
        type: 'error',
        text: err.response?.data?.message || 'Withdrawal request failed.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg p-5 shadow border border-gray-100 max-w-md">
      <h3 className="text-lg font-bold text-gray-800 mb-1">Rider Payout Request</h3>
      <p className="text-sm text-gray-500 mb-4">Available Balance: <strong className="text-emerald-600">₱{currentBalance.toFixed(2)}</strong></p>

      {message && (
        <div className={`p-3 rounded text-sm mb-4 ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Payment Method</label>
          <div className="grid grid-cols-2 gap-2">
            {['gcash', 'maya'].map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMethod(m)}
                className={`py-2 text-sm font-semibold rounded border uppercase ${
                  method === m ? 'border-blue-600 bg-blue-50 text-blue-600' : 'border-gray-200 text-gray-500'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Amount (₱)</label>
          <input
            type="number"
            min="50"
            max={currentBalance}
            step="0.01"
            required
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full p-2 text-sm border rounded border-gray-300 focus:outline-blue-500"
            placeholder="Min. 50.00"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Account Holder Name</label>
          <input
            type="text"
            required
            value={accountName}
            onChange={(e) => setAccountName(e.target.value)}
            className="w-full p-2 text-sm border rounded border-gray-300 focus:outline-blue-500"
            placeholder="e.g., Juan Dela Cruz"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Account / Mobile Number</label>
          <input
            type="text"
            required
            value={accountNumber}
            onChange={(e) => setAccountNumber(e.target.value)}
            className="w-full p-2 text-sm border rounded border-gray-300 focus:outline-blue-500"
            placeholder="0917XXXXXXX"
          />
        </div>

        <button
          type="submit"
          disabled={loading || currentBalance <= 0}
          className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded text-sm disabled:opacity-50"
        >
          {loading ? 'Submitting...' : 'Request Payout'}
        </button>
      </form>
    </div>
  );
}