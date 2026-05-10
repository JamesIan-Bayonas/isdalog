import React, { useState, useEffect } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import axios from 'axios';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';

export default function BfarDashboard({ auth }) {
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);

    // Fetch the aggregated data from our Phase 1 API
    useEffect(() => {
        axios.get('/api/bfar/analytics')
            .then(response => {
                setAnalytics(response.data);
                setLoading(false);
            })
            .catch(error => {
                console.error("Error fetching BFAR data:", error);
                setLoading(false);
            });
    }, []);

    // Custom colors for the chart
    const colors = ['#059669', '#10b981', '#34d399', '#6ee7b7', '#a7f3d0'];

    return (
        <AuthenticatedLayout
            header={<h2 className="text-xl font-bold leading-tight text-emerald-800">🛡️ BFAR & LGU Maritime Data Center</h2>}
        >
            <Head title="BFAR Dashboard" />

            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    
                    {loading ? (
                        <div className="text-center text-gray-500 py-20 font-bold animate-pulse">
                            Aggregating Port Data...
                        </div>
                    ) : (
                        <div className="space-y-6">
                            
                            {/* TOP ROW: Key Metrics */}
                            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                                {/* Metric 1: Volume */}
                                <div className="overflow-hidden rounded-lg bg-white shadow p-6 border-l-4 border-blue-500">
                                    <dt className="truncate text-sm font-medium text-gray-500">Monthly Trade Volume</dt>
                                    <dd className="mt-2 text-3xl font-bold tracking-tight text-gray-900">
                                        {analytics?.metrics.total_volume_kg} <span className="text-lg text-gray-500">kg</span>
                                    </dd>
                                </div>

                                {/* Metric 2: Value */}
                                <div className="overflow-hidden rounded-lg bg-white shadow p-6 border-l-4 border-emerald-500">
                                    <dt className="truncate text-sm font-medium text-gray-500">Total Market Value</dt>
                                    <dd className="mt-2 text-3xl font-bold tracking-tight text-gray-900">
                                        <span className="text-lg text-gray-500">₱</span> {analytics?.metrics.total_market_value.toLocaleString()}
                                    </dd>
                                </div>

                                {/* Metric 3: Active Ports */}
                                <div className="overflow-hidden rounded-lg bg-white shadow p-6 border-l-4 border-indigo-500">
                                    <dt className="truncate text-sm font-medium text-gray-500">Active Ports Monitored</dt>
                                    <dd className="mt-2 text-3xl font-bold tracking-tight text-gray-900">
                                        {analytics?.metrics.active_ports}
                                    </dd>
                                </div>

                                {/* Metric 4: Alerts */}
                                <div className="overflow-hidden rounded-lg bg-white shadow p-6 border-l-4 border-red-500">
                                    <dt className="truncate text-sm font-medium text-gray-500">Restricted Species Alerts</dt>
                                    <dd className="mt-2 text-3xl font-bold tracking-tight text-red-600">
                                        {analytics?.metrics.restricted_alerts}
                                    </dd>
                                </div>
                            </div>

                            {/* MIDDLE ROW: Charts */}
                            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                                
                                {/* Chart: Species Distribution */}
                                <div className="overflow-hidden rounded-lg bg-white shadow p-6">
                                    <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
                                        Species Distribution (Top 5)
                                    </h3>
                                    <div className="h-72 w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={analytics?.species_distribution}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                                <XAxis dataKey="fish_name" />
                                                <YAxis />
                                                <Tooltip 
                                                    formatter={(value) => [`${value} kg`, 'Total Weight']}
                                                    cursor={{fill: 'transparent'}}
                                                />
                                                <Bar dataKey="total_weight" radius={[4, 4, 0, 0]}>
                                                    {analytics?.species_distribution.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                                                    ))}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                {/* Placeholder for Future Expansion */}
                                <div className="overflow-hidden rounded-lg bg-gradient-to-br from-gray-800 to-gray-900 shadow p-6 flex flex-col items-center justify-center text-center">
                                    <h3 className="text-xl font-bold text-white mb-2">Predictive Pricing AI</h3>
                                    <p className="text-gray-400 max-w-sm">
                                        This module is locked. Future updates will leverage historical port data to predict next week's market prices for fishermen.
                                    </p>
                                    <span className="mt-4 px-3 py-1 bg-gray-700 text-xs font-semibold text-gray-300 rounded-full">Phase 2 Expansion Feature</span>
                                </div>

                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}