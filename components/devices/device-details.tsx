"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { fetchDeviceDetails } from "@/lib/api"
import { formatBytes, formatDate, formatNumber } from "@/lib/utils"
import { Battery, HardDrive, MapPin, Settings, Smartphone, Trash2, Upload } from "lucide-react"
import { useEffect, useState } from "react"
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

interface DeviceDetailsProps {
    deviceId: string
}

export function DeviceDetails({ deviceId }: DeviceDetailsProps) {
    const [device, setDevice] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const { toast } = useToast()

    useEffect(() => {
        if (deviceId) {
            loadDeviceDetails()
        }
    }, [deviceId])

    const loadDeviceDetails = async () => {
        try {
            setLoading(true)
            const response = await fetchDeviceDetails(deviceId)
            setDevice(response.data)
        } catch (error) {
            console.error("Failed to load device details:", error)
            toast({
                title: "Error",
                description: "Failed to load device details",
                variant: "destructive",
            })
        } finally {
            setLoading(false)
        }
    }

    const getDeviceStatus = (lastSeen: string) => {
        const lastSeenTime = new Date(lastSeen).getTime()
        const now = Date.now()
        const timeDiff = now - lastSeenTime

        if (timeDiff < 60000) return { status: "online", color: "bg-green-500" }
        if (timeDiff < 300000) return { status: "recent", color: "bg-yellow-500" }
        if (timeDiff < 3600000) return { status: "idle", color: "bg-orange-500" }
        return { status: "offline", color: "bg-red-500" }
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
                    <CardTitle>Device Details</CardTitle>
                    <CardDescription>Loading device information...</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="h-20 bg-muted animate-pulse rounded" />
                        <div className="h-40 bg-muted animate-pulse rounded" />
                        <div className="h-60 bg-muted animate-pulse rounded" />
                    </div>
                </CardContent>
            </Card>
        )
    }

    if (!device) {
        return (
            <Card>
                <CardContent className="text-center py-8">
                    <Smartphone className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">Device not found</p>
                </CardContent>
            </Card>
        )
    }

    const deviceStatus = getDeviceStatus(device.lastSeen)

    // Mock activity data (in real implementation, this would come from your API)
    const activityData = [
        { date: "Mon", uploads: 12, locations: 45 },
        { date: "Tue", uploads: 8, locations: 38 },
        { date: "Wed", uploads: 15, locations: 52 },
        { date: "Thu", uploads: 10, locations: 41 },
        { date: "Fri", uploads: 18, locations: 48 },
        { date: "Sat", uploads: 6, locations: 25 },
        { date: "Sun", uploads: 4, locations: 18 },
    ]

    const storageData = [
        { type: "Images", size: device.stats?.imageStorage || 0, count: device.stats?.imageCount || 0 },
        { type: "Videos", size: device.stats?.videoStorage || 0, count: device.stats?.videoCount || 0 },
        { type: "Other", size: device.stats?.otherStorage || 0, count: device.stats?.otherCount || 0 },
    ]

    return (
        <div className="space-y-4">
            {/* Device Header */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-muted">
                                <Smartphone className="h-6 w-6" />
                            </div>
                            <div>
                                <CardTitle>{device.deviceModel || "Unknown Model"}</CardTitle>
                                <CardDescription>{device.deviceId}</CardDescription>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className={`h-3 w-3 rounded-full ${deviceStatus.color}`} />
                            <Badge variant="outline">{deviceStatus.status}</Badge>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                            <p className="text-sm font-medium">Last Seen</p>
                            <p className="text-sm text-muted-foreground">{formatDate(device.lastSeen)}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium">First Seen</p>
                            <p className="text-sm text-muted-foreground">{formatDate(device.firstSeen)}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium">App Version</p>
                            <p className="text-sm text-muted-foreground">{device.appVersion || "Unknown"}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium">OS Version</p>
                            <p className="text-sm text-muted-foreground">{device.osVersion || "Unknown"}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Device Stats */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Battery Level</CardTitle>
                        <Battery className={`h-4 w-4 ${getBatteryColor(device.batteryLevel || 0)}`} />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{device.batteryLevel || 0}%</div>
                        <Progress value={device.batteryLevel || 0} className="mt-2" />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Storage Used</CardTitle>
                        <HardDrive className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatBytes(device.totalStorage || 0)}</div>
                        <p className="text-xs text-muted-foreground mt-1">{device.stats?.totalFiles || 0} files</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Uploads</CardTitle>
                        <Upload className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatNumber(device.totalUploads || 0)}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Last: {device.lastUpload ? formatDate(device.lastUpload) : "Never"}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Location Updates</CardTitle>
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatNumber(device.totalLocations || 0)}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Last: {device.lastLocation ? formatDate(device.lastLocation) : "Never"}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Detailed Information */}
            <Card>
                <CardContent className="pt-6">
                    <Tabs defaultValue="activity" className="w-full">
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="activity">Activity</TabsTrigger>
                            <TabsTrigger value="storage">Storage</TabsTrigger>
                            <TabsTrigger value="settings">Settings</TabsTrigger>
                        </TabsList>

                        <TabsContent value="activity" className="space-y-4">
                            <div>
                                <h3 className="text-lg font-medium mb-4">Weekly Activity</h3>
                                <div className="h-80">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={activityData}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="date" />
                                            <YAxis />
                                            <Tooltip />
                                            <Bar dataKey="uploads" fill="#8884d8" name="Uploads" />
                                            <Bar dataKey="locations" fill="#82ca9d" name="Locations" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="storage" className="space-y-4">
                            <div>
                                <h3 className="text-lg font-medium mb-4">Storage Breakdown</h3>
                                <div className="space-y-4">
                                    {storageData.map((item) => (
                                        <div key={item.type} className="flex items-center justify-between p-4 border rounded-lg">
                                            <div>
                                                <p className="font-medium">{item.type}</p>
                                                <p className="text-sm text-muted-foreground">{item.count} files</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-medium">{formatBytes(item.size)}</p>
                                                <p className="text-sm text-muted-foreground">
                                                    {((item.size / (device.totalStorage || 1)) * 100).toFixed(1)}%
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="settings" className="space-y-4">
                            <div>
                                <h3 className="text-lg font-medium mb-4">Device Settings</h3>
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-sm font-medium">Device ID</p>
                                            <p className="text-sm text-muted-foreground font-mono">{device.deviceId}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium">Model</p>
                                            <p className="text-sm text-muted-foreground">{device.deviceModel || "Unknown"}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium">OS Version</p>
                                            <p className="text-sm text-muted-foreground">{device.osVersion || "Unknown"}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium">App Version</p>
                                            <p className="text-sm text-muted-foreground">{device.appVersion || "Unknown"}</p>
                                        </div>
                                    </div>

                                    <div className="flex gap-2 pt-4">
                                        <Button variant="outline">
                                            <Settings className="h-4 w-4 mr-2" />
                                            Configure
                                        </Button>
                                        <Button variant="destructive">
                                            <Trash2 className="h-4 w-4 mr-2" />
                                            Remove Device
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    )
}
