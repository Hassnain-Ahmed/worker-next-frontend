"use client"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { fetchDashboardOverview } from "@/lib/api"
import { formatBytes, formatNumber } from "@/lib/utils"
import { Activity, Database, HardDrive, MapPin, Smartphone, TrendingUp } from "lucide-react"
import { useEffect, useState } from "react"
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

export function DashboardOverview() {
    const [data, setData] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const loadData = async () => {
            try {
                const response = await fetchDashboardOverview()
                setData(response.data)
            } catch (error) {
                console.error("Failed to load dashboard overview:", error)
            } finally {
                setLoading(false)
            }
        }

        loadData()
        const interval = setInterval(loadData, 30000) // Refresh every 30 seconds

        return () => clearInterval(interval)
    }, [])

    if (loading) {
        return (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {[...Array(4)].map((_, i) => (
                    <Card key={i}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Loading...</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="h-8 bg-muted animate-pulse rounded" />
                        </CardContent>
                    </Card>
                ))}
            </div>
        )
    }

    if (!data) return null

    const { summary } = data

    // Prepare chart data
    const uploadTrendData =
        data.trends?.uploads?.map((trend: any) => ({
            date: `${trend._id.month}/${trend._id.day}`,
            uploads: trend.uploads,
            storage: trend.storage,
        })) || []

    const locationTrendData =
        data.trends?.locations?.map((trend: any) => ({
            date: `${trend._id.month}/${trend._id.day}`,
            updates: trend.updates,
            devices: trend.deviceCount,
        })) || []

    return (
        <div className="space-y-6">
            {/* Key Metrics */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Devices</CardTitle>
                        <Smartphone className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatNumber(summary.totalDevices)}</div>
                        <p className="text-xs text-muted-foreground">
                            <span className="text-green-600">{summary.activeDevices}</span> active •{" "}
                            <span className="text-blue-600">{summary.onlineDevices}</span> online
                        </p>
                        <div className="mt-2">
                            <Progress value={(summary.activeDevices / summary.totalDevices) * 100} className="h-1" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Media Files</CardTitle>
                        <Database className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatNumber(summary.totalMedia)}</div>
                        <p className="text-xs text-muted-foreground">
                            <span className="text-blue-600">{summary.recentMedia}</span> recent uploads
                        </p>
                        <div className="flex items-center mt-2">
                            <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                            <span className="text-xs text-green-600">+12% from last week</span>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Storage Used</CardTitle>
                        <HardDrive className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatBytes(summary.totalStorage)}</div>
                        <p className="text-xs text-muted-foreground">
                            Avg: {formatBytes(summary.avgUploadsPerDevice || 0)} per device
                        </p>
                        <div className="mt-2">
                            <Progress value={65} className="h-1" />
                            <p className="text-xs text-muted-foreground mt-1">65% of quota used</p>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Location Updates</CardTitle>
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatNumber(summary.recentLocations)}</div>
                        <p className="text-xs text-muted-foreground">
                            <span className="text-green-600">{summary.websocketConnected}</span> live connections
                        </p>
                        <div className="flex items-center mt-2">
                            <Activity className="h-3 w-3 text-green-500 mr-1" />
                            <span className="text-xs text-green-600">Real-time tracking active</span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Charts */}
            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Upload Trends</CardTitle>
                        <CardDescription>Daily upload activity over the past week</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={uploadTrendData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="date" />
                                    <YAxis />
                                    <Tooltip />
                                    <Line type="monotone" dataKey="uploads" stroke="#8884d8" strokeWidth={2} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Location Activity</CardTitle>
                        <CardDescription>Location updates and active devices</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={locationTrendData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="date" />
                                    <YAxis />
                                    <Tooltip />
                                    <Bar dataKey="updates" fill="#8884d8" />
                                    <Bar dataKey="devices" fill="#82ca9d" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Top Devices */}
            <Card>
                <CardHeader>
                    <CardTitle>Top Active Devices</CardTitle>
                    <CardDescription>Most active devices by upload count and storage usage</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {data.topDevices?.slice(0, 5).map((device: any, index: number) => (
                            <div key={device.deviceId} className="flex items-center justify-between p-4 border rounded-lg">
                                <div className="flex items-center space-x-4">
                                    <Badge variant="outline">#{index + 1}</Badge>
                                    <div>
                                        <p className="text-sm font-medium">{device.deviceModel || "Unknown Model"}</p>
                                        <p className="text-xs text-muted-foreground">{device.deviceId}</p>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <div
                                            className={`h-2 w-2 rounded-full ${device.isOnline
                                                    ? "bg-green-500"
                                                    : device.lastSeen > Date.now() - 300000
                                                        ? "bg-yellow-500"
                                                        : "bg-red-500"
                                                }`}
                                        />
                                        <span className="text-xs text-muted-foreground">{device.isOnline ? "Online" : "Offline"}</span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-medium">{formatNumber(device.totalUploads)} uploads</p>
                                    <p className="text-xs text-muted-foreground">{formatBytes(device.totalStorage)}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
