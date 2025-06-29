"use clients"

// components/MapComponent.tsx
import L from 'leaflet';
import 'leaflet/dist/leaflet.css'; // Don't forget to import Leaflet's CSS
import React, { useEffect } from 'react';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';

// Fix for default marker icons not showing up due to Webpack issues
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Override default Leaflet icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: markerIcon2x.src,
    iconUrl: markerIcon.src,
    shadowUrl: markerShadow.src,
});

interface LocationData {
    deviceId: string;
    latitude: number;
    longitude: number;
    accuracy?: number;
    timestamp: number;
    activity?: string;
    provider?: string;
}

interface MapComponentProps {
    locations: LocationData[];
    center: [number, number]; // [latitude, longitude]
    zoom: number;
}

// Custom component to update map view when center/zoom props change
function MapUpdater({ center, zoom }: { center: [number, number], zoom: number }) {
    const map = useMap();
    useEffect(() => {
        map.setView(center, zoom);
    }, [center, zoom, map]);
    return null;
}

const MapComponent: React.FC<MapComponentProps> = ({ locations, center, zoom }) => {
    // Determine the map center based on locations, or use the default center
    const mapCenter: [number, number] = locations.length > 0
        ? [locations[locations.length - 1].latitude, locations[locations.length - 1].longitude]
        : center;

    return (
        <MapContainer
            center={mapCenter}
            zoom={zoom}
            scrollWheelZoom={true} // Enable zoom with scroll wheel
            style={{ height: '100%', width: '100%', minHeight: '400px', borderRadius: '8px' }}
        >
            <MapUpdater center={mapCenter} zoom={zoom} />
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {locations.map((loc) => (
                <Marker key={loc.deviceId} position={[loc.latitude, loc.longitude]}>
                    <Popup>
                        <strong>Device ID:</strong> {loc.deviceId} <br />
                        <strong>Lat, Lng:</strong> {loc.latitude?.toFixed(4)}, {loc.longitude?.toFixed(4)} <br />
                        <strong>Accuracy:</strong> {loc.accuracy?.toFixed(2)}m <br />
                        <strong>Activity:</strong> {loc.activity || 'N/A'} <br />
                        <strong>Time:</strong> {new Date(loc.timestamp).toLocaleTimeString()}
                    </Popup>
                </Marker>
            ))}
        </MapContainer>
    );
};

export default MapComponent;