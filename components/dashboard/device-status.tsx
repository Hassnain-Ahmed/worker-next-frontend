"use client"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useWebSocket } from "@/hooks/use-websocket"
import { fetchDevicesDashboard } from "@/lib/api"
import { formatBytes, formatDate } from "@/lib/utils"
import { Signal, Smartphone, Wifi, WifiOff } from "lucide-react"
import { useEffect, useState } from "react"

export function DeviceStatus() {
    const [devices, setDevices] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const { connectedDevices, isConnected } = useWebSocket()

    useEffect(() => {
        loadDevices()
    }, [])

    const loadDevices = async () => {
        try {
            const response = await fetchDevicesDashboard({ limit: 20, sort_by: "lastSeen" })
            setDevices(response.data.devices || [])
        } catch (error) {
            console.error("Failed to load devices:", error)
        } finally {
            setLoading(false)
        }
    }

    const getDeviceStatus = (device: any) => {
        const lastSeen = new Date(device.lastSeen).getTime()
        const now = Date.now()
        const timeDiff = now - lastSeen

        if (timeDiff < 60000) return "online" // Less than 1 minute
        if (timeDiff < 300000) return "recent" // Less than 5 minutes
        if (timeDiff < 3600000) return "idle" // Less than 1 hour
        return "offline"
    }

    const getStatusBadge = (status: string) => {
        const variants = {
            online: { variant: "default" as const, label: "Online", color: "bg-green-500" },
            recent: { variant: "secondary" as const, label: "Recent", color: "bg-yellow-500" },
            idle: { variant: "outline" as const, label: "Idle", color: "bg-orange-500" },
            offline: { variant: "destructive" as const, label: "Offline", color: "bg-red-500" },
        }

        const config = variants[status as keyof typeof variants] || variants.offline
        return (
            <div className="flex items-center gap-2">
                <div className={`h-2 w-2 rounded-full ${config.color}`} />
                <Badge variant={config.variant}>{config.label}</Badge>
            </div>
        )
    }

    const getBatteryIcon = (level: number) => {
        if (level > 75) return "🔋"
        if (level > 50) return "🔋"
        if (level > 25) return "🪫"
        return "🪫"
    }

    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Device Status</CardTitle>
                    <CardDescription>Loading device information...</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                                <div className="flex items-center space-x-4">
                                    <div className="w-10 h-10 bg-muted animate-pulse rounded" />
                                    <div className="space-y-2">
                                        <div className="h-4 bg-muted animate-pulse rounded w-32" />
                                        <div className="h-3 bg-muted animate-pulse rounded w-24" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <Smartphone className="h-5 w-5" />
                            Device Status
                        </CardTitle>
                        <CardDescription>
                            {devices.length} devices • {connectedDevices.length} connected
                        </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                        {isConnected ? <Wifi className="h-4 w-4 text-green-500" /> : <WifiOff className="h-4 w-4 text-red-500" />}
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {devices.map((device) => {
                        const status = getDeviceStatus(device)
                        return (
                            <div key={device.deviceId} className="flex items-center justify-between p-4 border rounded-lg">
                                <div className="flex items-center space-x-4">
                                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-muted">
                                        <Smartphone className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <p className="font-medium">{device.deviceModel || "Unknown Model"}</p>
                                            {getStatusBadge(status)}
                                        </div>
                                        <p className="text-sm text-muted-foreground">{device.deviceId}</p>
                                        <p className="text-xs text-muted-foreground">Last seen: {formatDate(device.lastSeen)}</p>
                                    </div>
                                </div>

                                <div className="text-right space-y-1">
                                    <div className="flex items-center gap-2 text-sm">
                                        <Signal className="h-3 w-3" />
                                        <span>{device.totalUploads || 0} uploads</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm">
                                        <span>{getBatteryIcon(device.batteryLevel || 0)}</span>
                                        <span>{device.batteryLevel || 0}%</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground">{formatBytes(device.totalStorage || 0)}</p>
                                </div>
                            </div>
                        )
                    })}

                    {devices.length === 0 && (
                        <div className="text-center py-8">
                            <Smartphone className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                            <p className="text-muted-foreground">No devices found</p>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
