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
        <div className="isd-surface rounded-xl border isd-border shadow-sm overflow-hidden p-4 sm:p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                    <h4 className="text-lg font-bold isd-text-primary">Live Logistics Routing</h4>
                    <p className="text-xs isd-text-muted">Real-time cold-chain stream from {resolvedLocation}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <span className={`inline-flex items-center gap-1.5 font-mono text-[11px] px-2.5 py-1 rounded-full border ${
                        connectionState === 'connected'
                            ? 'isd-soft-success isd-text-success isd-border-success'
                            : 'isd-soft-warning isd-text-warning isd-border-warning'
                    }`}>
                        <span className={`w-2 h-2 rounded-full ${connectionState === 'connected' ? 'isd-fill-success animate-pulse' : 'isd-fill-warning'}`} />
                        <span>{connectionState === 'connected' ? 'STREAM ACTIVE' : 'RECONNECTING'}</span>
                    </span>

                    <div className="flex items-center gap-1.5 font-mono text-[11px] isd-subtle px-3 py-1 rounded-full isd-text-secondary font-bold">
                        <span className={`w-2 h-2 rounded-full ${currentStatus === 'en_route' ? 'isd-fill-brand animate-ping' : 'isd-fill-muted'}`} />
                        <span>{currentStatus.toUpperCase().replace('_', ' ')}</span>
                    </div>
                </div>
            </div>

            {/* Stepper Progression Matrix */}
            <div className="relative grid grid-cols-3 gap-2 w-full text-center">
                <div className="absolute left-[16.67%] right-[16.67%] top-4 h-1 isd-track -translate-y-1/2 z-0">
                    <div 
                        className="h-full isd-fill-brand transition-all duration-700 ease-in-out"
                        style={{ width: `${(Math.max(0, resolvedStepIndex) / (steps.length - 1)) * 100}%` }}
                    />
                </div>

                {steps.map((step, idx) => {
                    const isCompleted = idx <= resolvedStepIndex;
                    const isActive = idx === resolvedStepIndex;

                    return (
                        <div key={step.key} className="min-w-0 flex flex-col items-center relative z-10">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-500 shadow-sm ${
                                isCompleted ? 'isd-progress-step' : 'isd-surface border-2 isd-border isd-text-muted'
                            } ${isActive ? 'ring-4 isd-ring-brand animate-pulse' : ''}`}>
                                {idx + 1}
                            </div>
                            <span className={`text-[11px] sm:text-xs leading-snug font-semibold mt-2 ${isCompleted ? 'isd-text-brand font-bold' : 'isd-text-muted'}`}>
                                {step.label}
                            </span>
                        </div>
                    );
                })}
            </div>

            {/* Telemetry Leaflet Container with Recenter Synchronization */}
            <div className="h-64 w-full rounded-lg overflow-hidden border isd-border isd-inset z-0 relative">
                <MapContainer center={courierLocation} zoom={14} className="h-full w-full relative z-0">
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <Marker position={courierLocation}>
                        <Popup>
                            <div className="font-bold text-center text-xs">
                                {currentStatus === 'en_route' ? '🚚 Courier En Route' : '⚓ IsdaLog Loading Dock'}<br/>
                                <span className="isd-text-brand font-normal">
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
                    <div className="absolute bottom-2 right-2 isd-surface isd-text-primary text-[10px] font-mono px-2 py-0.5 rounded shadow z-[400] ">
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
                        className="w-full py-3 px-4 rounded-lg isd-action isd-on-action font-bold text-sm tracking-wide shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
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
