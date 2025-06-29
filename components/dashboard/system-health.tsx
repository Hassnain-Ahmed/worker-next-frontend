"use client"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { useWebSocket } from "@/hooks/use-websocket"
import { fetchDashboardOverview } from "@/lib/api"
import { Cpu, Database, HardDrive, MemoryStick, Server, Wifi } from "lucide-react"
import { useEffect, useState } from "react"
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

export function SystemHealth() {
    const [systemStats, setSystemStats] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const { isConnected } = useWebSocket()

    useEffect(() => {
        loadSystemHealth()
        const interval = setInterval(loadSystemHealth, 30000) // Update every 30 seconds
        return () => clearInterval(interval)
    }, [])

    const loadSystemHealth = async () => {
        try {
            const response = await fetchDashboardOverview()
            setSystemStats(response.data.systemHealth || {})
        } catch (error) {
            console.error("Failed to load system health:", error)
        } finally {
            setLoading(false)
        }
    }

    const getHealthStatus = (value: number, thresholds: { warning: number; critical: number }) => {
        if (value >= thresholds.critical) return { status: "critical", color: "text-red-600", bg: "bg-red-100" }
        if (value >= thresholds.warning) return { status: "warning", color: "text-yellow-600", bg: "bg-yellow-100" }
        return { status: "healthy", color: "text-green-600", bg: "bg-green-100" }
    }

    const getStatusBadge = (status: string) => {
        const variants = {
            healthy: "default",
            warning: "secondary",
            critical: "destructive",
        } as const

        return <Badge variant={variants[status as keyof typeof variants] || "secondary"}>{status}</Badge>
    }

    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>System Health</CardTitle>
                    <CardDescription>Loading system metrics...</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="p-4 border rounded-lg">
                                <div className="h-4 bg-muted animate-pulse rounded mb-2" />
                                <div className="h-8 bg-muted animate-pulse rounded" />
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        )
    }

    if (!systemStats) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>System Health</CardTitle>
                    <CardDescription>System metrics unavailable</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-8">
                        <Server className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                        <p className="text-muted-foreground">Unable to load system health data</p>
                    </div>
                </CardContent>
            </Card>
        )
    }

    // Mock system health data (in real implementation, this would come from your backend)
    const healthMetrics = {
        cpu: { value: 45, max: 100, thresholds: { warning: 70, critical: 90 } },
        memory: { value: 62, max: 100, thresholds: { warning: 80, critical: 95 } },
        disk: { value: 35, max: 100, thresholds: { warning: 80, critical: 95 } },
        database: { value: 28, max: 100, thresholds: { warning: 70, critical: 90 } },
        websocket: { value: isConnected ? 100 : 0, max: 100, thresholds: { warning: 50, critical: 0 } },
        api: { value: 98, max: 100, thresholds: { warning: 95, critical: 90 } },
    }

    const performanceData = [
        { time: "00:00", cpu: 30, memory: 45, requests: 120 },
        { time: "04:00", cpu: 25, memory: 42, requests: 80 },
        { time: "08:00", cpu: 55, memory: 58, requests: 250 },
        { time: "12:00", cpu: 65, memory: 62, requests: 320 },
        { time: "16:00", cpu: 45, memory: 55, requests: 280 },
        { time: "20:00", cpu: 40, memory: 50, requests: 200 },
    ]

    return (
        <div className="space-y-6">
            {/* Health Metrics */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Server className="h-5 w-5" />
                        System Health
                    </CardTitle>
                    <CardDescription>Real-time system performance metrics</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        <div className="p-4 border rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <Cpu className="h-4 w-4" />
                                    <span className="text-sm font-medium">CPU Usage</span>
                                </div>
                                {getStatusBadge(getHealthStatus(healthMetrics.cpu.value, healthMetrics.cpu.thresholds).status)}
                            </div>
                            <div className="space-y-2">
                                <Progress value={healthMetrics.cpu.value} className="h-2" />
                                <p className="text-2xl font-bold">{healthMetrics.cpu.value}%</p>
                            </div>
                        </div>

                        <div className="p-4 border rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <MemoryStick className="h-4 w-4" />
                                    <span className="text-sm font-medium">Memory</span>
                                </div>
                                {getStatusBadge(getHealthStatus(healthMetrics.memory.value, healthMetrics.memory.thresholds).status)}
                            </div>
                            <div className="space-y-2">
                                <Progress value={healthMetrics.memory.value} className="h-2" />
                                <p className="text-2xl font-bold">{healthMetrics.memory.value}%</p>
                            </div>
                        </div>

                        <div className="p-4 border rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <HardDrive className="h-4 w-4" />
                                    <span className="text-sm font-medium">Disk Usage</span>
                                </div>
                                {getStatusBadge(getHealthStatus(healthMetrics.disk.value, healthMetrics.disk.thresholds).status)}
                            </div>
                            <div className="space-y-2">
                                <Progress value={healthMetrics.disk.value} className="h-2" />
                                <p className="text-2xl font-bold">{healthMetrics.disk.value}%</p>
                            </div>
                        </div>

                        <div className="p-4 border rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <Database className="h-4 w-4" />
                                    <span className="text-sm font-medium">Database</span>
                                </div>
                                {getStatusBadge(
                                    getHealthStatus(healthMetrics.database.value, healthMetrics.database.thresholds).status,
                                )}
                            </div>
                            <div className="space-y-2">
                                <Progress value={healthMetrics.database.value} className="h-2" />
                                <p className="text-2xl font-bold">{healthMetrics.database.value}%</p>
                            </div>
                        </div>

                        <div className="p-4 border rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <Wifi className="h-4 w-4" />
                                    <span className="text-sm font-medium">WebSocket</span>
                                </div>
                                {getStatusBadge(
                                    getHealthStatus(healthMetrics.websocket.value, healthMetrics.websocket.thresholds).status,
                                )}
                            </div>
                            <div className="space-y-2">
                                <Progress value={healthMetrics.websocket.value} className="h-2" />
                                <p className="text-2xl font-bold">{isConnected ? "Connected" : "Disconnected"}</p>
                            </div>
                        </div>

                        <div className="p-4 border rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <Server className="h-4 w-4" />
                                    <span className="text-sm font-medium">API Health</span>
                                </div>
                                {getStatusBadge(getHealthStatus(healthMetrics.api.value, healthMetrics.api.thresholds).status)}
                            </div>
                            <div className="space-y-2">
                                <Progress value={healthMetrics.api.value} className="h-2" />
                                <p className="text-2xl font-bold">{healthMetrics.api.value}%</p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Performance Chart */}
            <Card>
                <CardHeader>
                    <CardTitle>Performance Trends</CardTitle>
                    <CardDescription>System performance over the last 24 hours</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={performanceData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="time" />
                                <YAxis />
                                <Tooltip />
                                <Line type="monotone" dataKey="cpu" stroke="#8884d8" strokeWidth={2} name="CPU %" />
                                <Line type="monotone" dataKey="memory" stroke="#82ca9d" strokeWidth={2} name="Memory %" />
                                <Line type="monotone" dataKey="requests" stroke="#ffc658" strokeWidth={2} name="Requests/min" />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>

            {/* System Information */}
            <Card>
                <CardHeader>
                    <CardTitle>System Information</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                            <p className="text-sm font-medium">Uptime</p>
                            <p className="text-2xl font-bold">7d 12h</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium">Total Requests</p>
                            <p className="text-2xl font-bold">1.2M</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium">Error Rate</p>
                            <p className="text-2xl font-bold">0.02%</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium">Avg Response</p>
                            <p className="text-2xl font-bold">45ms</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
