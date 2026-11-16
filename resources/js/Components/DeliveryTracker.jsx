// File: isdalog/resources/js/Components/DeliveryTracker.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
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
    logisticsType = null,
    order = null,
}) {
    // Normalize props whether passed individually or as an order object
    const resolvedOrderId = orderId || order?.id || order?.order_id;
    const resolvedStatus = initialStatus || order?.status || 'pending_dispatch';
    const resolvedLocation = location || order?.location || 'Galas Port';
    const resolvedDeliveryFee = deliveryFee || order?.delivery_fee || 0;
    const resolvedRiderId = riderId || order?.rider_id || null;
    const resolvedMode = logisticsType || order?.logistics_type || 'request_rider';
    const latestFix = useRef(null);

    const [currentStatus, setCurrentStatus] = useState(resolvedStatus);
    const [courierLocation, setCourierLocation] = useState(null);
    const [connectionState, setConnectionState] = useState('unavailable');
    const [lastTelemetryTimestamp, setLastTelemetryTimestamp] = useState(null);
    const [snapshotState, setSnapshotState] = useState('loading');
    const [locationAge, setLocationAge] = useState(null);
    const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);

    useEffect(() => {
        setCurrentStatus(resolvedStatus);
    }, [resolvedStatus]);

    const handleCargoUpdate = useCallback((event) => {
        if (event.order_id === resolvedOrderId) {
            setCurrentStatus(event.status);

            if (onStatusUpdate) {
                onStatusUpdate(event);
            }
        }
    }, [resolvedOrderId, onStatusUpdate]);

    const handleLocationUpdate = useCallback((event) => {
        if (event.order_id === resolvedOrderId && typeof event.latitude === 'number' && typeof event.longitude === 'number') {
            const recorded = event.recorded_at || new Date().toISOString();
            if (latestFix.current && Date.parse(recorded) < Date.parse(latestFix.current)) return;
            latestFix.current = recorded;
            setCourierLocation([event.latitude, event.longitude]);
            setLastTelemetryTimestamp(recorded);
            setLocationAge(0);
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

        // Transport connection is distinct from a recent GPS fix.
        setConnectionState(window.Echo.connector?.pusher?.connection?.state || 'connecting');
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

    useEffect(() => {
        if (!resolvedOrderId) return;
        latestFix.current = null;
        setCourierLocation(null);
        setLastTelemetryTimestamp(null);
        setLocationAge(null);
        let stopped = false;
        let pending = false;
        let controller;
        const refresh = async () => {
            if (pending) return;
            pending = true;
            controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 10000);
            try {
                const response = await fetch('/orders/' + resolvedOrderId + '/telemetry', { headers: { Accept: 'application/json' }, cache: 'no-store', signal: controller.signal });
                if (!response.ok) throw new Error('Snapshot unavailable');
                const data = await response.json();
                if (stopped) return;
                setSnapshotState('updated');
                handleCargoUpdate({ order_id: resolvedOrderId, status: data.status });
                if (data.latitude !== null && data.longitude !== null && data.recorded_at) {
                    if (latestFix.current && Date.parse(data.recorded_at) < Date.parse(latestFix.current)) return;
                    latestFix.current = data.recorded_at;
                    setCourierLocation([data.latitude, data.longitude]);
                    setLastTelemetryTimestamp(data.recorded_at);
                    setLocationAge(Math.max(0, (Date.parse(data.server_now) - Date.parse(data.recorded_at)) / 1000));
                }
            } catch (error) { if (!stopped) setSnapshotState('unavailable'); }
            finally { clearTimeout(timeout); pending = false; }
        };
        refresh();
        const timer = setInterval(refresh, 15000);
        const ageTimer = setInterval(() => setLocationAge(age => age === null ? null : age + 1), 1000);
        return () => { stopped = true; controller?.abort(); clearInterval(timer); clearInterval(ageTimer); };
    }, [resolvedOrderId]);

    const steps = resolvedMode === 'self_pickup' ? [
        { key: 'pending_dispatch', label: 'Awaiting pickup' },
        { key: 'completed', label: 'Pickup confirmed' },
    ] : [
        { key: 'pending_dispatch', label: 'Awaiting Courier' },
        { key: 'en_route', label: 'Cargo In Transit' },
        { key: 'delivered', label: 'Arrived at Destination' }
    ];

    const currentStepIndex = steps.findIndex(step => step.key === currentStatus);
    const resolvedStepIndex = currentStepIndex === -1 && ['delivered', 'completed'].includes(currentStatus) ? steps.length - 1 : currentStepIndex;

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
                    <h4 className="text-lg font-bold isd-text-primary">Delivery tracking</h4>
                    <p className="text-xs isd-text-muted">Order updates from {resolvedLocation}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <span className={`inline-flex items-center gap-1.5 font-mono text-[11px] px-2.5 py-1 rounded-full border ${
                        connectionState === 'connected'
                            ? 'isd-soft-success isd-text-success isd-border-success'
                            : 'isd-soft-warning isd-text-warning isd-border-warning'
                    }`}>
                        <span className={`w-2 h-2 rounded-full ${connectionState === 'connected' ? 'isd-fill-success animate-pulse' : 'isd-fill-warning'}`} />
                        <span>{connectionState === 'connected' ? 'Connection open' : 'Live connection unavailable'}</span>
                    </span>

                    <div className="flex items-center gap-1.5 font-mono text-[11px] isd-subtle px-3 py-1 rounded-full isd-text-secondary font-bold">
                        <span className={`w-2 h-2 rounded-full ${currentStatus === 'en_route' ? 'isd-fill-brand animate-ping' : 'isd-fill-muted'}`} />
                        <span>{currentStatus.toUpperCase().replace('_', ' ')}</span>
                    </div>
                </div>
            </div>

            <p role="status" className="text-xs isd-text-muted">
                {snapshotState === 'updated' ? 'Order snapshot refreshed; checks every 15 seconds.' : snapshotState === 'loading' ? 'Checking order updates...' : 'Order refresh unavailable; showing the last received state.'}
                {' '}{resolvedMode === 'self_pickup' ? 'Self-pickup; no courier tracking is expected.' : !courierLocation ? 'Courier GPS unavailable. Map shows a reference port, not the courier.' : locationAge > 120 ? 'GPS is stale; showing the last recorded location.' : 'Recent GPS update received; this does not verify cold-chain conditions.'}
            </p>
            {/* Stepper Progression Matrix */}
            <div className="relative grid gap-2 w-full text-center" style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}>
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
            {resolvedMode !== 'self_pickup' && <div className="h-64 w-full rounded-lg overflow-hidden border isd-border isd-inset z-0 relative">
                <MapContainer center={courierLocation || PORT_COORDINATES} zoom={14} className="h-full w-full relative z-0">
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <Marker position={courierLocation || PORT_COORDINATES}>
                        <Popup>
                            <div className="font-bold text-center text-xs">
                                {courierLocation ? 'Last recorded courier location' : 'Reference port — courier location unknown'}<br/>
                                <span className="isd-text-brand font-normal">
                                    {courierLocation
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
                        GPS recorded: {new Date(lastTelemetryTimestamp).toLocaleTimeString()}
                    </div>
                )}
            </div>}

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
