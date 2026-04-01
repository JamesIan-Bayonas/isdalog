import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ScaleIcon, DocumentChartBarIcon, SignalIcon } from '@heroicons/react/24/outline';

export default function Dashboard({ auth, totalWeight, totalCatches, recentCatches, chartData }) {
    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="font-semibold text-2xl text-slate-800 tracking-tight">Fisherman's Ledger</h2>}
        >
            <Head title="Logistics Dashboard" />

            {/* Subtle slate background for the whole page */}
            <div className="py-10 bg-slate-50 min-h-screen">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-8">
                    
                    {/* KPI Metric Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Volume Card */}
                        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-200 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                <ScaleIcon className="w-24 h-24 text-blue-600" />
                            </div>
                            <div className="flex items-center space-x-4">
                                <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                                    <ScaleIcon className="w-8 h-8" />
                                </div>
                                <div>
                                    <div className="text-slate-500 text-xs font-bold uppercase tracking-wider">Total Catch Volume</div>
                                    <div className="mt-1 text-4xl font-extrabold text-slate-800">{totalWeight} <span className="text-xl text-slate-400 font-medium">kg</span></div>
                                </div>
                            </div>
                        </div>

                        {/* Logs Card */}
                        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-200 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                <DocumentChartBarIcon className="w-24 h-24 text-emerald-600" />
                            </div>
                            <div className="flex items-center space-x-4">
                                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                                    <DocumentChartBarIcon className="w-8 h-8" />
                                </div>
                                <div>
                                    <div className="text-slate-500 text-xs font-bold uppercase tracking-wider">Total Logs</div>
                                    <div className="mt-1 text-4xl font-extrabold text-slate-800">{totalCatches}</div>
                                </div>
                            </div>
                        </div>

                        {/* Status Card */}
                        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-200 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                <SignalIcon className="w-24 h-24 text-cyan-600" />
                            </div>
                            <div className="flex items-center space-x-4">
                                <div className="p-3 bg-cyan-50 text-cyan-600 rounded-xl relative">
                                    {/* Pulsing online indicator */}
                                    <span className="flex h-3 w-3 absolute top-0 right-0 -mt-1 -mr-1">
                                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                                      <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
                                    </span>
                                    <SignalIcon className="w-8 h-8" />
                                </div>
                                <div>
                                    <div className="text-slate-500 text-xs font-bold uppercase tracking-wider">Fleet Status</div>
                                    <div className="mt-1 text-4xl font-extrabold text-slate-800">Online</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Catch Trend Chart (Upgraded to Gradient Area Chart) */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-slate-800">7-Day Catch Trends</h3>
                            <span className="px-3 py-1 text-xs font-semibold text-blue-600 bg-blue-50 rounded-full">Live Data</span>
                        </div>
                        <div className="h-80 w-full">
                            {chartData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.5}/>
                                                <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis dataKey="date" tick={{fill: '#94a3b8', fontSize: 12}} axisLine={false} tickLine={false} dy={10} />
                                        <YAxis tick={{fill: '#94a3b8', fontSize: 12}} axisLine={false} tickLine={false} />
                                        <Tooltip 
                                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                            labelStyle={{ fontWeight: 'bold', color: '#334155' }}
                                        />
                                        <Area type="monotone" dataKey="daily_weight" name="Weight (kg)" stroke="#0ea5e9" strokeWidth={4} fillOpacity={1} fill="url(#colorWeight)" activeDot={{ r: 6, strokeWidth: 0, fill: '#0284c7' }} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex flex-col h-full items-center justify-center text-slate-400">
                                    <SignalIcon className="w-12 h-12 mb-3 opacity-20" />
                                    <p>No catch data recorded yet. Send a photo via Telegram to begin!</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Recent Catches Table (Upgraded styling) */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                        <div className="px-6 py-5 border-b border-slate-100">
                            <h3 className="text-xl font-bold text-slate-800">Recent Logistics Logs</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-slate-100">
                                <thead className="bg-slate-50/50">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Species</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Weight</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Coordinates</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-slate-50">
                                    {recentCatches.map((catchLog) => (
                                        <tr key={catchLog.id} className="hover:bg-slate-50/80 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 font-medium">
                                                {new Date(catchLog.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                                                    {catchLog.species}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700 font-bold">
                                                {catchLog.weight} kg
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                <a 
                                                    href={`https://maps.google.com/?q=${catchLog.latitude},${catchLog.longitude}`} 
                                                    target="_blank" 
                                                    rel="noreferrer"
                                                    className="text-blue-500 hover:text-blue-700 hover:underline font-medium inline-flex items-center"
                                                >
                                                    View on Map
                                                    <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
                                                </a>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                </div>
            </div>
        </AuthenticatedLayout>
    );
}