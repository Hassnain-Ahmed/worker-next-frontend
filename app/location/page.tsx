"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Clock, MapPin, RefreshCw, Smartphone } from "lucide-react"
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
    const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
    const mapRef = useRef<HTMLDivElement>(null)
    const mapInstanceRef = useRef<any>(null)
    const markersRef = useRef<any[]>([])

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

    // Fetch latest location records
    const fetchLatestLocations = async () => {
        try {
            setLoading(true)
            const params = new URLSearchParams({
                accuracy: accuracyFilter,
                limit: "50", // Get more records to show recent activity
            })

            if (selectedDevice !== "all") {
                params.append("deviceId", selectedDevice)
            }

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/location/live?${params}`)
            const data = await response.json()

            if (data.success) {
                setLocations(data.data)
                setLastUpdate(new Date())
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
            const { latitude, longitude, deviceId, accuracy, device, timestamp } = location

            // Create custom icon based on device status and recency
            const locationAge = Date.now() - new Date(timestamp).getTime()
            const isRecent = locationAge < 5 * 60 * 1000 // Less than 5 minutes old

            let iconColor = "#6b7280" // Default gray for old locations
            if (isRecent) {
                iconColor = device?.websocketConnected ? "#22c55e" : device?.isOnline ? "#f59e0b" : "#ef4444"
            }

            const customIcon = L.divIcon({
                html: `<div style="background-color: ${iconColor}; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
                className: "custom-marker",
                iconSize: [20, 20],
                iconAnchor: [10, 10],
            })

            const timeAgo = getTimeAgo(timestamp)
            const marker = L.marker([latitude, longitude], { icon: customIcon })
                .bindPopup(`
          <div class="p-2">
            <h3 class="font-semibold">${deviceId}</h3>
            <p class="text-sm text-gray-600">${device?.deviceBrand || "Unknown"} ${device?.deviceModel || ""}</p>
            <p class="text-sm">Accuracy: ${accuracy}m</p>
            <p class="text-sm">Provider: ${location.provider}</p>
            <p class="text-sm">Status: ${device?.websocketConnected ? "Connected" : device?.isOnline ? "Online" : "Offline"}</p>
            <p class="text-xs text-gray-500">${timeAgo}</p>
            <p class="text-xs text-gray-400">${new Date(timestamp).toLocaleString()}</p>
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

    // Helper function to get time ago
    const getTimeAgo = (timestamp: string) => {
        const now = new Date()
        const locationTime = new Date(timestamp)
        const diffMs = now.getTime() - locationTime.getTime()
        const diffMins = Math.floor(diffMs / (1000 * 60))
        const diffHours = Math.floor(diffMins / 60)
        const diffDays = Math.floor(diffHours / 24)

        if (diffMins < 1) return "Just now"
        if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? "s" : ""} ago`
        if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`
        return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`
    }

    // Update map markers when locations change
    useEffect(() => {
        updateMapMarkers(locations)
    }, [locations, selectedDevice, accuracyFilter])

    // Initial fetch and auto-refresh
    useEffect(() => {
        fetchLatestLocations()

        // Auto-refresh every 30 seconds
        const interval = setInterval(fetchLatestLocations, 30000)
        return () => clearInterval(interval)
    }, [selectedDevice, accuracyFilter])

    // Get unique devices for filter
    const uniqueDevices = Array.from(new Set(locations.map((loc) => loc.deviceId)))

    // Group locations by device for the list view
    const locationsByDevice = locations.reduce(
        (acc, location) => {
            if (!acc[location.deviceId]) {
                acc[location.deviceId] = []
            }
            acc[location.deviceId].push(location)
            return acc
        },
        {} as Record<string, LocationData[]>,
    )

    return (
        <div className="container mx-auto p-6 space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">Latest Location Records</h1>
                <div className="flex items-center gap-4">
                    <Badge variant="outline" className="text-sm">
                        {locations.length} Location Record{locations.length !== 1 ? "s" : ""}
                    </Badge>
                    {lastUpdate && (
                        <Badge variant="secondary" className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Updated: {lastUpdate.toLocaleTimeString()}
                        </Badge>
                    )}
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

                    <Button onClick={fetchLatestLocations} disabled={loading}>
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
                            Location Map
                            <Badge variant="outline" className="ml-2">
                                Auto-refresh: 30s
                            </Badge>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div ref={mapRef} className="w-full h-96 rounded-lg border" style={{ minHeight: "400px" }} />
                        <div className="mt-2 text-xs text-gray-500 flex items-center gap-4">
                            <div className="flex items-center gap-1">
                                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                <span>Recent & Connected</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                                <span>Recent & Online</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                                <span>Recent & Offline</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                                <span>Older Records</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Device List */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Smartphone className="h-5 w-5" />
                            Location Records by Device
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 max-h-96 overflow-y-auto">
                        {Object.entries(locationsByDevice).map(([deviceId, deviceLocations]) => {
                            const latestLocation = deviceLocations[0] // Assuming sorted by timestamp desc
                            const locationCount = deviceLocations.length

                            return (
                                <div key={deviceId} className="p-3 border rounded-lg space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="font-medium text-sm">{deviceId}</span>
                                        <Badge variant="outline" className="text-xs">
                                            {locationCount} record{locationCount !== 1 ? "s" : ""}
                                        </Badge>
                                    </div>

                                    <div className="text-xs text-gray-600 space-y-1">
                                        <p>
                                            {latestLocation.device?.deviceBrand} {latestLocation.device?.deviceModel}
                                        </p>
                                        <p>Latest: {getTimeAgo(latestLocation.timestamp)}</p>
                                        <p>Lat: {latestLocation.latitude.toFixed(6)}</p>
                                        <p>Lng: {latestLocation.longitude.toFixed(6)}</p>
                                        <p>Accuracy: {latestLocation.accuracy}m</p>
                                    </div>

                                    <div className="flex gap-1 flex-wrap">
                                        <Badge
                                            variant={latestLocation.device?.websocketConnected ? "default" : "secondary"}
                                            className="text-xs"
                                        >
                                            {latestLocation.device?.websocketConnected ? "Connected" : "Offline"}
                                        </Badge>
                                        <Badge variant="outline" className="text-xs">
                                            {latestLocation.provider}
                                        </Badge>
                                        {latestLocation.activity && (
                                            <Badge variant="outline" className="text-xs">
                                                {latestLocation.activity}
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            )
                        })}

                        {locations.length === 0 && !loading && (
                            <p className="text-center text-gray-500 py-8">No location records found</p>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
