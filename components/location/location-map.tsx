"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { useWebSocket } from "@/hooks/use-websocket"
import { exportLocationData, fetchLocationHistory } from "@/lib/api"
import { formatDate, getAccuracyColor } from "@/lib/utils"
import { MapPin, Navigation, Zap } from "lucide-react"
import { useEffect, useRef, useState } from "react"

interface LocationMapProps {
    deviceId: string
    dateRange: { startDate: string; endDate: string }
    liveUpdate: boolean
}

export function LocationMap({ deviceId, dateRange, liveUpdate }: LocationMapProps) {
    const [locations, setLocations] = useState<any[]>([])
    const [selectedLocation, setSelectedLocation] = useState<any>(null)
    const [mapCenter, setMapCenter] = useState([40.7128, -74.006]) // Default to NYC
    const [zoom, setZoom] = useState(10)
    const [loading, setLoading] = useState(true)
    const [mapType, setMapType] = useState("standard")
    const [showRoute, setShowRoute] = useState(true)
    const mapRef = useRef<HTMLDivElement>(null)
    const mapInstanceRef = useRef<any>(null)
    const { lastLocationUpdate } = useWebSocket()
    const { toast } = useToast()

    useEffect(() => {
        const loadLocations = async () => {
            if (!deviceId) return

            try {
                setLoading(true)
                const response = await fetchLocationHistory(deviceId, {
                    start_date: dateRange.startDate,
                    end_date: dateRange.endDate,
                    limit: 1000,
                    accuracy_threshold: 100,
                })

                setLocations(response.data.locations || [])

                // Center map on first location
                if (response.data.locations?.length > 0) {
                    const firstLocation = response.data.locations[0]
                    setMapCenter([firstLocation.latitude, firstLocation.longitude])
                }
            } catch (error) {
                console.error("Failed to load locations:", error)
                toast({
                    title: "Error",
                    description: "Failed to load location data",
                    variant: "destructive",
                })
            } finally {
                setLoading(false)
            }
        }

        loadLocations()
    }, [deviceId, dateRange])

    // Handle live location updates
    useEffect(() => {
        if (liveUpdate && lastLocationUpdate && lastLocationUpdate.deviceId === deviceId) {
            setLocations((prev) => [lastLocationUpdate, ...prev.slice(0, 999)])
            setMapCenter([lastLocationUpdate.latitude, lastLocationUpdate.longitude])

            toast({
                title: "Location Updated",
                description: `New location received for ${deviceId}`,
            })
        }
    }, [lastLocationUpdate, deviceId, liveUpdate])

    // Initialize OpenStreetMap with Leaflet
    useEffect(() => {
        if (!mapRef.current || locations.length === 0) return

        const initMap = async () => {
            try {
                // Dynamic import to avoid SSR issues
                const L = await import("leaflet")

                // Clean up existing map
                if (mapInstanceRef.current) {
                    mapInstanceRef.current.remove()
                }

                // Initialize map
                const map = L.map(mapRef.current!).setView(mapCenter as [number, number], zoom)
                mapInstanceRef.current = map

                // Add tile layer based on map type
                const tileUrls = {
                    standard: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
                    satellite: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
                    terrain: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
                }

                L.tileLayer(tileUrls[mapType as keyof typeof tileUrls] || tileUrls.standard, {
                    attribution: mapType === "standard" ? "© OpenStreetMap contributors" : "© Various contributors",
                    maxZoom: 18,
                }).addTo(map)

                // Custom marker icons
                const createCustomIcon = (color: string, isSelected = false) => {
                    return L.divIcon({
                        className: `custom-marker ${isSelected ? "selected" : ""}`,
                        html: `<div style="background-color: ${color}; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
                        iconSize: [16, 16],
                        iconAnchor: [8, 8],
                    })
                }

                // Add location markers
                const markers: any[] = []
                locations.forEach((location, index) => {
                    const isLatest = index === 0
                    const accuracy = location.accuracy
                    let color = "#3b82f6" // blue

                    if (isLatest)
                        color = "#10b981" // green for latest
                    else if (accuracy <= 10)
                        color = "#10b981" // green for excellent accuracy
                    else if (accuracy <= 50)
                        color = "#f59e0b" // yellow for good accuracy
                    else if (accuracy > 100) color = "#ef4444" // red for poor accuracy

                    const marker = L.marker([location.latitude, location.longitude], {
                        icon: createCustomIcon(color, selectedLocation?.id === location.id),
                    }).addTo(map)

                    const popupContent = `
            <div class="p-2">
              <div class="font-semibold mb-2">${isLatest ? "Latest Location" : `Location ${locations.length - index}`}</div>
              <div class="space-y-1 text-sm">
                <div><strong>Time:</strong> ${formatDate(location.timestamp)}</div>
                <div><strong>Accuracy:</strong> <span class="${getAccuracyColor(accuracy)}">${accuracy}m</span></div>
                <div><strong>Provider:</strong> ${location.provider}</div>
                <div><strong>Activity:</strong> ${location.activity || "unknown"}</div>
                ${location.speed ? `<div><strong>Speed:</strong> ${(location.speed * 3.6).toFixed(1)} km/h</div>` : ""}
              </div>
            </div>
          `

                    marker.bindPopup(popupContent)
                    marker.on("click", () => {
                        setSelectedLocation(location)
                    })

                    markers.push(marker)
                })

                // Draw path if multiple locations and showRoute is enabled
                if (locations.length > 1 && showRoute) {
                    const latlngs = locations.reverse().map((loc) => [loc.latitude, loc.longitude])
                    const polyline = L.polyline(latlngs as [number, number][], {
                        color: "#3b82f6",
                        weight: 3,
                        opacity: 0.7,
                    }).addTo(map)

                    // Fit map to show all locations
                    map.fitBounds(polyline.getBounds(), { padding: [20, 20] })
                }

                // Map event listeners
                map.on("zoomend", () => {
                    setZoom(map.getZoom())
                })

                map.on("moveend", () => {
                    const center = map.getCenter()
                    setMapCenter([center.lat, center.lng])
                })
            } catch (error) {
                console.error("Failed to initialize map:", error)
                toast({
                    title: "Map Error",
                    description: "Failed to initialize map",
                    variant: "destructive",
                })
            }
        }

        initMap()

        return () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove()
                mapInstanceRef.current = null
            }
        }
    }, [locations, mapCenter, zoom, mapType, showRoute, selectedLocation])

    const handleExport = async (format: string) => {
        if (!deviceId) return

        try {
            const response = await exportLocationData(deviceId, {
                format,
                start_date: dateRange.startDate,
                end_date: dateRange.endDate,
                accuracy_threshold: 100,
            })

            // Handle different export formats
            if (format === "csv" || format === "gpx") {
                // Create download link
                const blob = new Blob([response], { type: format === "csv" ? "text/csv" : "application/gpx+xml" })
                const url = window.URL.createObjectURL(blob)
                const a = document.createElement("a")
                a.href = url
                a.download = `locations-${deviceId}.${format}`
                document.body.appendChild(a)
                a.click()
                document.body.removeChild(a)
                window.URL.revokeObjectURL(url)
            }

            toast({
                title: "Export Successful",
                description: `Location data exported as ${format.toUpperCase()}`,
            })
        } catch (error) {
            console.error("Export failed:", error)
            toast({
                title: "Export Failed",
                description: "Failed to export location data",
                variant: "destructive",
            })
        }
    }

    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Location Map</CardTitle>
                    <CardDescription>Loading location data...</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-96 bg-muted animate-pulse rounded" />
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <MapPin className="h-5 w-5" />
                                Location Map
                                {liveUpdate && (
                                    <Badge variant="secondary" className="ml-2">
                                        <Zap className="h-3 w-3 mr-1" />
                                        Live
                                    </Badge>
                                )}
                            </CardTitle>
                            <CardDescription>
                                {locations.length} location points
                                {locations.length > 0 && <span className="ml-2">• Latest: {formatDate(locations[0]?.timestamp)}</span>}
                            </CardDescription>
                        </div>
                        <div className="flex gap-2">
                            <Select value={mapType} onValueChange={setMapType}>
                                <SelectTrigger className="w-32">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="standard">Standard</SelectItem>
                                    <SelectItem value="satellite">Satellite</SelectItem>
                                    <SelectItem value="terrain">Terrain</SelectItem>
                                </SelectContent>
                            </Select>

                            <Button variant={showRoute ? "default" : "outline"} size="sm" onClick={() => setShowRoute(!showRoute)}>
                                <Navigation className="h-4 w-4 mr-1" />
                                Route
                            </Button>

                            <Select onValueChange={handleExport}>
                                <SelectTrigger className="w-32">
                                    <SelectValue placeholder="Export" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="json">JSON</SelectItem>
                                    <SelectItem value="csv">CSV</SelectItem>
                                    <SelectItem value="gpx">GPX</SelectItem>
                                    <SelectItem value="geojson">GeoJSON</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div ref={mapRef} className="h-96 w-full rounded-lg border bg-muted" style={{ minHeight: "400px" }}>
                        {/* Fallback content when map library isn't loaded */}
                        {locations.length === 0 && (
                            <div className="flex items-center justify-center h-full">
                                <div className="text-center">
                                    <MapPin className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                                    <p className="text-muted-foreground">No location data available</p>
                                    <p className="text-sm text-muted-foreground mt-2">Select a device and date range to view locations</p>
                                </div>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {selectedLocation && (
                <Card>
                    <CardHeader>
                        <CardTitle>Selected Location Details</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                                <p className="text-sm font-medium">Coordinates</p>
                                <p className="text-sm text-muted-foreground">
                                    {selectedLocation.latitude.toFixed(6)}, {selectedLocation.longitude.toFixed(6)}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm font-medium">Accuracy</p>
                                <p className={`text-sm ${getAccuracyColor(selectedLocation.accuracy)}`}>{selectedLocation.accuracy}m</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium">Provider</p>
                                <p className="text-sm text-muted-foreground">{selectedLocation.provider}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium">Activity</p>
                                <p className="text-sm text-muted-foreground">{selectedLocation.activity || "unknown"}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium">Timestamp</p>
                                <p className="text-sm text-muted-foreground">{formatDate(selectedLocation.timestamp)}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium">Sync Method</p>
                                <p className="text-sm text-muted-foreground">{selectedLocation.syncMethod}</p>
                            </div>
                            {selectedLocation.speed && (
                                <div>
                                    <p className="text-sm font-medium">Speed</p>
                                    <p className="text-sm text-muted-foreground">{(selectedLocation.speed * 3.6).toFixed(1)} km/h</p>
                                </div>
                            )}
                            {selectedLocation.altitude && (
                                <div>
                                    <p className="text-sm font-medium">Altitude</p>
                                    <p className="text-sm text-muted-foreground">{selectedLocation.altitude}m</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
