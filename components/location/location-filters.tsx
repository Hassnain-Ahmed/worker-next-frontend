"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { fetchDevicesDashboard } from "@/lib/api"
import { X } from "lucide-react"
import { useEffect, useState } from "react"

interface LocationFiltersProps {
    selectedDevice: string
    onDeviceChange: (deviceId: string) => void
    dateRange: { startDate: string; endDate: string }
    onDateRangeChange: (range: { startDate: string; endDate: string }) => void
}

export function LocationFilters({
    selectedDevice,
    onDeviceChange,
    dateRange,
    onDateRangeChange,
}: LocationFiltersProps) {
    const [devices, setDevices] = useState<any[]>([])

    useEffect(() => {
        loadDevices()
    }, [])

    const loadDevices = async () => {
        try {
            const response = await fetchDevicesDashboard({ limit: 100 })
            setDevices(response.data.devices || [])
        } catch (error) {
            console.error("Failed to load devices:", error)
        }
    }

    const handleDateRangeChange = (key: string, value: string) => {
        onDateRangeChange({
            ...dateRange,
            [key]: value,
        })
    }

    const setQuickRange = (days: number) => {
        const endDate = new Date()
        const startDate = new Date()
        startDate.setDate(startDate.getDate() - days)

        onDateRangeChange({
            startDate: startDate.toISOString().split("T")[0],
            endDate: endDate.toISOString().split("T")[0],
        })
    }

    const clearFilters = () => {
        onDeviceChange("")
        onDateRangeChange({
            startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
            endDate: new Date().toISOString().split("T")[0],
        })
    }

    return (
        <Card>
            <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="device">Device</Label>
                        <Select value={selectedDevice} onValueChange={onDeviceChange}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select device" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All devices</SelectItem>
                                {devices.map((device) => (
                                    <SelectItem key={device.deviceId} value={device.deviceId}>
                                        {device.deviceModel} ({device.deviceId})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="startDate">Start Date</Label>
                        <Input
                            id="startDate"
                            type="date"
                            value={dateRange.startDate}
                            onChange={(e) => handleDateRangeChange("startDate", e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="endDate">End Date</Label>
                        <Input
                            id="endDate"
                            type="date"
                            value={dateRange.endDate}
                            onChange={(e) => handleDateRangeChange("endDate", e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Quick Ranges</Label>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => setQuickRange(1)}>
                                1D
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => setQuickRange(7)}>
                                7D
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => setQuickRange(30)}>
                                30D
                            </Button>
                            <Button variant="outline" size="sm" onClick={clearFilters}>
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
