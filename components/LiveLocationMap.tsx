"use client"

// components/LiveLocationMap.tsx
import dynamic from 'next/dynamic';
import React, { useCallback, useMemo, useState } from 'react';
import useWebSocket from '../hooks/useWebSocket'; // Ensure this path is correct

// Shadcn UI Components
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// Lucide React Icons
import { AlertTriangle, Clock, Cpu, Globe, MapPin, Wifi } from 'lucide-react';

// Interfaces (same as before, ensure they are also defined in useWebSocket.ts for consistency)
interface LocationData {
    deviceId: string;
    latitude: number;
    longitude: number;
    accuracy?: number;
    timestamp: number; // or string if it's an ISO string
    activity?: string;
    provider?: string;
}

interface StatsData {
    devices: {
        active: number;
        websocketConnected: number;
        total?: number;
        online?: number;
    };
    locations: {
        recentUpdates: number;
    };
    media?: {
        totalFiles: number;
        totalSize: number;
        todayUploads: number;
    };
    // Add other stats properties as per your backend's stats_update message
}

interface WebSocketResponse {
    type: string;
    message?: string;
    data?: LocationData | StatsData; // Data can be either LocationData or StatsData or other types
    error?: string;
    subscriptions?: string[];
    // Add other common properties that your WebSocket messages might have
}

// Dynamically import the MapComponent to prevent SSR issues with Leaflet
const MapComponent = dynamic(() => import('./MapComponent'), {
    ssr: false, // This is crucial for Leaflet
});

