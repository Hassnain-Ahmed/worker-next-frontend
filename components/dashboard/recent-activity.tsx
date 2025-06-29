"use client"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useWebSocket } from "@/hooks/use-websocket"
import { fetchDashboardOverview } from "@/lib/api"
import { formatDate } from "@/lib/utils"
import { Activity, AlertCircle, MapPin, Smartphone, Upload } from "lucide-react"
import { useEffect, useState } from "react"

export function RecentActivity() {
    const [activities, setActivities] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const { lastMessage } = useWebSocket()

    useEffect(() => {
        loadActivities()
    }, [])

    // Add real-time activities from WebSocket
    useEffect(() => {
        if (lastMessage) {
            const newActivity = createActivityFromMessage(lastMessage)
            if (newActivity) {
                setActivities((prev) => [newActivity, ...prev.slice(0, 49)]) // Keep last 50
            }
        }
    }, [lastMessage])

    const loadActivities = async () => {
        try {
            const response = await fetchDashboardOverview()
            setActivities(response.data.recentActivity || [])
        } catch (error) {
            console.error("Failed to load recent activity:", error)
        } finally {
            setLoading(false)
        }
    }

    const createActivityFromMessage = (message: any) => {
        switch (message.type) {
            case "upload_notification":
                return {
                    id: Date.now(),
                    type: "upload",
                    title: "New Upload",
                    description: `${message.fileName} uploaded by ${message.deviceId}`,
                    timestamp: new Date().toISOString(),
                    deviceId: message.deviceId,
                    icon: Upload,
                }
            case "location_update":
                return {
                    id: Date.now(),
                    type: "location",
                    title: "Location Update",
                    description: `New location from ${message.deviceId}`,
                    timestamp: new Date().toISOString(),
                    deviceId: message.deviceId,
                    icon: MapPin,
                }
            case "connection":
                return {
                    id: Date.now(),
                    type: "connection",
                    title: "Device Connected",
                    description: `${message.device_id} connected`,
                    timestamp: new Date().toISOString(),
                    deviceId: message.device_id,
                    icon: Smartphone,
                }
            default:
                return null
        }
    }

    const getActivityIcon = (type: string) => {
        switch (type) {
            case "upload":
                return Upload
            case "location":
                return MapPin
            case "connection":
                return Smartphone
            case "error":
                return AlertCircle
            default:
                return Activity
        }
    }

    const getActivityBadge = (type: string) => {
        const variants = {
            upload: "default",
            location: "secondary",
            connection: "outline",
            error: "destructive",
        } as const

        return <Badge variant={variants[type as keyof typeof variants] || "secondary"}>{type}</Badge>
    }

    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                    <CardDescription>Loading recent activity...</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {[...Array(10)].map((_, i) => (
                            <div key={i} className="flex items-center space-x-4">
                                <div className="w-8 h-8 bg-muted animate-pulse rounded-full" />
                                <div className="flex-1 space-y-2">
                                    <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
                                    <div className="h-3 bg-muted animate-pulse rounded w-1/2" />
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
                <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Recent Activity
                </CardTitle>
                <CardDescription>Latest system events and updates</CardDescription>
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-96">
                    <div className="space-y-4">
                        {activities.map((activity) => {
                            const Icon = getActivityIcon(activity.type)
                            return (
                                <div key={activity.id} className="flex items-start space-x-4">
                                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted">
                                        <Icon className="h-4 w-4" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between">
                                            <p className="text-sm font-medium">{activity.title}</p>
                                            {getActivityBadge(activity.type)}
                                        </div>
                                        <p className="text-sm text-muted-foreground">{activity.description}</p>
                                        <p className="text-xs text-muted-foreground mt-1">{formatDate(activity.timestamp)}</p>
                                    </div>
                                </div>
                            )
                        })}
                        {activities.length === 0 && (
                            <div className="text-center py-8">
                                <Activity className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                                <p className="text-muted-foreground">No recent activity</p>
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    )
}
