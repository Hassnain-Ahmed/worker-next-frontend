"use client"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { fetchLocationStats } from "@/lib/api"
import { formatDuration, getAccuracyLabel } from "@/lib/utils"
import { Activity, Clock, MapPin, Target, Zap } from "lucide-react"
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

interface LocationStatsProps {
    deviceId: string
    dateRange: { startDate: string; endDate: string }
}

export function LocationStats({ deviceId, dateRange }: LocationStatsProps) {
    const [stats, setStats] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (deviceId) {
            loadStats()
        }
    }, [deviceId, dateRange])

    const loadStats = async () => {
        try {
            setLoading(true)
            const days = Math.ceil(
                (new Date(dateRange.endDate).getTime() - new Date(dateRange.startDate).getTime()) / (1000 * 60 * 60 * 24),
            )
            const response = await fetchLocationStats(deviceId, days)
            setStats(response.data)
        } catch (error) {
            console.error("Failed to load location stats:", error)
        } finally {
            setLoading(false)
        }
    }

    if (!deviceId) {
        return (
            <Card>
                <CardContent className="text-center py-8">
                    <MapPin className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-lg font-medium mb-2">Select a Device</p>
                    <p className="text-muted-foreground">Choose a device to view location statistics</p>
                </CardContent>
            </Card>
        )
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

    if (!stats) return null

    const { summary, dailyStats, movementPattern } = stats

    // Prepare chart data
    const dailyData =
        dailyStats?.map((day: any) => ({
            date: `${day._id.month}/${day._id.day}`,
            updates: day.count,
            avgAccuracy: day.avgAccuracy,
            bestAccuracy: day.bestAccuracy,
        })) || []

    const syncMethodData = [
        { name: "WebSocket", value: summary.websocketUpdates, color: "#8884d8" },
        { name: "HTTP", value: summary.httpUpdates, color: "#82ca9d" },
        { name: "Batch", value: summary.batchUpdates, color: "#ffc658" },
    ]

    const accuracyDistribution = [
        { name: "Excellent (≤10m)", value: 0, color: "#10b981" },
        { name: "Good (≤50m)", value: 0, color: "#f59e0b" },
        { name: "Fair (≤100m)", value: 0, color: "#f97316" },
        { name: "Poor (>100m)", value: 0, color: "#ef4444" },
    ]

    // Calculate accuracy distribution from movement pattern
    movementPattern?.forEach((point: any) => {
        if (point.accuracy <= 10) accuracyDistribution[0].value++
        else if (point.accuracy <= 50) accuracyDistribution[1].value++
        else if (point.accuracy <= 100) accuracyDistribution[2].value++
        else accuracyDistribution[3].value++
    })

    return (
        <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Updates</CardTitle>
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{summary.totalUpdates}</div>
                        <p className="text-xs text-muted-foreground">
                            Over{" "}
                            {Math.ceil(
                                (new Date(dateRange.endDate).getTime() - new Date(dateRange.startDate).getTime()) /
                                (1000 * 60 * 60 * 24),
                            )}{" "}
                            days
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Average Accuracy</CardTitle>
                        <Target className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{summary.avgAccuracy?.toFixed(1)}m</div>
                        <p className="text-xs text-muted-foreground">
                            Best: {summary.bestAccuracy}m • Worst: {summary.worstAccuracy}m
                        </p>
                        <div className="mt-2">
                            <Badge variant="outline">{getAccuracyLabel(summary.avgAccuracy)}</Badge>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">WebSocket Updates</CardTitle>
                        <Zap className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{summary.websocketUpdates}</div>
                        <p className="text-xs text-muted-foreground">
                            {((summary.websocketUpdates / summary.totalUpdates) * 100).toFixed(1)}% real-time
                        </p>
                        <div className="mt-2">
                            <Progress value={(summary.websocketUpdates / summary.totalUpdates) * 100} className="h-1" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Tracking Period</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {formatDuration(
                                (new Date(summary.lastUpdate).getTime() - new Date(summary.firstUpdate).getTime()) / 1000,
                            )}
                        </div>
                        <p className="text-xs text-muted-foreground">From {new Date(summary.firstUpdate).toLocaleDateString()}</p>
                    </CardContent>
                </Card>
            </div>

            {/* Charts */}
            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Daily Location Updates</CardTitle>
                        <CardDescription>Location tracking activity over time</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={dailyData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="date" />
                                    <YAxis />
                                    <Tooltip />
                                    <Line type="monotone" dataKey="updates" stroke="#8884d8" strokeWidth={2} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Sync Methods</CardTitle>
                        <CardDescription>How location updates were synchronized</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={syncMethodData}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                        outerRadius={80}
                                        fill="#8884d8"
                                        dataKey="value"
                                    >
                                        {syncMethodData.map((entry, index) => (
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
                        <CardTitle>Accuracy Distribution</CardTitle>
                        <CardDescription>Location accuracy quality breakdown</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={accuracyDistribution}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" />
                                    <YAxis />
                                    <Tooltip />
                                    <Bar dataKey="value" fill="#8884d8" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Daily Accuracy Trends</CardTitle>
                        <CardDescription>Average accuracy over time</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={dailyData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="date" />
                                    <YAxis />
                                    <Tooltip />
                                    <Line type="monotone" dataKey="avgAccuracy" stroke="#82ca9d" strokeWidth={2} />
                                    <Line type="monotone" dataKey="bestAccuracy" stroke="#8884d8" strokeWidth={2} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Provider and Activity Summary */}
            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Location Providers</CardTitle>
                        <CardDescription>Sources of location data</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {summary.providers?.map((provider: string) => (
                                <div key={provider} className="flex items-center justify-between">
                                    <Badge variant="secondary">{provider}</Badge>
                                    <span className="text-sm text-muted-foreground">Active</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Detected Activities</CardTitle>
                        <CardDescription>Movement patterns identified</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {summary.activities?.map((activity: string) => (
                                <div key={activity} className="flex items-center justify-between">
                                    <Badge variant="outline">{activity}</Badge>
                                    <Activity className="h-4 w-4 text-muted-foreground" />
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