const LiveLocationMap: React.FC = () => {
    const [liveLocations, setLiveLocations] = useState<LocationData[]>([]);
    const [stats, setStats] = useState<StatsData | null>(null);
    const [dashboardMessage, setDashboardMessage] = useState<string>('');

    // Default map center and zoom (e.g., center of the world or a specific region)
    const DEFAULT_MAP_CENTER: [number, number] = [30.3753, 69.3451]; // Center of Pakistan
    const DEFAULT_MAP_ZOOM = 5;

    // Determine the current map center and zoom based on the latest location
    const currentMapCenter: [number, number] = useMemo(() => {
        if (liveLocations.length > 0) {
            const latestLocation = liveLocations[liveLocations.length - 1];
            return [latestLocation.latitude, latestLocation.longitude];
        }
        return DEFAULT_MAP_CENTER;
    }, [liveLocations]);

    const currentMapZoom = liveLocations.length > 0 ? 12 : DEFAULT_MAP_ZOOM; // Zoom in more if there's a location

    const WEBSOCKET_URL = process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'ws://localhost:3000/ws';

    // Callback to handle incoming WebSocket messages
    const handleWebSocketMessage = useCallback((message: WebSocketResponse) => {
        if (message.type === 'dashboard_connected') {
            setDashboardMessage(message.message || 'Dashboard connected successfully!');
            console.log('Dashboard connected acknowledgement:', message);
        } else if (message.type === 'location_update') {
            const locationUpdate = message.data as LocationData; // Type assertion
            console.log('Received location update:', locationUpdate);
            setLiveLocations((prevLocations) => {
                const existingIndex = prevLocations.findIndex(loc => loc.deviceId === locationUpdate.deviceId);
                if (existingIndex > -1) {
                    const updatedLocations = [...prevLocations];
                    updatedLocations[existingIndex] = locationUpdate;
                    return updatedLocations;
                } else {
                    return [...prevLocations, locationUpdate];
                }
            });
        } else if (message.type === 'stats_update') {
            const statsUpdate = message.data as StatsData; // Type assertion
            console.log('Received stats update:', statsUpdate);
            setStats(statsUpdate);
        } else if (message.type === 'device_status_change') {
            console.log('Received device status change:', message.data);
            // You might want to update a list of devices and their online status
        } else if (message.type === 'error') {
            console.error('WebSocket Error Message:', message.error);
        } else {
            console.log('Received unknown message type:', message.type, message);
        }
    }, []);

    const { isConnected, lastMessage, error, sendMessage } = useWebSocket(WEBSOCKET_URL, handleWebSocketMessage);

    return (
        <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
            <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
                <MapPin className="h-8 w-8 text-blue-600" /> Live Device Location Dashboard
            </h1>
            <p className="text-sm text-gray-600">Real-time tracking and statistics for connected devices.</p>

            <Separator className="my-4" />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card className="shadow-md">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Globe className="h-5 w-5 text-green-600" />
                            Connection Status
                        </CardTitle>
                        <CardDescription>Overall WebSocket connection health.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Badge variant={isConnected ? 'default' : 'destructive'} className="text-base py-1 px-3">
                            {isConnected ? 'Connected' : 'Disconnected'}
                        </Badge>
                        {error && (
                            <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                                <AlertTriangle className="h-4 w-4" /> Error: {error.message}
                            </p>
                        )}
                        {dashboardMessage && <p className="text-sm text-gray-700 mt-2">{dashboardMessage}</p>}
                    </CardContent>
                </Card>

                <Card className="shadow-md">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Cpu className="h-5 w-5 text-purple-600" />
                            Real-time Statistics
                        </CardTitle>
                        <CardDescription>Live metrics from the backend.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                        {stats ? (
                            <>
                                <div>
                                    <h3 className="font-semibold text-gray-700">Devices:</h3>
                                    <p>Active: <Badge variant="secondary">{stats.devices.active}</Badge></p>
                                    <p>WS Connected: <Badge variant="secondary">{stats.devices.websocketConnected}</Badge></p>
                                    {stats.devices.total !== undefined && <p>Total: <Badge variant="secondary">{stats.devices.total}</Badge></p>}
                                    {stats.devices.online !== undefined && <p>Online: <Badge variant="secondary">{stats.devices.online}</Badge></p>}
                                </div>
                                <Separator className="my-2" />
                                <div>
                                    <h3 className="font-semibold text-gray-700">Locations:</h3>
                                    <p>Recent Updates (last 5 min): <Badge variant="secondary">{stats.locations.recentUpdates}</Badge></p>
                                </div>
                                {stats.media && (
                                    <>
                                        <Separator className="my-2" />
                                        <div>
                                            <h3 className="font-semibold text-gray-700">Media:</h3>
                                            <p>Total Files: <Badge variant="secondary">{stats.media.totalFiles}</Badge></p>
                                            <p>Total Size: <Badge variant="secondary">{(stats.media.totalSize / (1024 * 1024)).toFixed(2)} MB</Badge></p>
                                            <p>Today's Uploads: <Badge variant="secondary">{stats.media.todayUploads}</Badge></p>
                                        </div>
                                    </>
                                )}
                            </>
                        ) : (
                            <p className="text-gray-500">Waiting for stats updates...</p>
                        )}
                    </CardContent>
                </Card>

                <Card className="shadow-md col-span-1 md:col-span-2 lg:col-span-1">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Clock className="h-5 w-5 text-orange-600" />
                            Latest Location Updates
                        </CardTitle>
                        <CardDescription>Recent location reports from devices.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ScrollArea className="h-[250px] pr-4"> {/* Adjust height as needed */}
                            {liveLocations.length === 0 ? (
                                <p className="text-gray-500">Waiting for location updates...</p>
                            ) : (
                                <ul className="list-none p-0 space-y-3">
                                    {liveLocations.map((loc) => (
                                        <li key={loc.deviceId} className="pb-3 border-b border-gray-200 last:border-b-0">
                                            <p className="font-semibold text-gray-800 flex items-center gap-1">
                                                <Wifi className="h-4 w-4 text-blue-500" /> Device ID: {loc.deviceId}
                                            </p>
                                            <p className="text-sm text-gray-700">
                                                <MapPin className="inline h-3 w-3 mr-1 text-red-500" />
                                                Coords: {loc.latitude?.toFixed(4)}, {loc.longitude?.toFixed(4)}
                                                {loc.accuracy && (
                                                    <TooltipProvider>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Badge variant="outline" className="ml-2">Acc: {loc.accuracy?.toFixed(2)}m</Badge>
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                <p>Accuracy of the GPS fix in meters.</p>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>
                                                )}
                                            </p>
                                            <p className="text-xs text-gray-500 mt-1">
                                                <Clock className="inline h-3 w-3 mr-1" />
                                                {new Date(loc.timestamp).toLocaleTimeString()} ({loc.activity || 'N/A'})
                                            </p>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </ScrollArea>
                    </CardContent>
                </Card>
            </div>

            <Card className="shadow-md h-[500px] mt-6"> {/* Fixed height for the map */}
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <MapPin className="h-5 w-5 text-red-600" />
                        Live Map View
                    </CardTitle>
                    <CardDescription>Track device locations on the map in real-time.</CardDescription>
                </CardHeader>
                <CardContent className="h-[calc(100%-90px)]"> {/* Adjust height to fit within card */}
                    <MapComponent
                        locations={liveLocations}
                        center={currentMapCenter}
                        zoom={currentMapZoom}
                    />
                </CardContent>
            </Card>
        </div>
    );
};

export default LiveLocationMap;