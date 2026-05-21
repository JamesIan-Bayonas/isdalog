import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default Leaflet marker icon asset paths in Vite environments
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: markerIcon2x,
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
});

// Coordinates for Galas Port, Dipolog City area
const PORT_COORDINATES = [8.5725, 123.3211];

export default function DeliveryTracker({ status, location }) {
    // Map status enum states to step percentages
    const steps = [
        { key: 'pending_dispatch', label: 'Awaiting Courier' },
        { key: 'en_route', label: 'Cargo In Transit' },
        { key: 'delivered', label: 'Arrived at Destination' }
    ];

    const currentStepIndex = steps.findIndex(step => step.key === status);

    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden p-6 space-y-6">
            <div>
                <h4 className="text-lg font-bold text-slate-800">Live Logistics Routing</h4>
                <p className="text-xs text-slate-500">Real-time supply chain updates from {location || 'Galas Port'}</p>
            </div>

            {/* --- VISUAL STEP-BY-STEP PROGRESS BAR --- */}
            <div className="relative flex items-center justify-between w-full px-4">
                <div className="absolute left-4 right-4 top-1/2 h-1 bg-slate-200 -translate-y-1/2 z-0">
                    <div 
                        className="h-full bg-blue-600 transition-all duration-700 ease-in-out"
                        style={{ width: `${(currentStepIndex / (steps.length - 1)) * 100}%` }}
                    />
                </div>

                {steps.map((step, idx) => {
                    const isCompleted = idx <= currentStepIndex;
                    const isActive = idx === currentStepIndex;

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

            {/* --- LIGHTWEIGHT EMBEDDED MAP GATEWAY --- */}
            <div className="h-64 w-full rounded-lg overflow-hidden border border-slate-200 shadow-inner z-0">
                <MapContainer center={PORT_COORDINATES} zoom={14} className="h-full w-full">
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <Marker position={PORT_COORDINATES}>
                        <Popup>
                            <div className="font-bold text-center">
                                ⚓ IsdaLog Loading Dock<br/>
                                <span className="text-blue-600 font-normal">Galas Port, Dipolog City</span>
                            </div>
                        </Popup>
                    </Marker>
                </MapContainer>
            </div>
        </div>
    );
}