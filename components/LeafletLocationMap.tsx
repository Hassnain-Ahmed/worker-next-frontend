"use client"

import { useMemo } from "react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Activity, BarChart3, MapPin, Navigation, Smartphone, Target, TrendingUp, Users, Wifi } from "lucide-react"
import dynamic from "next/dynamic"
import { useEffect, useState } from "react"

// Dynamically import Leaflet to avoid SSR issues
const MapContainer = dynamic(() => import("react-leaflet").then((mod) => mod.MapContainer), { ssr: false })
const TileLayer = dynamic(() => import("react-leaflet").then((mod) => mod.TileLayer), { ssr: false })
const Marker = dynamic(() => import("react-leaflet").then((mod) => mod.Marker), { ssr: false })
const Popup = dynamic(() => import("react-leaflet").then((mod) => mod.Popup), { ssr: false })
const Polyline = dynamic(() => import("react-leaflet").then((mod) => mod.Polyline), { ssr: false })

// Enhanced types based on API response
interface DeviceInfo {
    model: string | null
    brand: string | null
    osVersion: string | null
    appVersion: string
    networkType: string | null
    batteryLevel: string | null
}

interface Location {
    _id: string
    deviceId: string
    appVersion: string
    latitude: number
    longitude: number
    altitude: number
    accuracy: number
    speed: number | null
    bearing: number | null
    timestamp: string
    syncTime: string
    provider: string
    activityType: string
    source: string
    tags: string[]
    processed: boolean
    deviceInfo: DeviceInfo
    createdAt: string
    updatedAt: string
    trackingType?: string
    isSameLocation?: boolean
    syncType?: string
    __v: number
}

interface LocationsResponse {
    locations: Location[]
    pagination: {
        currentPage: number
        totalPages: number
        totalRecords: number
        hasNextPage: boolean
        hasPrevPage: boolean
    }
    statistics: {
        totalPoints: number
        averageAccuracy: number
        bestAccuracy: number
        worstAccuracy: number
        uniqueDevices: number
        providers: string[]
        activities: string[]
        trackingTypes?: string[]
        syncTypes?: string[]
        sameLocationCount?: number
        differentLocationCount?: number
        sameLocationPercentage?: number
        movementAnalysis?: {
            totalLocations: number
            sameLocation: number
            newLocations: number
            movementRate: number
        }
    }
}

interface LocationMapProps {
    apiData: LocationsResponse
}

// Utility function to calculate distance between two points using Haversine formula
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371e3 // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180
    const φ2 = (lat2 * Math.PI) / 180
    const Δφ = ((lat2 - lat1) * Math.PI) / 180
    const Δλ = ((lon2 - lon1) * Math.PI) / 180

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

    return R * c // Distance in meters
}

// Function to filter locations by proximity
const filterLocationsByProximity = (locations: Location[], proximityThreshold = 50): Location[] => {
    if (locations.length === 0) return []

    const sortedLocations = [...locations].sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    )

    const filteredLocations: Location[] = [sortedLocations[0]]

    for (let i = 1; i < sortedLocations.length; i++) {
        const currentLocation = sortedLocations[i]
        let shouldInclude = true

        for (const includedLocation of filteredLocations) {
            const distance = calculateDistance(
                currentLocation.latitude,
                currentLocation.longitude,
                includedLocation.latitude,
                includedLocation.longitude,
            )

            if (distance < proximityThreshold) {
                shouldInclude = false
                break
            }
        }

        if (shouldInclude) {
            filteredLocations.push(currentLocation)
        }
    }

    return filteredLocations
}

// Enhanced device color mapping
const getDeviceColor = (deviceId: string): string => {
    const brand = deviceId.split("_")[0]?.toLowerCase() || ""
    const colorMap: { [key: string]: string } = {
        huawei: "#FF5722",
        google: "#4CAF50",
        samsung: "#2196F3",
        xiaomi: "#FF9800",
        oneplus: "#F44336",
        oppo: "#9C27B0",
        vivo: "#673AB7",
        realme: "#00BCD4",
        motorola: "#795548",
        lg: "#607D8B",
        htc: "#E91E63",
        sony: "#3F51B5",
        nokia: "#009688",
    }
    return colorMap[brand] || "#757575"
}

// Enhanced device name formatting
const formatDeviceName = (deviceId: string): string => {
    const parts = deviceId.split("_")
    if (parts.length >= 2) {
        const brand = parts[0]
        const model = parts[1]
        return `${brand} ${model}`
    }
    return deviceId.length > 30 ? `${deviceId.substring(0, 30)}...` : deviceId
}

