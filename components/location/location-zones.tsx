"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { fetchLocationZones } from "@/lib/api"
import { formatDate, formatDistance } from "@/lib/utils"
import { Briefcase, Coffee, Home, MapPin, Navigation } from "lucide-react"
import { useEffect, useState } from "react"

interface LocationZonesProps {
    deviceId: string
    dateRange: { startDate: string; endDate: string }
}

export function LocationZones({ deviceId, dateRange }: LocationZonesProps) {
    const [zones, setZones] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [minVisits, setMinVisits] = useState(3)
    const { toast } = useToast()

    useEffect(() => {
        if (deviceId) {
            loadZones()
        }
    }, [deviceId, dateRange, minVisits])

    const loadZones = async () => {
        try {
            setLoading(true)
            const days = Math.ceil(
                (new Date(dateRange.endDate).getTime() - new Date(dateRange.startDate).getTime()) / (1000 * 60 * 60 * 24),
            )

            const response = await fetchLocationZones(deviceId, {
                days,
                min_visits: minVisits,
                radius: 100,
            })

            setZones(response.data.zones || [])
        } catch (error) {
            console.error("Failed to load location zones:", error)
            toast({
                title: "Error",
                description: "Failed to load location zones",
                variant: "destructive",
            })
        } finally {
            setLoading(false)
        }
    }

    const getZoneIcon = (visits: number) => {
        if (visits >= 20) return <Home className="h-4 w-4" />
        if (visits >= 10) return <Briefcase className="h-4 w-4" />
        if (visits >= 5) return <Coffee className="h-4 w-4" />
        return <MapPin className="h-4 w-4" />
    }

    const getZoneType = (visits: number, daysBetween: number) => {
        if (visits >= 20 && daysBetween > 7) return "Home"
        if (visits >= 10 && daysBetween > 3) return "Work"
        if (visits >= 5) return "Frequent"
        return "Visited"
    }

    const getZoneBadge = (visits: number, daysBetween: number) => {
        const type = getZoneType(visits, daysBetween)
        const variants = {
            Home: "default",
            Work: "secondary",
            Frequent: "outline",
            Visited: "secondary",
        } as const

        return <Badge variant={variants[type as keyof typeof variants]}>{type}</Badge>
    }

    if (!deviceId) {
        return (
            <Card>
                <CardContent className="text-center py-8">
                    <MapPin className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-lg font-medium mb-2">Select a Device</p>
                    <p className="text-muted-foreground">Choose a device to analyze frequently visited zones</p>
                </CardContent>
            </Card>
        )
    }

    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Frequently Visited Zones</CardTitle>
                    <CardDescription>Loading zone analysis...</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="h-20 bg-muted animate-pulse rounded" />
                        ))}
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="space-y-4">
            {/* Controls */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Zone Analysis Settings</CardTitle>
                            <CardDescription>Adjust parameters to find meaningful location patterns</CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-sm">Min visits:</span>
                            <div className="flex gap-1">
                                {[3, 5, 10].map((value) => (
                                    <Button
                                        key={value}
                                        variant={minVisits === value ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => setMinVisits(value)}
                                    >
                                        {value}
                                    </Button>
                                ))}
                            </div>
                        </div>
                    </div>
                </CardHeader>
            </Card>

            {/* Zones List */}
            <Card>
                <CardHeader>
                    <CardTitle>Frequently Visited Zones</CardTitle>
                    <CardDescription>
                        {zones.length} zones identified with {minVisits}+ visits
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {zones.length > 0 ? (
                        <div className="space-y-4">
                            {zones.map((zone, index) => {
                                const daysBetween = Math.ceil(
                                    (new Date(zone.lastVisit).getTime() - new Date(zone.firstVisit).getTime()) / (1000 * 60 * 60 * 24),
                                )

                                return (
                                    <div key={index} className="flex items-start gap-4 p-4 border rounded-lg">
                                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-muted">
                                            {getZoneIcon(zone.visits)}
                                        </div>

                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <h3 className="font-medium">Zone #{index + 1}</h3>
                                                {getZoneBadge(zone.visits, daysBetween)}
                                            </div>

                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                                <div>
                                                    <p className="font-medium">Location</p>
                                                    <p className="text-muted-foreground font-mono">
                                                        {zone.center.lat.toFixed(6)}, {zone.center.lng.toFixed(6)}
                                                    </p>
                                                </div>

                                                <div>
                                                    <p className="font-medium">Visits</p>
                                                    <p className="text-muted-foreground">{zone.visits} times</p>
                                                </div>

                                                <div>
                                                    <p className="font-medium">Duration</p>
                                                    <p className="text-muted-foreground">{formatDistance(zone.totalDuration * 1000)} total</p>
                                                </div>

                                                <div>
                                                    <p className="font-medium">Period</p>
                                                    <p className="text-muted-foreground">{daysBetween} days</p>
                                                </div>
                                            </div>

                                            <div className="mt-3 text-sm">
                                                <p className="text-muted-foreground">
                                                    <span className="font-medium">First visit:</span> {formatDate(zone.firstVisit)}
                                                </p>
                                                <p className="text-muted-foreground">
                                                    <span className="font-medium">Last visit:</span> {formatDate(zone.lastVisit)}
                                                </p>
                                                <p className="text-muted-foreground">
                                                    <span className="font-medium">Average stay:</span> {Math.round(zone.avgDuration / 60)} minutes
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex flex-col gap-2">
                                            <Button size="sm" variant="outline">
                                                <Navigation className="h-4 w-4 mr-2" />
                                                View on Map
                                            </Button>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <MapPin className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                            <p className="text-lg font-medium mb-2">No Frequent Zones Found</p>
                            <p className="text-muted-foreground">
                                Try reducing the minimum visits threshold or expanding the date range
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Zone Statistics */}
            {zones.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Zone Statistics</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                                <p className="text-sm font-medium">Total Zones</p>
                                <p className="text-2xl font-bold">{zones.length}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium">Most Visited</p>
                                <p className="text-2xl font-bold">{Math.max(...zones.map((z) => z.visits))}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium">Total Visits</p>
                                <p className="text-2xl font-bold">{zones.reduce((sum, z) => sum + z.visits, 0)}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium">Avg Duration</p>
                                <p className="text-2xl font-bold">
                                    {Math.round(zones.reduce((sum, z) => sum + z.avgDuration, 0) / zones.length / 60)}m
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
