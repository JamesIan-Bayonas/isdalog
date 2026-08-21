import React, { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import OrderRatingModal from '@/Components/OrderRatingModal';

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: markerIcon2x,
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
});

const PORT_COORDINATES = [8.5725, 123.3211];

function RecenterMap({ coords }) {
    const map = useMap();
    useEffect(() => {
        if (coords && coords.length === 2 && !isNaN(coords[0]) && !isNaN(coords[1])) {
            map.setView(coords, map.getZoom(), { animate: true, duration: 0.8 });
        }
    }, [coords, map]);
    return null;
}

export default function DeliveryTracker({
    orderId,
    status: initialStatus,
    location,
    onStatusUpdate,
    isBuyer = false,
    deliveryFee = 0,
    riderId = null,
    order = null,
}) {
    // Normalize props whether passed individually or as an order object
    const resolvedOrderId = orderId || order?.id || order?.order_id;
    const resolvedStatus = initialStatus || order?.status || 'pending_dispatch';
    const resolvedLocation = location || order?.location || 'Galas Port';
    const resolvedDeliveryFee = deliveryFee || order?.delivery_fee || 0;
    const resolvedRiderId = riderId || order?.rider_id || null;

    const [currentStatus, setCurrentStatus] = useState(resolvedStatus);
    const [courierLocation, setCourierLocation] = useState(PORT_COORDINATES);
    const [connectionState, setConnectionState] = useState('connected');
    const [lastTelemetryTimestamp, setLastTelemetryTimestamp] = useState(null);
    const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);

    useEffect(() => {
        setCurrentStatus(resolvedStatus);
    }, [resolvedStatus]);

    const handleCargoUpdate = useCallback((event) => {
        if (event.order_id === resolvedOrderId) {
            setCurrentStatus(event.status);
            setLastTelemetryTimestamp(event.updated_at || new Date().toISOString());
            if (onStatusUpdate) {
                onStatusUpdate(event);
            }
        }
    }, [resolvedOrderId, onStatusUpdate]);

    const handleLocationUpdate = useCallback((event) => {
        if (event.order_id === resolvedOrderId && typeof event.latitude === 'number' && typeof event.longitude === 'number') {
            setCourierLocation([event.latitude, event.longitude]);
            setLastTelemetryTimestamp(new Date().toISOString());
        }
    }, [resolvedOrderId]);

    // Resilient WebSocket Lifecycle Management
    useEffect(() => {
        if (!window.Echo || !resolvedOrderId) {
            setConnectionState('offline_polling');
            return;
        }

        const channel = window.Echo.private(`orders.${resolvedOrderId}`);

        channel.listen('CargoStatusUpdated', handleCargoUpdate);
        channel.listen('RiderLocationUpdated', handleLocationUpdate);

        // Monitor underlying transport connection state
        if (window.Echo.connector?.pusher?.connection) {
            const pusherConnection = window.Echo.connector.pusher.connection;
            
            const handleStateChange = (states) => {
                setConnectionState(states.current);
            };

            pusherConnection.bind('state_change', handleStateChange);

            return () => {
                pusherConnection.unbind('state_change', handleStateChange);
                window.Echo.leaveChannel(`private-orders.${resolvedOrderId}`);
            };
        }

        return () => {
            window.Echo.leaveChannel(`private-orders.${resolvedOrderId}`);
        };
    }, [resolvedOrderId, handleCargoUpdate, handleLocationUpdate]);

    const steps = [
        { key: 'pending_dispatch', label: 'Awaiting Courier' },
        { key: 'en_route', label: 'Cargo In Transit' },
        { key: 'delivered', label: 'Arrived at Destination' }
    ];

    const currentStepIndex = steps.findIndex(step => step.key === currentStatus);
    const resolvedStepIndex = currentStepIndex === -1 && currentStatus === 'completed' ? 2 : currentStepIndex;

    const payloadForModal = order || {
        id: resolvedOrderId,
        order_id: resolvedOrderId,
        delivery_fee: resolvedDeliveryFee,
        rider_id: resolvedRiderId,
        status: currentStatus,
    };

    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                    <h4 className="text-lg font-bold text-slate-800">Live Logistics Routing</h4>
                    <p className="text-xs text-slate-500">Real-time cold-chain stream from {resolvedLocation}</p>
                </div>
                <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center gap-1.5 font-mono text-[11px] px-2.5 py-1 rounded-full border ${
                        connectionState === 'connected'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>
                        <span className={`w-2 h-2 rounded-full ${connectionState === 'connected' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                        <span>{connectionState === 'connected' ? 'STREAM ACTIVE' : 'RECONNECTING'}</span>
                    </span>

                    <div className="flex items-center gap-1.5 font-mono text-[11px] bg-slate-100 px-3 py-1 rounded-full text-slate-700 font-bold">
                        <span className={`w-2 h-2 rounded-full ${currentStatus === 'en_route' ? 'bg-cyan-500 animate-ping' : 'bg-slate-500'}`} />
                        <span>{currentStatus.toUpperCase().replace('_', ' ')}</span>
                    </div>
                </div>
            </div>

            {/* Stepper Progression Matrix */}
            <div className="relative flex items-center justify-between w-full px-4">
                <div className="absolute left-4 right-4 top-1/2 h-1 bg-slate-200 -translate-y-1/2 z-0">
                    <div 
                        className="h-full bg-blue-600 transition-all duration-700 ease-in-out"
                        style={{ width: `${(Math.max(0, resolvedStepIndex) / (steps.length - 1)) * 100}%` }}
                    />
                </div>

                {steps.map((step, idx) => {
                    const isCompleted = idx <= resolvedStepIndex;
                    const isActive = idx === resolvedStepIndex;

                    return (
                        <div key={step.key} className="flex flex-col items-center relative z-10">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-500 shadow-sm ${
                                isCompleted ? 'bg-blue-600 text-white' : 'bg-white border-2 border-slate-200 text-slate-400'
                            } ${isActive ? 'ring-4 ring-blue-100 animate-pulse' : ''}`}>
                                {idx + 1}
                            </div>
                            <span className={`text-xs font-semibold mt-2 ${isCompleted ? 'text-blue-600 font-bold' : 'text-slate-400'}`}>
                                {step.label}
                            </span>
                        </div>
                    );
                })}
            </div>

            {/* Telemetry Leaflet Container with Recenter Synchronization */}
            <div className="h-64 w-full rounded-lg overflow-hidden border border-slate-200 shadow-inner z-0 relative">
                <MapContainer center={courierLocation} zoom={14} className="h-full w-full relative z-0">
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <Marker position={courierLocation}>
                        <Popup>
                            <div className="font-bold text-center text-xs">
                                {currentStatus === 'en_route' ? '🚚 Courier En Route' : '⚓ IsdaLog Loading Dock'}<br/>
                                <span className="text-blue-600 font-normal">
                                    {currentStatus === 'en_route' 
                                        ? `Lat: ${courierLocation[0].toFixed(4)}, Lon: ${courierLocation[1].toFixed(4)}`
                                        : resolvedLocation}
                                </span>
                            </div>
                        </Popup>
                    </Marker>
                    <RecenterMap coords={courierLocation} />
                </MapContainer>

                {lastTelemetryTimestamp && (
                    <div className="absolute bottom-2 right-2 bg-slate-900/80 text-white text-[10px] font-mono px-2 py-0.5 rounded shadow z-[400] backdrop-blur-sm">
                        Ping: {new Date(lastTelemetryTimestamp).toLocaleTimeString()}
                    </div>
                )}
            </div>

            {/* Buyer Delivery Confirmation & Rating Trigger */}
            {isBuyer && currentStatus === 'delivered' && (
                <div className="pt-2">
                    <button
                        type="button"
                        onClick={() => setIsRatingModalOpen(true)}
                        className="w-full py-3 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm tracking-wide shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                        <span>✓ Verify Inspection & Release Escrow</span>
                    </button>
                </div>
            )}

            {/* Settlement & Rating Modal */}
            <OrderRatingModal
                order={payloadForModal}
                isOpen={isRatingModalOpen}
                onClose={() => setIsRatingModalOpen(false)}
            />
        </div>
    );
}