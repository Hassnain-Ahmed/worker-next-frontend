"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import { exportLocationData, fetchLocationHistory } from "@/lib/api"
import { formatDate, getAccuracyColor, getAccuracyLabel } from "@/lib/utils"
import { Clock, Download, MapPin, Navigation, Zap } from "lucide-react"
import { useEffect, useState } from "react"

interface LocationHistoryProps {
    deviceId: string
    dateRange: { startDate: string; endDate: string }
}

export function LocationHistory({ deviceId, dateRange }: LocationHistoryProps) {
    const [locations, setLocations] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const { toast } = useToast()

    useEffect(() => {
        if (deviceId) {
            loadLocations()
        }
    }, [deviceId, dateRange, page])

    const loadLocations = async () => {
        try {
            setLoading(true)
            const response = await fetchLocationHistory(deviceId, {
                start_date: dateRange.startDate,
                end_date: dateRange.endDate,
                page,
                limit: 50,
                accuracy_threshold: 200,
            })

            setLocations(response.data.locations || [])
            setTotalPages(response.data.pagination?.totalPages || 1)
        } catch (error) {
            console.error("Failed to load location history:", error)
            toast({
                title: "Error",
                description: "Failed to load location history",
                variant: "destructive",
            })
        } finally {
            setLoading(false)
        }
    }

    const handleExport = async (format: string) => {
        if (!deviceId) return

        try {
            await exportLocationData(deviceId, {
                format,
                start_date: dateRange.startDate,
                end_date: dateRange.endDate,
            })

            toast({
                title: "Export Started",
                description: `Location data export as ${format.toUpperCase()} has started`,
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

    const getSyncMethodBadge = (method: string) => {
        const variants = {
            websocket: "default",
            http: "secondary",
            batch: "outline",
        } as const

        const icons = {
            websocket: <Zap className="h-3 w-3 mr-1" />,
            http: <Navigation className="h-3 w-3 mr-1" />,
            batch: <Clock className="h-3 w-3 mr-1" />,
        }

        return (
            <Badge variant={variants[method as keyof typeof variants] || "secondary"}>
                {icons[method as keyof typeof icons]}
                {method}
            </Badge>
        )
    }

    const getActivityBadge = (activity: string) => {
        const colors = {
            still: "bg-gray-100 text-gray-800",
            walking: "bg-green-100 text-green-800",
            running: "bg-blue-100 text-blue-800",
            driving: "bg-red-100 text-red-800",
            cycling: "bg-yellow-100 text-yellow-800",
            unknown: "bg-gray-100 text-gray-600",
        }

        return (
            <span
                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${colors[activity as keyof typeof colors] || colors.unknown
                    }`}
            >
                {activity}
            </span>
        )
    }

    if (!deviceId) {
        return (
            <Card>
                <CardContent className="text-center py-8">
                    <MapPin className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-lg font-medium mb-2">Select a Device</p>
                    <p className="text-muted-foreground">Choose a device from the filters above to view its location history</p>
                </CardContent>
            </Card>
        )
    }

    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Location History</CardTitle>
                    <CardDescription>Loading location data...</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        {[...Array(10)].map((_, i) => (
                            <div key={i} className="h-12 bg-muted animate-pulse rounded" />
                        ))}
                    </div>
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
                            <CardTitle>Location History</CardTitle>
                            <CardDescription>{locations.length} location updates for selected period</CardDescription>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => handleExport("csv")}>
                                <Download className="h-4 w-4 mr-2" />
                                CSV
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => handleExport("gpx")}>
                                <Download className="h-4 w-4 mr-2" />
                                GPX
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Time</TableHead>
                                    <TableHead>Coordinates</TableHead>
                                    <TableHead>Accuracy</TableHead>
                                    <TableHead>Provider</TableHead>
                                    <TableHead>Activity</TableHead>
                                    <TableHead>Sync Method</TableHead>
                                    <TableHead>Speed</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {locations.map((location, index) => (
                                    <TableRow key={location._id || index}>
                                        <TableCell>
                                            <div className="text-sm">{formatDate(location.timestamp)}</div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-sm font-mono">
                                                {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <span className={`text-sm ${getAccuracyColor(location.accuracy)}`}>{location.accuracy}m</span>
                                                <Badge variant="outline" className="text-xs">
                                                    {getAccuracyLabel(location.accuracy)}
                                                </Badge>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="secondary">{location.provider}</Badge>
                                        </TableCell>
                                        <TableCell>{getActivityBadge(location.activity || "unknown")}</TableCell>
                                        <TableCell>{getSyncMethodBadge(location.syncMethod)}</TableCell>
                                        <TableCell>
                                            {location.speed ? (
                                                <span className="text-sm">{(location.speed * 3.6).toFixed(1)} km/h</span>
                                            ) : (
                                                <span className="text-sm text-muted-foreground">-</span>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-center gap-2 mt-4">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                                disabled={page === 1}
                            >
                                Previous
                            </Button>
                            <span className="text-sm text-muted-foreground">
                                Page {page} of {totalPages}
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                                disabled={page === totalPages}
                            >
                                Next
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
