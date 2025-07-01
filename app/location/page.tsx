"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
    Activity,
    BarChart3,
    Battery,
    Calendar,
    ChevronLeft,
    ChevronRight,
    Clock,
    Eye,
    Filter,
    Globe,
    GridIcon,
    Highlighter,
    Info,
    List,
    MapPin,
    Navigation,
    RefreshCw,
    Search,
    Signal,
    Smartphone,
    Target,
    TrendingUp,
    Users,
    Wifi,
    X,
    Zap,
} from "lucide-react"
import { useCallback, useEffect, useMemo, useState } from "react"

// Date utility functions
const formatDate = (dateString: string, formatStr: string) => {
    const date = new Date(dateString)

    if (formatStr === "MMM d, yyyy") {
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
        return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`
    }
    if (formatStr === "h:mm a") {
        return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })
    }
    if (formatStr === "MMM d, h:mm a") {
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
        const time = date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })
        return `${months[date.getMonth()]} ${date.getDate()}, ${time}`
    }
    if (formatStr === "full") {
        return date.toLocaleString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
            second: "2-digit",
            hour12: true,
        })
    }
    if (formatStr === "yyyy-MM-dd") {
        return date.toISOString().split("T")[0]
    }
    return date.toLocaleDateString()
}

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value)

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value)
        }, delay)

        return () => {
            clearTimeout(handler)
        }
    }, [value, delay])

    return debouncedValue
}

interface LocationRecord {
    _id: string
    deviceId: string
    appVersion: string
    latitude: number
    longitude: number
    altitude?: number
    accuracy?: number
    speed?: number
    bearing?: number
    timestamp: string
    syncTime: string
    deviceInfo: {
        model?: string
        brand?: string
        osVersion?: string
        appVersion?: string
        networkType?: string
        batteryLevel?: number
    }
    provider: string
    activityType: string
    source: string
    tags: string[]
    processed: boolean
    createdAt: string
    updatedAt: string
    trackingType?: string
    isSameLocation?: boolean
    syncType?: string
}

interface LocationApiResponse {
    locations: LocationRecord[]
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
    filterOptions?: {
        trackingTypes: string[]
        syncTypes: string[]
        isSameLocationOptions: boolean[]
    }
}

interface LocationFilters {
    deviceId: string
    provider: string
    activityType: string
    trackingType: string
    isSameLocation: string
    syncType: string
    startDate: string
    endDate: string
    minAccuracy: string
    maxAccuracy: string
}

type ViewMode = "grid" | "list"

export default function LocationPage() {
    const [allLocations, setAllLocations] = useState<LocationRecord[]>([])
    const [data, setData] = useState<LocationApiResponse | null>(null)
    const [loading, setLoading] = useState(true)
    const [refetching, setRefetching] = useState(false)
    const [currentPage, setCurrentPage] = useState(1)
    const [viewMode, setViewMode] = useState<ViewMode>("list")
    const [searchQuery, setSearchQuery] = useState("")
    const [showFilters, setShowFilters] = useState(false)
    const [selectedLocation, setSelectedLocation] = useState<LocationRecord | null>(null)
    const [filters, setFilters] = useState<LocationFilters>({
        deviceId: "all",
        provider: "all",
        activityType: "all",
        trackingType: "all",
        isSameLocation: "all",
        syncType: "all",
        startDate: "",
        endDate: "",
        minAccuracy: "",
        maxAccuracy: "",
    })

    const debouncedSearchQuery = useDebounce(searchQuery, 500)

    const fetchLocations = useCallback(
        async (page = 1, isRefetch = false) => {
            try {
                if (isRefetch) {
                    setRefetching(true)
                } else {
                    setLoading(true)
                }

                const params = new URLSearchParams({
                    page: page.toString(),
                    limit: "100",
                    key: "111077",
                })

                // Add filter parameters
                if (filters.provider !== "all") params.append("provider", filters.provider)
                if (filters.activityType !== "all") params.append("activityType", filters.activityType)
                if (filters.trackingType !== "all") params.append("trackingType", filters.trackingType)
                if (filters.isSameLocation !== "all") params.append("isSameLocation", filters.isSameLocation)
                if (filters.syncType !== "all") params.append("syncType", filters.syncType)
                if (filters.startDate) params.append("startDate", filters.startDate)
                if (filters.endDate) params.append("endDate", filters.endDate)
                if (filters.minAccuracy) params.append("minAccuracy", filters.minAccuracy)
                if (filters.deviceId !== "all") params.append("deviceId", filters.deviceId)

                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/location?${params}`)
                const result = await response.json()

                if (page === 1) {
                    setAllLocations(result.locations)
                } else {
                    setAllLocations((prev) => [...prev, ...result.locations])
                }

                setData(result)
            } catch (error) {
                console.error("Error fetching locations:", error)
            } finally {
                setLoading(false)
                setRefetching(false)
            }
        },
        [filters],
    )

    // Client-side filtering and searching
    const filteredLocations = useMemo(() => {
        let filtered = [...allLocations]

        // Apply search filter
        if (debouncedSearchQuery.trim()) {
            const query = debouncedSearchQuery.toLowerCase()
            filtered = filtered.filter(
                (location) =>
                    location.deviceId.toLowerCase().includes(query) ||
                    location.provider.toLowerCase().includes(query) ||
                    location.activityType.toLowerCase().includes(query) ||
                    location.deviceInfo?.model?.toLowerCase().includes(query) ||
                    location.deviceInfo?.brand?.toLowerCase().includes(query) ||
                    location.source.toLowerCase().includes(query) ||
                    location.trackingType?.toLowerCase().includes(query) ||
                    location.syncType?.toLowerCase().includes(query),
            )
        }

        // Apply accuracy filter
        if (filters.maxAccuracy) {
            const maxAcc = Number.parseFloat(filters.maxAccuracy)
            filtered = filtered.filter((location) => (location.accuracy || 0) <= maxAcc)
        }

        return filtered
    }, [allLocations, debouncedSearchQuery, filters.maxAccuracy])

    // Pagination for filtered results
    const itemsPerPage = 20
    const totalPages = Math.ceil(filteredLocations.length / itemsPerPage)
    const paginatedLocations = filteredLocations.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

    useEffect(() => {
        fetchLocations(1)
    }, [fetchLocations])

    // Reset to first page when filters change
    useEffect(() => {
        setCurrentPage(1)
    }, [debouncedSearchQuery, filters])

    const handleRefetch = () => {
        fetchLocations(1, true)
    }

    const handleFilterChange = (key: keyof LocationFilters, value: string) => {
        setFilters((prev) => ({ ...prev, [key]: value }))
    }

    const clearFilters = () => {
        setFilters({
            deviceId: "all",
            provider: "all",
            activityType: "all",
            trackingType: "all",
            isSameLocation: "all",
            syncType: "all",
            startDate: "",
            endDate: "",
            minAccuracy: "",
            maxAccuracy: "",
        })
        setSearchQuery("")
    }

    // Helper function to format device names
    const formatDeviceName = (deviceId: string): string => {
        const parts = deviceId.split("_")

        if (parts.length >= 2) {
            const brand = parts[0]
            const model = parts[1]
            return `${brand} ${model}`
        }

        return deviceId.length > 30 ? `${deviceId.substring(0, 30)}...` : deviceId
    }

    // Helper function to get device color based on brand
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

    const getProviderIcon = (provider: string) => {
        switch (provider) {
            case "gps":
                return <Target className="h-4 w-4 text-green-500" />
            case "network":
                return <Wifi className="h-4 w-4 text-blue-500" />
            case "fused":
                return <Zap className="h-4 w-4 text-purple-500" />
            default:
                return <MapPin className="h-4 w-4 text-gray-500" />
        }
    }

    const getActivityIcon = (activity: string) => {
        switch (activity) {
            case "walking":
                return <span className="text-blue-500">🚶</span>
            case "driving":
                return <span className="text-red-500">🚗</span>
            case "running":
                return <span className="text-green-500">🏃</span>
            case "cycling":
                return <span className="text-yellow-500">🚴</span>
            case "still":
                return <span className="text-gray-500">🛑</span>
            default:
                return <Activity className="h-4 w-4 text-gray-500" />
        }
    }

    const getAccuracyColor = (accuracy?: number) => {
        if (!accuracy) return "text-gray-500"
        if (accuracy <= 10) return "text-green-500"
        if (accuracy <= 50) return "text-yellow-500"
        return "text-red-500"
    }

    const formatAccuracy = (accuracy?: number) => {
        if (!accuracy) return "Unknown"
        return `${Math.round(accuracy)}m`
    }

    const formatSpeed = (speed?: number) => {
        if (!speed) return "0 km/h"
        return `${Math.round(speed * 3.6)} km/h`
    }

    const groupLocationsByDate = (locations: LocationRecord[]) => {
        const groups: { [key: string]: LocationRecord[] } = {}
        locations?.forEach((location) => {
            const date = formatDate(location.timestamp, "yyyy-MM-dd")
            if (!groups[date]) groups[date] = []
            groups[date].push(location)
        })
        return groups
    }

    const getUniqueDevices = () => {
        const deviceMap = new Map<string, { count: number; name: string; color: string }>()

        allLocations.forEach((location) => {
            const existing = deviceMap.get(location.deviceId) || { count: 0, name: "", color: "" }
            deviceMap.set(location.deviceId, {
                count: existing.count + 1,
                name: formatDeviceName(location.deviceId),
                color: getDeviceColor(location.deviceId),
            })
        })

        return Array.from(deviceMap.entries()).map(([deviceId, info]) => ({
            id: deviceId,
            name: info.name,
            count: info.count,
            color: info.color,
        }))
    }

    const DetailModal = ({
        location,
        open,
        onClose,
    }: { location: LocationRecord; open: boolean; onClose: () => void }) => (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="w-full max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <MapPin className="h-5 w-5" />
                        Enhanced Location Details
                    </DialogTitle>
                </DialogHeader>

                <div className="grid grid-cols-1 gap-6">
                    {/* Map Preview */}
                    <div className="space-y-4">
                        <Card>
                            <CardContent className="p-4">
                                <div className="rounded-lg overflow-hidden">
                                    <iframe
                                        width="100%"
                                        height="400"
                                        style={{ border: 0 }}
                                        loading="lazy"
                                        allowFullScreen
                                        src={`https://www.google.com/maps?q=${location.latitude},${location.longitude}&hl=en&z=16&output=embed`}
                                    />
                                </div>

                                <div className="flex gap-2 mt-4">
                                    <Button asChild className="flex-1">
                                        <a
                                            href={`https://www.google.com/maps?q=${location.latitude},${location.longitude}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            <Globe className="h-4 w-4 mr-2" />
                                            Open in Maps
                                        </a>
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            navigator.clipboard.writeText(`${location.latitude},${location.longitude}`)
                                        }}
                                    >
                                        <MapPin className="h-4 w-4 mr-2" />
                                        Copy Coords
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Enhanced Quick Stats */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <BarChart3 className="h-5 w-5" />
                                    Location Analytics
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <div className="font-medium text-muted-foreground">Accuracy</div>
                                        <div className={`font-mono text-lg ${getAccuracyColor(location.accuracy)}`}>
                                            {formatAccuracy(location.accuracy)}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="font-medium text-muted-foreground">Provider</div>
                                        <div className="flex items-center gap-1">
                                            {getProviderIcon(location.provider)}
                                            <span className="capitalize">{location.provider}</span>
                                        </div>
                                    </div>
                                    {location.speed !== undefined && (
                                        <div>
                                            <div className="font-medium text-muted-foreground">Speed</div>
                                            <div className="text-lg font-mono">{formatSpeed(location.speed)}</div>
                                        </div>
                                    )}
                                    {location.altitude !== undefined && (
                                        <div>
                                            <div className="font-medium text-muted-foreground">Altitude</div>
                                            <div className="text-lg font-mono">{Math.round(location.altitude)}m</div>
                                        </div>
                                    )}
                                    {location.bearing !== undefined && (
                                        <div>
                                            <div className="font-medium text-muted-foreground">Bearing</div>
                                            <div className="flex items-center gap-1">
                                                <Navigation className="h-4 w-4" />
                                                <span className="text-lg font-mono">{Math.round(location.bearing)}°</span>
                                            </div>
                                        </div>
                                    )}
                                    <div>
                                        <div className="font-medium text-muted-foreground">Activity</div>
                                        <div className="flex items-center gap-1">
                                            {getActivityIcon(location.activityType)}
                                            <span className="capitalize">{location.activityType}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Enhanced tracking info */}
                                {(location.trackingType || location.isSameLocation !== undefined) && (
                                    <div className="pt-3 border-t">
                                        <div className="font-medium text-muted-foreground mb-2">Tracking Info</div>
                                        <div className="flex flex-wrap gap-2">
                                            {location.trackingType && <Badge variant="outline">{location.trackingType}</Badge>}
                                            {location.isSameLocation !== undefined && (
                                                <Badge variant={location.isSameLocation ? "destructive" : "default"}>
                                                    {location.isSameLocation ? "Same Location" : "New Location"}
                                                </Badge>
                                            )}
                                            {location.syncType && <Badge variant="secondary">{location.syncType}</Badge>}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Enhanced Details */}
                    <div className="space-y-4">
                        {/* Coordinates */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <Globe className="h-5 w-5" />
                                    Coordinates
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="grid grid-cols-1 gap-3 text-sm">
                                    <div>
                                        <div className="font-medium text-muted-foreground">Latitude</div>
                                        <div className="font-mono text-lg">{location.latitude.toFixed(8)}</div>
                                    </div>
                                    <div>
                                        <div className="font-medium text-muted-foreground">Longitude</div>
                                        <div className="font-mono text-lg">{location.longitude.toFixed(8)}</div>
                                    </div>
                                    <div>
                                        <div className="font-medium text-muted-foreground">Full Coordinates</div>
                                        <div className="font-mono text-xs break-all bg-muted p-2 rounded">
                                            {location.latitude.toFixed(8)}, {location.longitude.toFixed(8)}
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Enhanced Device Information */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <Smartphone className="h-5 w-5" />
                                    Device Information
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <div className="font-medium text-muted-foreground">Device</div>
                                        <div className="flex items-center gap-2">
                                            <div
                                                className="w-3 h-3 rounded-full"
                                                style={{ backgroundColor: getDeviceColor(location.deviceId) }}
                                            ></div>
                                            <span>{formatDeviceName(location.deviceId)}</span>
                                        </div>
                                    </div>
                                    <div>
                                        <div className="font-medium text-muted-foreground">App Version</div>
                                        <div>{location.appVersion}</div>
                                    </div>
                                    <div>
                                        <div className="font-medium text-muted-foreground">Brand</div>
                                        <div>{location.deviceInfo?.brand || "Unknown"}</div>
                                    </div>
                                    <div>
                                        <div className="font-medium text-muted-foreground">Model</div>
                                        <div>{location.deviceInfo?.model || "Unknown"}</div>
                                    </div>
                                    <div>
                                        <div className="font-medium text-muted-foreground">OS Version</div>
                                        <div>{location.deviceInfo?.osVersion || "Unknown"}</div>
                                    </div>
                                    <div>
                                        <div className="font-medium text-muted-foreground">Network</div>
                                        <div className="flex items-center gap-1">
                                            {location.deviceInfo?.networkType === "wifi" ? (
                                                <Wifi className="h-4 w-4" />
                                            ) : (
                                                <Signal className="h-4 w-4" />
                                            )}
                                            {location.deviceInfo?.networkType || "Unknown"}
                                        </div>
                                    </div>
                                    {location.deviceInfo?.batteryLevel !== undefined && (
                                        <div>
                                            <div className="font-medium text-muted-foreground">Battery Level</div>
                                            <div className="flex items-center gap-2">
                                                <Battery className="h-4 w-4" />
                                                <span>{location.deviceInfo.batteryLevel}%</span>
                                                <Progress value={location.deviceInfo.batteryLevel} className="h-2 flex-1" />
                                            </div>
                                        </div>
                                    )}
                                    <div>
                                        <div className="font-medium text-muted-foreground">Source</div>
                                        <div>{location.source}</div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Enhanced Timestamps */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <Clock className="h-5 w-5" />
                                    Timestamps
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="space-y-2 text-sm">
                                    <div>
                                        <div className="font-medium text-muted-foreground">Location Timestamp</div>
                                        <div>{formatDate(location.timestamp, "full")}</div>
                                    </div>
                                    <div>
                                        <div className="font-medium text-muted-foreground">Sync Time</div>
                                        <div>{formatDate(location.syncTime, "full")}</div>
                                    </div>
                                    <div>
                                        <div className="font-medium text-muted-foreground">Created</div>
                                        <div>{formatDate(location.createdAt, "full")}</div>
                                    </div>
                                    <div>
                                        <div className="font-medium text-muted-foreground">Updated</div>
                                        <div>{formatDate(location.updatedAt, "full")}</div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Enhanced Metadata */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <Activity className="h-5 w-5" />
                                    Enhanced Metadata
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="flex flex-wrap gap-2">
                                    <Badge variant={location.processed ? "default" : "secondary"}>
                                        {location.processed ? "Processed" : "Pending"}
                                    </Badge>

                                    <Badge className="bg-blue-500/90 hover:bg-blue-500 text-white">
                                        {getProviderIcon(location.provider)}
                                        <span className="ml-1">{location.provider}</span>
                                    </Badge>

                                    <Badge className="bg-green-500/90 hover:bg-green-500 text-white">
                                        {getActivityIcon(location.activityType)}
                                        <span className="ml-1">{location.activityType}</span>
                                    </Badge>

                                    {location.trackingType && (
                                        <Badge variant="outline">
                                            <TrendingUp className="h-3 w-3 mr-1" />
                                            {location.trackingType}
                                        </Badge>
                                    )}

                                    {location.isSameLocation !== undefined && (
                                        <Badge variant={location.isSameLocation ? "destructive" : "default"}>
                                            {location.isSameLocation ? "🔄 Same Location" : "📍 New Location"}
                                        </Badge>
                                    )}

                                    {location.syncType && (
                                        <Badge variant="secondary">
                                            <Zap className="h-3 w-3 mr-1" />
                                            {location.syncType}
                                        </Badge>
                                    )}
                                </div>

                                {location.tags.length > 0 && (
                                    <div>
                                        <div className="font-medium text-muted-foreground text-sm">Tags</div>
                                        <div className="flex flex-wrap gap-1 mt-1">
                                            {location.tags.map((tag, index) => (
                                                <Badge key={index} variant="outline" className="text-xs">
                                                    {tag}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )

    const LocationCard = ({ location }: { location: LocationRecord }) => (
        <Card className="group overflow-hidden hover:shadow-lg transition-all duration-200 border-0 shadow-md">
            <CardContent className="p-4">
                <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-2">
                            {getProviderIcon(location.provider)}
                            <span className="font-medium text-sm">{location.provider}</span>
                            <Badge variant="outline" className="text-xs">
                                {getActivityIcon(location.activityType)}
                                <span className="ml-1">{location.activityType}</span>
                            </Badge>
                            {location.isSameLocation !== undefined && (
                                <Badge variant={location.isSameLocation ? "destructive" : "default"} className="text-xs">
                                    {location.isSameLocation ? "Same" : "New"}
                                </Badge>
                            )}
                        </div>

                        <div className="text-xs text-muted-foreground space-y-1">
                            <div className="flex items-center gap-1">
                                <Globe className="h-3 w-3" />
                                <span className="font-mono">
                                    {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                                </span>
                            </div>
                            <div className="flex items-center gap-1">
                                <Target className="h-3 w-3" />
                                <span className={getAccuracyColor(location.accuracy)}>{formatAccuracy(location.accuracy)}</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatDate(location.timestamp, "MMM d, h:mm a")}
                            </div>
                        </div>

                        <div className="text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                                <div
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: getDeviceColor(location.deviceId) }}
                                ></div>
                                <Smartphone className="h-3 w-3" />
                                {formatDeviceName(location.deviceId)}
                            </div>
                        </div>

                        {/* Enhanced tracking info */}
                        {location.trackingType && (
                            <div className="flex flex-wrap gap-1">
                                <Badge variant="outline" className="text-xs">
                                    {location.trackingType}
                                </Badge>
                                {location.syncType && (
                                    <Badge variant="secondary" className="text-xs">
                                        {location.syncType}
                                    </Badge>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col items-end gap-2">
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => setSelectedLocation(location)}>
                            <Info className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0" asChild>
                            <a
                                href={`https://www.google.com/maps?q=${location.latitude},${location.longitude}`}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <Eye className="h-4 w-4" />
                            </a>
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    )

    const LocationListItem = ({ location }: { location: LocationRecord }) => (
        <Card className="group hover:shadow-md transition-all duration-200">
            <CardContent className="p-4">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 flex-shrink-0">
                        {getProviderIcon(location.provider)}
                        <div className="text-sm">
                            <div className="flex items-center gap-2">
                                {getActivityIcon(location.activityType)}
                                <div
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: getDeviceColor(location.deviceId) }}
                                ></div>
                                <span className="font-medium">{formatDeviceName(location.deviceId)}</span>
                                {location.isSameLocation !== undefined && (
                                    <Badge variant={location.isSameLocation ? "destructive" : "default"} className="text-xs">
                                        {location.isSameLocation ? "Same" : "New"}
                                    </Badge>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0 flex-1">
                                <div className="font-mono text-sm">
                                    {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                                </div>
                                <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1 flex-wrap">
                                    <div className="flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        {formatDate(location.timestamp, "MMM d, h:mm a")}
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Target className="h-3 w-3" />
                                        <span className={getAccuracyColor(location.accuracy)}>{formatAccuracy(location.accuracy)}</span>
                                    </div>
                                    {location.speed !== undefined && location.speed > 0 && (
                                        <div className="flex items-center gap-1">
                                            <Highlighter className="h-3 w-3" />
                                            {formatSpeed(location.speed)}
                                        </div>
                                    )}
                                    {location.trackingType && (
                                        <Badge variant="outline" className="text-xs">
                                            {location.trackingType}
                                        </Badge>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-1 flex-shrink-0">
                                <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => setSelectedLocation(location)}>
                                    <Info className="h-4 w-4" />
                                </Button>
                                <Button size="sm" variant="ghost" className="h-8 w-8 p-0" asChild>
                                    <a
                                        href={`https://www.google.com/maps?q=${location.latitude},${location.longitude}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        <Eye className="h-4 w-4" />
                                    </a>
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )

    if (loading) {
        return (
            <div className="container mx-auto p-4 sm:p-6">
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            </div>
        )
    }

    if (!data) {
        return (
            <div className="container mx-auto p-4 sm:p-6">
                <div className="text-center text-muted-foreground">No location data available</div>
            </div>
        )
    }

    const groupedLocations = groupLocationsByDate(paginatedLocations)
    const hasActiveFilters = Object.values(filters).some((value) => value !== "all" && value !== "")
    const uniqueDevices = getUniqueDevices()

    return (
        <div className="container mx-auto p-4 sm:p-6 space-y-6 sm:space-y-8">
            {/* Enhanced Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <h1 className="text-2xl sm:text-3xl font-bold">Enhanced Location Tracking</h1>
                    <Badge variant="secondary" className="text-sm px-3 py-1">
                        <MapPin className="h-4 w-4 mr-1" />
                        {filteredLocations.length} of {allLocations.length}
                    </Badge>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRefetch}
                        disabled={refetching}
                        className="flex items-center gap-2"
                    >
                        <RefreshCw className={`h-4 w-4 ${refetching ? "animate-spin" : ""}`} />
                        <span className="hidden sm:inline">Refresh</span>
                    </Button>

                    <div className="flex items-center gap-1 border rounded-lg p-1">
                        <Button
                            variant={viewMode === "grid" ? "secondary" : "ghost"}
                            size="sm"
                            onClick={() => setViewMode("grid")}
                            className="h-8 w-8 p-0"
                        >
                            <GridIcon className="h-4 w-4" />
                        </Button>
                        <Button
                            variant={viewMode === "list" ? "secondary" : "ghost"}
                            size="sm"
                            onClick={() => setViewMode("list")}
                            className="h-8 w-8 p-0"
                        >
                            <List className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>

            {/* Enhanced Statistics */}
            {data.statistics && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-100 rounded-lg">
                                    <MapPin className="h-5 w-5 text-blue-600" />
                                </div>
                                <div>
                                    <div className="text-2xl font-bold text-blue-600">{data.statistics.totalPoints}</div>
                                    <div className="text-sm text-muted-foreground">Total Points</div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-green-100 rounded-lg">
                                    <Users className="h-5 w-5 text-green-600" />
                                </div>
                                <div>
                                    <div className="text-2xl font-bold text-green-600">{data.statistics.uniqueDevices}</div>
                                    <div className="text-sm text-muted-foreground">Devices</div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-purple-100 rounded-lg">
                                    <Target className="h-5 w-5 text-purple-600" />
                                </div>
                                <div>
                                    <div className="text-2xl font-bold text-purple-600">
                                        {data.statistics.averageAccuracy.toFixed(1)}m
                                    </div>
                                    <div className="text-sm text-muted-foreground">Avg Accuracy</div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {data.statistics.movementAnalysis && (
                        <Card>
                            <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-orange-100 rounded-lg">
                                        <TrendingUp className="h-5 w-5 text-orange-600" />
                                    </div>
                                    <div>
                                        <div className="text-2xl font-bold text-orange-600">
                                            {data.statistics.movementAnalysis.movementRate}%
                                        </div>
                                        <div className="text-sm text-muted-foreground">Movement Rate</div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            )}

            {/* Enhanced Movement Analysis */}
            {data.statistics.movementAnalysis && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <BarChart3 className="h-5 w-5" />
                            Movement Analysis Dashboard
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span>Same Location Events</span>
                                    <span>{data.statistics.sameLocationCount || 0}</span>
                                </div>
                                <Progress value={data.statistics.sameLocationPercentage || 0} className="h-2" />
                                <div className="text-xs text-muted-foreground">
                                    {data.statistics.sameLocationPercentage || 0}% of total locations
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span>New Location Events</span>
                                    <span>{data.statistics.differentLocationCount || 0}</span>
                                </div>
                                <Progress value={100 - (data.statistics.sameLocationPercentage || 0)} className="h-2" />
                                <div className="text-xs text-muted-foreground">
                                    {100 - (data.statistics.sameLocationPercentage || 0)}% of total locations
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span>Movement Rate</span>
                                    <span>{data.statistics.movementAnalysis.movementRate}%</span>
                                </div>
                                <Progress value={data.statistics.movementAnalysis.movementRate} className="h-2" />
                                <div className="text-xs text-muted-foreground">Device mobility indicator</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Enhanced Search and Filters */}
            <Card className="border-0 shadow-md">
                <CardContent className="p-4 sm:p-6 space-y-4">
                    {/* Search Bar */}
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search locations... (device, provider, activity, tracking type, etc.)"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowFilters(!showFilters)}
                            className="flex items-center gap-2"
                        >
                            <Filter className="h-4 w-4" />
                            <span className="hidden sm:inline">Enhanced Filters</span>
                        </Button>
                    </div>

                    {/* Enhanced Filters */}
                    {showFilters && (
                        <div className="pt-4 border-t space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                {/* Device Filter */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Device</label>
                                    <Select value={filters.deviceId} onValueChange={(value) => handleFilterChange("deviceId", value)}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Devices</SelectItem>
                                            {uniqueDevices.map((device) => (
                                                <SelectItem key={device.id} value={device.id}>
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: device.color }}></div>
                                                        <span>
                                                            {device.name} ({device.count})
                                                        </span>
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Provider Filter */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Provider</label>
                                    <Select value={filters.provider} onValueChange={(value) => handleFilterChange("provider", value)}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Providers</SelectItem>
                                            {data?.statistics.providers.map((provider) => (
                                                <SelectItem key={provider} value={provider}>
                                                    <div className="flex items-center gap-2">
                                                        {getProviderIcon(provider)}
                                                        <span className="capitalize">{provider}</span>
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Activity Filter */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Activity</label>
                                    <Select
                                        value={filters.activityType}
                                        onValueChange={(value) => handleFilterChange("activityType", value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Activities</SelectItem>
                                            {data?.statistics.activities.map((activity) => (
                                                <SelectItem key={activity} value={activity}>
                                                    <div className="flex items-center gap-2">
                                                        {getActivityIcon(activity)}
                                                        <span className="capitalize">{activity}</span>
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Tracking Type Filter */}
                                {data?.statistics.trackingTypes && (
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Tracking Type</label>
                                        <Select
                                            value={filters.trackingType}
                                            onValueChange={(value) => handleFilterChange("trackingType", value)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All Types</SelectItem>
                                                {data.statistics.trackingTypes.map((type) => (
                                                    <SelectItem key={type} value={type}>
                                                        <div className="flex items-center gap-2">
                                                            <TrendingUp className="h-4 w-4" />
                                                            <span>{type}</span>
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}
                            </div>

                            {/* Second row of filters */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                {/* Same Location Filter */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Location Status</label>
                                    <Select
                                        value={filters.isSameLocation}
                                        onValueChange={(value) => handleFilterChange("isSameLocation", value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Locations</SelectItem>
                                            <SelectItem value="true">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-red-500">🔄</span>
                                                    Same Location
                                                </div>
                                            </SelectItem>
                                            <SelectItem value="false">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-green-500">📍</span>
                                                    New Location
                                                </div>
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Sync Type Filter */}
                                {data?.statistics.syncTypes && (
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Sync Type</label>
                                        <Select value={filters.syncType} onValueChange={(value) => handleFilterChange("syncType", value)}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All Sync Types</SelectItem>
                                                {data.statistics.syncTypes.map((type) => (
                                                    <SelectItem key={type} value={type}>
                                                        <div className="flex items-center gap-2">
                                                            <Zap className="h-4 w-4" />
                                                            <span>{type}</span>
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}

                                {/* Date Range */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Start Date</label>
                                    <Input
                                        type="date"
                                        value={filters.startDate}
                                        onChange={(e) => handleFilterChange("startDate", e.target.value)}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium">End Date</label>
                                    <Input
                                        type="date"
                                        value={filters.endDate}
                                        onChange={(e) => handleFilterChange("endDate", e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* Accuracy Range */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Min Accuracy (meters)</label>
                                    <Input
                                        type="number"
                                        placeholder="0"
                                        value={filters.minAccuracy}
                                        onChange={(e) => handleFilterChange("minAccuracy", e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Max Accuracy (meters)</label>
                                    <Input
                                        type="number"
                                        placeholder="100"
                                        value={filters.maxAccuracy}
                                        onChange={(e) => handleFilterChange("maxAccuracy", e.target.value)}
                                    />
                                </div>
                            </div>

                            {hasActiveFilters && (
                                <div className="flex justify-between items-center pt-4 border-t">
                                    <div className="flex flex-wrap gap-2">
                                        {Object.entries(filters).map(([key, value]) => {
                                            if (value && value !== "all") {
                                                return (
                                                    <Badge key={key} variant="secondary" className="text-xs">
                                                        {key}: {value}
                                                    </Badge>
                                                )
                                            }
                                            return null
                                        })}
                                    </div>
                                    <Button variant="outline" size="sm" onClick={clearFilters} className="flex items-center gap-2">
                                        <X className="h-4 w-4" />
                                        Clear All Filters
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Content */}
            <div className="space-y-8 sm:space-y-10">
                {Object.entries(groupedLocations).map(([date, locations]) => (
                    <div key={date} className="space-y-4 sm:space-y-6">
                        <div className="flex items-center gap-3 pb-2 border-b">
                            <Calendar className="h-5 w-5 text-primary" />
                            <h2 className="text-xl sm:text-2xl font-semibold">{formatDate(locations[0].timestamp, "MMM d, yyyy")}</h2>
                            <Badge variant="outline" className="ml-2">
                                {locations.length} points
                            </Badge>

                            {/* Daily stats */}
                            <div className="ml-auto flex gap-2">
                                {locations.some((loc) => loc.isSameLocation) && (
                                    <Badge variant="destructive" className="text-xs">
                                        {locations.filter((loc) => loc.isSameLocation).length} same
                                    </Badge>
                                )}
                                {locations.some((loc) => !loc.isSameLocation) && (
                                    <Badge variant="default" className="text-xs">
                                        {locations.filter((loc) => !loc.isSameLocation).length} new
                                    </Badge>
                                )}
                            </div>
                        </div>

                        {viewMode === "grid" ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                                {locations.map((location) => (
                                    <LocationCard key={location._id} location={location} />
                                ))}
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {locations.map((location) => (
                                    <LocationListItem key={location._id} location={location} />
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Enhanced Pagination */}
            {totalPages > 1 && (
                <Card className="border-0 shadow-md">
                    <CardContent className="p-4 sm:p-6">
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="text-sm text-muted-foreground flex items-center gap-2">
                                <MapPin className="h-4 w-4" />
                                Page {currentPage} of {totalPages} ({filteredLocations.length} locations)
                                {hasActiveFilters && (
                                    <Badge variant="outline" className="ml-2">
                                        Filtered
                                    </Badge>
                                )}
                            </div>

                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage((prev) => prev - 1)}
                                    disabled={currentPage === 1}
                                    className="flex items-center gap-1"
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                    <span className="hidden sm:inline">Previous</span>
                                </Button>

                                <div className="flex items-center gap-1">
                                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                        const pageNum = i + 1
                                        return (
                                            <Button
                                                key={pageNum}
                                                variant={currentPage === pageNum ? "default" : "outline"}
                                                size="sm"
                                                onClick={() => setCurrentPage(pageNum)}
                                                className="w-8 h-8 p-0"
                                            >
                                                {pageNum}
                                            </Button>
                                        )
                                    })}
                                </div>

                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage((prev) => prev + 1)}
                                    disabled={currentPage === totalPages}
                                    className="flex items-center gap-1"
                                >
                                    <span className="hidden sm:inline">Next</span>
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Detail Modal */}
            {selectedLocation && (
                <DetailModal location={selectedLocation} open={!!selectedLocation} onClose={() => setSelectedLocation(null)} />
            )}
        </div>
    )
}
