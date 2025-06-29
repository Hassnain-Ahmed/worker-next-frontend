"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import useWebSocket from "@/hooks/useWebSocket"
import { MapPin, RefreshCw, Smartphone, Wifi, WifiOff } from "lucide-react"
import { useEffect, useRef, useState } from "react"

interface LocationData {
    _id: string
    deviceId: string
    latitude: number
    longitude: number
    accuracy: number
    timestamp: string
    provider: string
    activity: string
    device?: {
        deviceModel: string
        deviceBrand: string
        isOnline: boolean
        websocketConnected: boolean
    }
}

export default function LiveLocationPage() {
    const [locations, setLocations] = useState<LocationData[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [selectedDevice, setSelectedDevice] = useState<string>("all")
    const [accuracyFilter, setAccuracyFilter] = useState<string>("100")
    const mapRef = useRef<HTMLDivElement>(null)
    const mapInstanceRef = useRef<any>(null)
    const markersRef = useRef<any[]>([])

    // WebSocket connection for real-time updates
    const handleWebSocketMessage = (message: any) => {
        if (message.type === "location_update") {
            const newLocation = message.data
            setLocations((prev) => {
                // Update existing location or add new one
                const existingIndex = prev.findIndex((loc) => loc.deviceId === newLocation.deviceId)
                if (existingIndex >= 0) {
                    const updated = [...prev]
                    updated[existingIndex] = {
                        ...updated[existingIndex],
                        ...newLocation,
                        _id: updated[existingIndex]._id || Date.now().toString(),
                    }
                    return updated
                } else {
                    return [
                        {
                            ...newLocation,
                            _id: Date.now().toString(),
                        },
                        ...prev,
                    ]
                }
            })
        }
    }

    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:3000/ws"
    const { isConnected } = useWebSocket(wsUrl, handleWebSocketMessage)

    // Initialize OpenStreetMap
    useEffect(() => {
        const initMap = async () => {
            if (typeof window !== "undefined" && mapRef.current && !mapInstanceRef.current) {
                // Dynamically import Leaflet
                const L = (await import("leaflet")).default

                // Fix for default markers
                delete (L.Icon.Default.prototype as any)._getIconUrl
                L.Icon.Default.mergeOptions({
                    iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
                    iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
                    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
                })

                mapInstanceRef.current = L.map(mapRef.current).setView([40.7128, -74.006], 10)

                L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
                    attribution: "© OpenStreetMap contributors",
                }).addTo(mapInstanceRef.current)
            }
        }

        initMap()
    }, [])

    // Initial fetch of live locations
    const fetchLiveLocations = async () => {
        try {
            setLoading(true)
            const params = new URLSearchParams({
                accuracy: accuracyFilter,
            })

            if (selectedDevice !== "all") {
                params.append("deviceId", selectedDevice)
            }

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/location/live?${params}`)
            const data = await response.json()

            if (data.success) {
                setLocations(data.data)
                updateMapMarkers(data.data)
                setError(null)
            } else {
                setError(data.error || "Failed to fetch location data")
            }
        } catch (err) {
            setError("Network error occurred")
            console.error("Fetch error:", err)
        } finally {
            setLoading(false)
        }
    }

    // Update map markers when locations change
    useEffect(() => {
        updateMapMarkers(locations)
    }, [locations])

    // Update map markers
    const updateMapMarkers = async (locationData: LocationData[]) => {
        if (!mapInstanceRef.current || typeof window === "undefined") return

        const L = (await import("leaflet")).default

        // Clear existing markers
        markersRef.current.forEach((marker) => {
            mapInstanceRef.current.removeLayer(marker)
        })
        markersRef.current = []

        if (locationData.length === 0) return

        // Filter locations based on selected device and accuracy
        const filteredLocations = locationData.filter((location) => {
            const deviceMatch = selectedDevice === "all" || location.deviceId === selectedDevice
            const accuracyMatch = location.accuracy <= Number.parseInt(accuracyFilter)
            return deviceMatch && accuracyMatch
        })

        if (filteredLocations.length === 0) return

        const bounds = L.latLngBounds([])

        filteredLocations.forEach((location) => {
            const { latitude, longitude, deviceId, accuracy, device } = location

            // Create custom icon based on device status
            const iconColor = device?.websocketConnected ? "#22c55e" : device?.isOnline ? "#f59e0b" : "#ef4444"

            const customIcon = L.divIcon({
                html: `<div style="background-color: ${iconColor}; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
                className: "custom-marker",
                iconSize: [20, 20],
                iconAnchor: [10, 10],
            })

            const marker = L.marker([latitude, longitude], { icon: customIcon })
                .bindPopup(`
          <div class="p-2">
            <h3 class="font-semibold">${deviceId}</h3>
            <p class="text-sm text-gray-600">${device?.deviceBrand || "Unknown"} ${device?.deviceModel || ""}</p>
            <p class="text-sm">Accuracy: ${accuracy}m</p>
            <p class="text-sm">Status: ${device?.websocketConnected ? "Live" : device?.isOnline ? "Online" : "Offline"}</p>
            <p class="text-xs text-gray-500">${new Date(location.timestamp).toLocaleString()}</p>
          </div>
        `)
                .addTo(mapInstanceRef.current)

            markersRef.current.push(marker)
            bounds.extend([latitude, longitude])
        })

        // Fit map to show all markers
        if (filteredLocations.length > 0) {
            mapInstanceRef.current.fitBounds(bounds, { padding: [20, 20] })
        }
    }

    // Initial fetch
    useEffect(() => {
        fetchLiveLocations()
    }, [selectedDevice, accuracyFilter])

    // Get unique devices for filter
    const uniqueDevices = Array.from(new Set(locations.map((loc) => loc.deviceId)))

    return (
        <div className="container mx-auto p-6 space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">Live Location Tracking</h1>
                <div className="flex items-center gap-4">
                    <Badge variant="outline" className="text-sm">
                        {locations.length} Active Device{locations.length !== 1 ? "s" : ""}
                    </Badge>
                    <Badge variant={isConnected ? "default" : "destructive"} className="flex items-center gap-1">
                        {isConnected ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
                        {isConnected ? "Connected" : "Disconnected"}
                    </Badge>
                </div>
            </div>

            {/* Controls */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Filters & Controls</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-4">
                    <div className="flex items-center gap-2">
                        <label className="text-sm font-medium">Device:</label>
                        <Select value={selectedDevice} onValueChange={setSelectedDevice}>
                            <SelectTrigger className="w-48">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Devices</SelectItem>
                                {uniqueDevices.map((deviceId) => (
                                    <SelectItem key={deviceId} value={deviceId}>
                                        {deviceId}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex items-center gap-2">
                        <label className="text-sm font-medium">Max Accuracy:</label>
                        <Select value={accuracyFilter} onValueChange={setAccuracyFilter}>
                            <SelectTrigger className="w-32">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="10">10m</SelectItem>
                                <SelectItem value="50">50m</SelectItem>
                                <SelectItem value="100">100m</SelectItem>
                                <SelectItem value="500">500m</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <Button onClick={fetchLiveLocations} disabled={loading}>
                        <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                        {loading ? "Loading..." : "Refresh"}
                    </Button>
                </CardContent>
            </Card>

            {error && (
                <Card className="border-red-200 bg-red-50">
                    <CardContent className="pt-6">
                        <p className="text-red-600">{error}</p>
                    </CardContent>
                </Card>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Map */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <MapPin className="h-5 w-5" />
                            Live Location Map
                            {isConnected && (
                                <Badge variant="default" className="ml-2">
                                    Real-time
                                </Badge>
                            )}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div ref={mapRef} className="w-full h-96 rounded-lg border" style={{ minHeight: "400px" }} />
                    </CardContent>
                </Card>

                {/* Device List */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Smartphone className="h-5 w-5" />
                            Active Devices
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {locations.map((location) => (
                            <div key={location._id} className="p-3 border rounded-lg space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="font-medium text-sm">{location.deviceId}</span>
                                    {location.device?.websocketConnected ? (
                                        <Wifi className="h-4 w-4 text-green-500" />
                                    ) : (
                                        <WifiOff className="h-4 w-4 text-red-500" />
                                    )}
                                </div>

                                <div className="text-xs text-gray-600 space-y-1">
                                    <p>
                                        {location.device?.deviceBrand} {location.device?.deviceModel}
                                    </p>
                                    <p>Lat: {location.latitude.toFixed(6)}</p>
                                    <p>Lng: {location.longitude.toFixed(6)}</p>
                                    <p>Accuracy: {location.accuracy}m</p>
                                    <p>Updated: {new Date(location.timestamp).toLocaleTimeString()}</p>
                                </div>

                                <div className="flex gap-1">
                                    <Badge variant={location.device?.websocketConnected ? "default" : "secondary"} className="text-xs">
                                        {location.device?.websocketConnected ? "Live" : "Offline"}
                                    </Badge>
                                    <Badge variant="outline" className="text-xs">
                                        {location.provider}
                                    </Badge>
                                </div>
                            </div>
                        ))}

                        {locations.length === 0 && !loading && (
                            <p className="text-center text-gray-500 py-8">No active devices found</p>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
