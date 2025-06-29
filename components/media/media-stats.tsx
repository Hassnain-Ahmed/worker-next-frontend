"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { fetchMediaAnalytics, fetchMediaStats } from "@/lib/api"
import { formatBytes, formatNumber } from "@/lib/utils"
import { Camera, Database, HardDrive, Monitor } from "lucide-react"
import { useEffect, useState } from "react"
import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Line,
    LineChart,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts"

export function MediaStats() {
    const [stats, setStats] = useState<any>(null)
    const [analytics, setAnalytics] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [timeRange, setTimeRange] = useState("30")

    useEffect(() => {
        loadStats()
    }, [timeRange])

    const loadStats = async () => {
        try {
            setLoading(true)
            const [statsResponse, analyticsResponse] = await Promise.all([
                fetchMediaStats({ days: timeRange }),
                fetchMediaAnalytics({ days: timeRange }),
            ])

            setStats(statsResponse.data)
            setAnalytics(analyticsResponse.data)
        } catch (error) {
            console.error("Failed to load media stats:", error)
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {[...Array(4)].map((_, i) => (
                    <Card key={i}>
                        <CardHeader>
                            <CardTitle>Loading...</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="h-20 bg-muted animate-pulse rounded" />
                        </CardContent>
                    </Card>
                ))}
            </div>
        )
    }

    if (!stats || !analytics) return null

    const { summary } = stats
    const pieData = [
        { name: "Images", value: summary.images, color: "#8884d8" },
        { name: "Videos", value: summary.videos, color: "#82ca9d" },
    ]

    const sourceData =
        analytics.analytics?.sourceBreakdown?.map((item: any) => ({
            name: item._id,
            count: item.count,
            size: item.totalSize,
        })) || []

    const deviceData =
        analytics.analytics?.deviceBreakdown?.slice(0, 10).map((item: any) => ({
            name: item._id.deviceModel || "Unknown",
            uploads: item.count,
            storage: item.totalSize,
        })) || []

    const uploadPatternData =
        analytics.analytics?.uploadPatterns?.map((item: any) => ({
            hour: `${item._id}:00`,
            uploads: item.count,
        })) || []

    return (
        <div className="space-y-6">
            {/* Time Range Selector */}
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Media Statistics</h3>
                <Select value={timeRange} onValueChange={setTimeRange}>
                    <SelectTrigger className="w-40">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="7">Last 7 days</SelectItem>
                        <SelectItem value="30">Last 30 days</SelectItem>
                        <SelectItem value="90">Last 90 days</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Files</CardTitle>
                        <Database className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatNumber(summary.totalFiles)}</div>
                        <p className="text-xs text-muted-foreground">
                            {summary.images} images • {summary.videos} videos
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Storage</CardTitle>
                        <HardDrive className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatBytes(summary.totalStorage)}</div>
                        <p className="text-xs text-muted-foreground">Avg: {formatBytes(summary.avgFileSize)} per file</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Camera Photos</CardTitle>
                        <Camera className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatNumber(summary.cameraPhotos)}</div>
                        <p className="text-xs text-muted-foreground">
                            {((summary.cameraPhotos / summary.totalFiles) * 100).toFixed(1)}% of total
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Screenshots</CardTitle>
                        <Monitor className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatNumber(summary.screenshots)}</div>
                        <p className="text-xs text-muted-foreground">
                            {((summary.screenshots / summary.totalFiles) * 100).toFixed(1)}% of total
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Charts */}
            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>File Types Distribution</CardTitle>
                        <CardDescription>Breakdown by media type</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                        outerRadius={80}
                                        fill="#8884d8"
                                        dataKey="value"
                                    >
                                        {pieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Upload Sources</CardTitle>
                        <CardDescription>Files by source type</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={sourceData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" />
                                    <YAxis />
                                    <Tooltip />
                                    <Bar dataKey="count" fill="#8884d8" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Top Devices</CardTitle>
                        <CardDescription>Most active devices by upload count</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={deviceData} layout="horizontal">
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis type="number" />
                                    <YAxis dataKey="name" type="category" width={100} />
                                    <Tooltip />
                                    <Bar dataKey="uploads" fill="#8884d8" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Upload Patterns</CardTitle>
                        <CardDescription>Uploads by hour of day</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={uploadPatternData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="hour" />
                                    <YAxis />
                                    <Tooltip />
                                    <Line type="monotone" dataKey="uploads" stroke="#8884d8" strokeWidth={2} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Daily Trends */}
            <Card>
                <CardHeader>
                    <CardTitle>Daily Upload Trends</CardTitle>
                    <CardDescription>Upload activity over the selected time period</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={stats.dailyTrends}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="_id.day" />
                                <YAxis />
                                <Tooltip />
                                <Line type="monotone" dataKey="count" stroke="#8884d8" strokeWidth={2} />
                                <Line type="monotone" dataKey="size" stroke="#82ca9d" strokeWidth={2} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
