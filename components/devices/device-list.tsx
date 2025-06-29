"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import { fetchDevices } from "@/lib/api"
import { formatBytes, formatDate } from "@/lib/utils"
import { Battery, MoreHorizontal, Smartphone, Wifi, WifiOff } from "lucide-react"
import { useEffect, useState } from "react"

interface DeviceListProps {
    filters: {
        status: string
        sortBy: string
        sortOrder: string
    }
    selectedDevice: string | null
    onDeviceSelect: (deviceId: string) => void
}

export function DeviceList({ filters, selectedDevice, onDeviceSelect }: DeviceListProps) {
    const [devices, setDevices] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const { toast } = useToast()

    useEffect(() => {
        loadDevices()
    }, [filters, page])

    const loadDevices = async () => {
        try {
            setLoading(true)
            const response = await fetchDevices({
                ...filters,
                page,
                limit: 20,
                sort_by: filters.sortBy,
                sort_order: filters.sortOrder,
            })

            setDevices(response.data.devices || [])
            setTotalPages(response.data.pagination?.totalPages || 1)
        } catch (error) {
            console.error("Failed to load devices:", error)
            toast({
                title: "Error",
                description: "Failed to load devices",
                variant: "destructive",
            })
        } finally {
            setLoading(false)
        }
    }

    const getDeviceStatus = (device: any) => {
        const lastSeen = new Date(device.lastSeen).getTime()
        const now = Date.now()
        const timeDiff = now - lastSeen

        if (timeDiff < 60000) return "online"
        if (timeDiff < 300000) return "recent"
        if (timeDiff < 3600000) return "idle"
        return "offline"
    }

    const getStatusBadge = (status: string) => {
        const variants = {
            online: { variant: "default" as const, label: "Online", icon: Wifi },
            recent: { variant: "secondary" as const, label: "Recent", icon: Wifi },
            idle: { variant: "outline" as const, label: "Idle", icon: WifiOff },
            offline: { variant: "destructive" as const, label: "Offline", icon: WifiOff },
        }

        const config = variants[status as keyof typeof variants] || variants.offline
        const Icon = config.icon

        return (
            <Badge variant={config.variant} className="flex items-center gap-1">
                <Icon className="h-3 w-3" />
                {config.label}
            </Badge>
        )
    }

    const getBatteryColor = (level: number) => {
        if (level > 50) return "text-green-600"
        if (level > 20) return "text-yellow-600"
        return "text-red-600"
    }

    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Devices</CardTitle>
                    <CardDescription>Loading devices...</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        {[...Array(10)].map((_, i) => (
                            <div key={i} className="h-16 bg-muted animate-pulse rounded" />
                        ))}
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Devices ({devices.length})</CardTitle>
                <CardDescription>Manage and monitor connected devices</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Device</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Last Seen</TableHead>
                                <TableHead>Battery</TableHead>
                                <TableHead>Storage</TableHead>
                                <TableHead>Uploads</TableHead>
                                <TableHead className="w-[50px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {devices.map((device) => {
                                const status = getDeviceStatus(device)
                                const isSelected = selectedDevice === device.deviceId

                                return (
                                    <TableRow
                                        key={device.deviceId}
                                        className={`cursor-pointer hover:bg-muted/50 ${isSelected ? "bg-muted" : ""}`}
                                        onClick={() => onDeviceSelect(device.deviceId)}
                                    >
                                        <TableCell>
                                            <div className="flex items-center space-x-3">
                                                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-muted">
                                                    <Smartphone className="h-4 w-4" />
                                                </div>
                                                <div>
                                                    <p className="font-medium">{device.deviceModel || "Unknown Model"}</p>
                                                    <p className="text-sm text-muted-foreground">{device.deviceId}</p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>{getStatusBadge(status)}</TableCell>
                                        <TableCell>
                                            <span className="text-sm">{formatDate(device.lastSeen)}</span>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Battery className={`h-4 w-4 ${getBatteryColor(device.batteryLevel || 0)}`} />
                                                <span className="text-sm">{device.batteryLevel || 0}%</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-sm">{formatBytes(device.totalStorage || 0)}</span>
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-sm">{device.totalUploads || 0}</span>
                                        </TableCell>
                                        <TableCell>
                                            <Button variant="ghost" size="sm">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                )
                            })}
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

                {devices.length === 0 && (
                    <div className="text-center py-8">
                        <Smartphone className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                        <p className="text-muted-foreground">No devices found</p>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