// Enhanced marker component with more information
const CustomMarker = ({ location }: { location: Location }) => {
    const formatTimestamp = (timestamp: string): string => {
        return new Date(timestamp).toLocaleString()
    }

    const getProviderIcon = (provider: string) => {
        switch (provider) {
            case "gps":
                return "🛰️"
            case "network":
                return "📶"
            case "fused":
                return "⚡"
            default:
                return "📍"
        }
    }

    const getActivityIcon = (activity: string) => {
        switch (activity) {
            case "walking":
                return "🚶"
            case "driving":
                return "🚗"
            case "running":
                return "🏃"
            case "cycling":
                return "🚴"
            case "still":
                return "🛑"
            default:
                return "❓"
        }
    }

    // Create custom icon using divIcon
    const createCustomIcon = () => {
        if (typeof window === "undefined") return undefined

        const L = require("leaflet")
        const color = getDeviceColor(location.deviceId)
        const isSame = location.isSameLocation

        return L.divIcon({
            className: "custom-marker",
            html: `<div style="
                background-color: ${color};
                width: ${isSame ? "12px" : "16px"};
                height: ${isSame ? "12px" : "16px"};
                border-radius: 50%;
                border: 2px solid ${isSame ? "#ff6b6b" : "white"};
                box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                opacity: ${isSame ? "0.7" : "1"};
            "></div>`,
            iconSize: [16, 16],
            iconAnchor: [8, 8],
            popupAnchor: [0, -8],
        })
    }

    return (
        <Marker position={[location.latitude, location.longitude]} icon={createCustomIcon()}>
            <Popup>
                <div className="p-3 max-w-xs">
                    <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                        <Smartphone className="w-4 h-4" />
                        {formatDeviceName(location.deviceId)}
                    </h3>

                    <div className="space-y-2 text-xs">
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <strong>Time:</strong>
                                <div>{formatTimestamp(location.timestamp)}</div>
                            </div>
                            <div>
                                <strong>Coordinates:</strong>
                                <div className="font-mono">
                                    {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <strong>Accuracy:</strong>
                                <div className="flex items-center gap-1">
                                    <Target className="w-3 h-3" />±{location.accuracy}m
                                </div>
                            </div>
                            <div>
                                <strong>Altitude:</strong>
                                <div>{location.altitude?.toFixed(1) || "N/A"}m</div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <strong>Provider:</strong>
                                <div className="flex items-center gap-1">
                                    {getProviderIcon(location.provider)}
                                    {location.provider}
                                </div>
                            </div>
                            <div>
                                <strong>Activity:</strong>
                                <div className="flex items-center gap-1">
                                    {getActivityIcon(location.activityType)}
                                    {location.activityType}
                                </div>
                            </div>
                        </div>

                        {location.speed !== undefined && location.speed !== null && location.speed > 0 && (
                            <div>
                                <strong>Speed:</strong>
                                <div>{Math.round(location.speed * 3.6)} km/h</div>
                            </div>
                        )}

                        {location.bearing !== undefined && location.bearing !== null && (
                            <div>
                                <strong>Bearing:</strong>
                                <div className="flex items-center gap-1">
                                    <Navigation className="w-3 h-3" />
                                    {Math.round(location.bearing)}°
                                </div>
                            </div>
                        )}

                        <div className="pt-2 border-t">
                            <div className="flex flex-wrap gap-1">
                                {location.trackingType && (
                                    <Badge variant="outline" className="text-xs">
                                        {location.trackingType}
                                    </Badge>
                                )}
                                {location.isSameLocation !== undefined && (
                                    <Badge variant={location.isSameLocation ? "destructive" : "default"} className="text-xs">
                                        {location.isSameLocation ? "Same Location" : "New Location"}
                                    </Badge>
                                )}
                                <Badge variant="secondary" className="text-xs">
                                    {location.source}
                                </Badge>
                            </div>
                        </div>

                        {location.deviceInfo && (
                            <div className="pt-2 border-t">
                                <strong>Device Info:</strong>
                                <div className="text-xs text-gray-600">
                                    {location.deviceInfo.brand} {location.deviceInfo.model}
                                    {location.deviceInfo.osVersion && ` • OS: ${location.deviceInfo.osVersion}`}
                                    {location.deviceInfo.batteryLevel && ` • Battery: ${location.deviceInfo.batteryLevel}%`}
                                    {location.deviceInfo.networkType && ` • Network: ${location.deviceInfo.networkType}`}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </Popup>
        </Marker>
    )
}

export default function LeafletLocationMap({ apiData }: LocationMapProps) {
    const [filteredLocations, setFilteredLocations] = useState<Location[]>([])
    const [mapCenter, setMapCenter] = useState<[number, number]>([37.4219983, -122.084])
    const [mapBounds, setMapBounds] = useState<[[number, number], [number, number]] | null>(null)
    const [isClient, setIsClient] = useState(false)
    const [uniqueDevices, setUniqueDevices] = useState<Array<{ id: string; name: string; color: string; count: number }>>(
        [],
    )
    const [showPaths, setShowPaths] = useState(false)

    // Ensure we're on the client side
    useEffect(() => {
        setIsClient(true)
    }, [])

    // Filter locations and set map bounds
    useEffect(() => {
        const filtered = filterLocationsByProximity(apiData.locations, 50)
        setFilteredLocations(filtered)

        // Extract unique devices for legend with enhanced info
        const deviceMap = new Map<string, { count: number; locations: Location[] }>()
        filtered.forEach((location) => {
            const existing = deviceMap.get(location.deviceId) || { count: 0, locations: [] }
            deviceMap.set(location.deviceId, {
                count: existing.count + 1,
                locations: [...existing.locations, location],
            })
        })

        const devices = Array.from(deviceMap.entries()).map(([deviceId, info]) => ({
            id: deviceId,
            name: formatDeviceName(deviceId),
            color: getDeviceColor(deviceId),
            count: info.count,
        }))

        setUniqueDevices(devices)

        if (filtered.length > 0) {
            // Calculate bounds to fit all locations
            const lats = filtered.map((loc) => loc.latitude)
            const lngs = filtered.map((loc) => loc.longitude)

            const minLat = Math.min(...lats)
            const maxLat = Math.max(...lats)
            const minLng = Math.min(...lngs)
            const maxLng = Math.max(...lngs)

            setMapBounds([
                [minLat, minLng],
                [maxLat, maxLng],
            ])
            setMapCenter([filtered[0].latitude, filtered[0].longitude])
        }
    }, [apiData])

    // Generate paths for each device
    const devicePaths = useMemo(() => {
        const paths: { [deviceId: string]: [number, number][] } = {}

        uniqueDevices.forEach((device) => {
            const deviceLocations = filteredLocations
                .filter((loc) => loc.deviceId === device.id)
                .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())

            paths[device.id] = deviceLocations.map((loc) => [loc.latitude, loc.longitude])
        })

        return paths
    }, [filteredLocations, uniqueDevices])

    if (!isClient) {
        return (
            <div className="w-full h-96 bg-gray-200 rounded-lg flex items-center justify-center">
                <div className="text-gray-600">Loading map...</div>
            </div>
        )
    }

    return (
        <div className="w-full space-y-6">
            {/* Enhanced Statistics Panel */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Statistics */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <BarChart3 className="w-5 h-5" />
                            Location Statistics
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="text-center">
                                <div className="text-2xl font-bold text-blue-500">{apiData.statistics.totalPoints}</div>
                                <div className="text-xs text-muted-foreground">Total Points</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-green-500">{filteredLocations.length}</div>
                                <div className="text-xs text-muted-foreground">Filtered Points</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-purple-500">{apiData.statistics.uniqueDevices}</div>
                                <div className="text-xs text-muted-foreground">Devices</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-orange-500">
                                    {apiData.statistics.averageAccuracy.toFixed(1)}m
                                </div>
                                <div className="text-xs text-muted-foreground">Avg Accuracy</div>
                            </div>
                        </div>

                        {/* Accuracy Distribution */}
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span>Accuracy Range</span>
                                <span>
                                    {apiData.statistics.bestAccuracy}m - {Math.round(apiData.statistics.worstAccuracy)}m
                                </span>
                            </div>
                            <Progress
                                value={(apiData.statistics.bestAccuracy / apiData.statistics.worstAccuracy) * 100}
                                className="h-2"
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Movement Analysis */}
                {apiData.statistics.movementAnalysis && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <TrendingUp className="w-5 h-5" />
                                Movement Analysis
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm">Movement Rate</span>
                                    <span className="font-bold text-lg">{apiData.statistics.movementAnalysis.movementRate}%</span>
                                </div>
                                <Progress value={apiData.statistics.movementAnalysis.movementRate} className="h-2" />

                                <div className="grid grid-cols-2 gap-4 text-center">
                                    <div>
                                        <div className="text-lg font-bold text-red-500">{apiData.statistics.sameLocationCount || 0}</div>
                                        <div className="text-xs text-muted-foreground">Same Location</div>
                                    </div>
                                    <div>
                                        <div className="text-lg font-bold text-green-500">
                                            {apiData.statistics.differentLocationCount || 0}
                                        </div>
                                        <div className="text-xs text-muted-foreground">New Locations</div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Device Legend */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="w-5 h-5" />
                            Device Legend
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                            {uniqueDevices.map((device) => (
                                <div key={device.id} className="flex items-center justify-between p-2 rounded hover:bg-gray-50">
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: device.color }}></div>
                                        <span className="text-sm font-medium">{device.name}</span>
                                    </div>
                                    <Badge variant="secondary" className="text-xs">
                                        {device.count}
                                    </Badge>
                                </div>
                            ))}
                        </div>

                        <div className="mt-4 pt-4 border-t">
                            <label className="flex items-center gap-2 text-sm">
                                <input
                                    type="checkbox"
                                    checked={showPaths}
                                    onChange={(e) => setShowPaths(e.target.checked)}
                                    className="rounded"
                                />
                                Show movement paths
                            </label>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Provider and Activity Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Wifi className="w-5 h-5" />
                            Providers
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {apiData.statistics.providers.map((provider) => {
                                const count = filteredLocations.filter((loc) => loc.provider === provider).length
                                const percentage = (count / filteredLocations.length) * 100
                                return (
                                    <div key={provider} className="space-y-1">
                                        <div className="flex justify-between text-sm">
                                            <span className="capitalize">{provider}</span>
                                            <span>
                                                {count} ({percentage.toFixed(1)}%)
                                            </span>
                                        </div>
                                        <Progress value={percentage} className="h-2" />
                                    </div>
                                )
                            })}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Activity className="w-5 h-5" />
                            Activities
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {apiData.statistics.activities.map((activity) => {
                                const count = filteredLocations.filter((loc) => loc.activityType === activity).length
                                const percentage = (count / filteredLocations.length) * 100
                                return (
                                    <div key={activity} className="space-y-1">
                                        <div className="flex justify-between text-sm">
                                            <span className="capitalize">{activity}</span>
                                            <span>
                                                {count} ({percentage.toFixed(1)}%)
                                            </span>
                                        </div>
                                        <Progress value={percentage} className="h-2" />
                                    </div>
                                )
                            })}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Map Container */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <MapPin className="w-5 h-5" />
                        Interactive Map
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="h-96 w-full rounded-lg overflow-hidden">
                        <MapContainer
                            center={mapCenter}
                            zoom={13}
                            bounds={mapBounds || undefined}
                            style={{ height: "100%", width: "100%" }}
                            className="z-0"
                        >
                            {/* OpenStreetMap tiles */}
                            <TileLayer
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            />

                            {/* Movement paths */}
                            {showPaths &&
                                Object.entries(devicePaths).map(([deviceId, path]) => {
                                    if (path.length < 2) return null
                                    return (
                                        <Polyline
                                            key={deviceId}
                                            positions={path}
                                            color={getDeviceColor(deviceId)}
                                            weight={3}
                                            opacity={0.7}
                                        />
                                    )
                                })}

                            {/* Render markers */}
                            {filteredLocations.map((location) => (
                                <CustomMarker key={location._id} location={location} />
                            ))}
                        </MapContainer>
                    </div>
                </CardContent>
            </Card>

            {/* Footer Info */}
            <div className="text-sm text-gray-600 space-y-1">
                <p className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Showing {filteredLocations.length} of {apiData.statistics.totalPoints} locations (filtered to exclude points
                    within 50m of each other)
                </p>
                <p className="text-xs">
                    Map data ©{" "}
                    <a href="https://www.openstreetmap.org/" className="text-blue-600 hover:underline">
                        OpenStreetMap
                    </a>{" "}
                    contributors
                </p>
                <div className="flex flex-wrap gap-2 mt-2">
                    <Badge variant="outline" className="text-xs">
                        🛰️ GPS • 📶 Network • ⚡ Fused
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                        🚶 Walking • 🚗 Driving • 🏃 Running • 🚴 Cycling • 🛑 Still
                    </Badge>
                </div>
            </div>
        </div>
    )
}
