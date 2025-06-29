"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { useToast } from "@/hooks/use-toast"
import { fetchLocationHeatmap } from "@/lib/api"
import { Layers, MapPin, Settings } from "lucide-react"
import { useEffect, useRef, useState } from "react"

interface LocationHeatmapProps {
    deviceId: string
    dateRange: { startDate: string; endDate: string }
}

export function LocationHeatmap({ deviceId, dateRange }: LocationHeatmapProps) {
    const [heatmapData, setHeatmapData] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [accuracyThreshold, setAccuracyThreshold] = useState([50])
    const [sampleRate, setSampleRate] = useState([1])
    const mapRef = useRef<HTMLDivElement>(null)
    const mapInstanceRef = useRef<any>(null)
    const { toast } = useToast()

    useEffect(() => {
        if (deviceId) {
            loadHeatmapData()
        }
    }, [deviceId, dateRange, accuracyThreshold, sampleRate])

    const loadHeatmapData = async () => {
        try {
            setLoading(true)
            const days = Math.ceil(
                (new Date(dateRange.endDate).getTime() - new Date(dateRange.startDate).getTime()) / (1000 * 60 * 60 * 24),
            )

            const response = await fetchLocationHeatmap(deviceId, {
                days,
                accuracy_threshold: accuracyThreshold[0],
                sample_rate: sampleRate[0],
            })

            setHeatmapData(response.data)
        } catch (error) {
            console.error("Failed to load heatmap data:", error)
            toast({
                title: "Error",
                description: "Failed to load heatmap data",
                variant: "destructive",
            })
        } finally {
            setLoading(false)
        }
    }

    // Initialize map with heatmap
    useEffect(() => {
        if (!mapRef.current || !heatmapData?.heatmapData?.length) return

        const initHeatmap = async () => {
            try {
                // Dynamic import to avoid SSR issues
                const L = await import("leaflet")

                // Clean up existing map
                if (mapInstanceRef.current) {
                    mapInstanceRef.current.remove()
                }

                // Calculate center from heatmap data
                const lats = heatmapData.heatmapData.map((point: any) => point.lat)
                const lngs = heatmapData.heatmapData.map((point: any) => point.lng)
                const centerLat = (Math.min(...lats) + Math.max(...lats)) / 2
                const centerLng = (Math.min(...lngs) + Math.max(...lngs)) / 2

                // Initialize map
                const map = L.map(mapRef.current!).setView([centerLat, centerLng], 12)
                mapInstanceRef.current = map

                // Add tile layer
                L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
                    attribution: "© OpenStreetMap contributors",
                    maxZoom: 18,
                }).addTo(map)

                // Create heatmap visualization using circle markers
                heatmapData.heatmapData.forEach((point: any) => {
                    const intensity = point.weight || 0.5
                    const radius = Math.max(5, intensity * 20)
                    const opacity = Math.max(0.1, intensity)

                    L.circle([point.lat, point.lng], {
                        radius: radius,
                        fillColor: getHeatmapColor(intensity),
                        color: getHeatmapColor(intensity),
                        weight: 1,
                        opacity: opacity,
                        fillOpacity: opacity * 0.6,
                    }).addTo(map)
                })

                // Fit map to show all points
                if (heatmapData.heatmapData.length > 0) {
                    const bounds = L.latLngBounds(heatmapData.heatmapData.map((point: any) => [point.lat, point.lng]))
                    map.fitBounds(bounds, { padding: [20, 20] })
                }
            } catch (error) {
                console.error("Failed to initialize heatmap:", error)
                toast({
                    title: "Map Error",
                    description: "Failed to initialize heatmap",
                    variant: "destructive",
                })
            }
        }

        initHeatmap()

        return () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove()
                mapInstanceRef.current = null
            }
        }
    }, [heatmapData])

    const getHeatmapColor = (intensity: number) => {
        // Color gradient from blue (low) to red (high)
        if (intensity < 0.2) return "#0000ff"
        if (intensity < 0.4) return "#00ffff"
        if (intensity < 0.6) return "#00ff00"
        if (intensity < 0.8) return "#ffff00"
        return "#ff0000"
    }

    if (!deviceId) {
        return (
            <Card>
                <CardContent className="text-center py-8">
                    <MapPin className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-lg font-medium mb-2">Select a Device</p>
                    <p className="text-muted-foreground">Choose a device to view location heatmap</p>
                </CardContent>
            </Card>
        )
    }

    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Location Heatmap</CardTitle>
                    <CardDescription>Loading heatmap data...</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-96 bg-muted animate-pulse rounded" />
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="space-y-4">
            {/* Controls */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Settings className="h-5 w-5" />
                        Heatmap Settings
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label>Accuracy Threshold: {accuracyThreshold[0]}m</Label>
                            <Slider
                                value={accuracyThreshold}
                                onValueChange={setAccuracyThreshold}
                                max={200}
                                min={10}
                                step={10}
                                className="w-full"
                            />
                            <p className="text-xs text-muted-foreground">
                                Only include locations with accuracy better than this threshold
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label>Sample Rate: Every {sampleRate[0]} point(s)</Label>
                            <Slider value={sampleRate} onValueChange={setSampleRate} max={10} min={1} step={1} className="w-full" />
                            <p className="text-xs text-muted-foreground">Reduce density by sampling every nth location point</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Heatmap */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <Layers className="h-5 w-5" />
                                Location Heatmap
                            </CardTitle>
                            <CardDescription>
                                {heatmapData?.totalPoints} data points • {heatmapData?.originalCount} original locations
                            </CardDescription>
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 bg-blue-500 rounded"></div>
                                <span>Low</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                                <span>Medium</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 bg-red-500 rounded"></div>
                                <span>High</span>
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div ref={mapRef} className="h-96 w-full rounded-lg border bg-muted" style={{ minHeight: "400px" }}>
                        {!heatmapData?.heatmapData?.length && (
                            <div className="flex items-center justify-center h-full">
                                <div className="text-center">
                                    <MapPin className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                                    <p className="text-muted-foreground">No location data available</p>
                                    <p className="text-sm text-muted-foreground mt-2">
                                        Try adjusting the accuracy threshold or date range
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Statistics */}
            {heatmapData && (
                <Card>
                    <CardHeader>
                        <CardTitle>Heatmap Statistics</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                                <p className="text-sm font-medium">Total Points</p>
                                <p className="text-2xl font-bold">{heatmapData.totalPoints}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium">Original Count</p>
                                <p className="text-2xl font-bold">{heatmapData.originalCount}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium">Sample Rate</p>
                                <p className="text-2xl font-bold">{heatmapData.sampleRate}x</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium">Accuracy Filter</p>
                                <p className="text-2xl font-bold">{heatmapData.accuracyThreshold}m</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
