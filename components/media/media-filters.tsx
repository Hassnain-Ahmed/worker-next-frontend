"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { fetchDevicesDashboard } from "@/lib/api"
import { Filter, Search, X } from "lucide-react"
import { useEffect, useState } from "react"

interface MediaFiltersProps {
    filters: {
        deviceId: string
        resourceType: string
        sourceType: string
        startDate: string
        endDate: string
        search: string
    }
    onFiltersChange: (filters: any) => void
}

export function MediaFilters({ filters, onFiltersChange }: MediaFiltersProps) {
    const [devices, setDevices] = useState<any[]>([])
    const [showFilters, setShowFilters] = useState(false)

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

    const handleFilterChange = (key: string, value: string) => {
        onFiltersChange({
            ...filters,
            [key]: value,
        })
    }

    const clearFilters = () => {
        onFiltersChange({
            deviceId: "",
            resourceType: "",
            sourceType: "",
            startDate: "",
            endDate: "",
            search: "",
        })
    }

    const hasActiveFilters = Object.values(filters).some((value) => value !== "")

    return (
        <Card>
            <CardContent className="pt-6">
                <div className="space-y-4">
                    {/* Search and toggle */}
                    <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search media files..."
                                value={filters.search}
                                onChange={(e) => handleFilterChange("search", e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <Button variant="outline" onClick={() => setShowFilters(!showFilters)} className="flex items-center gap-2">
                            <Filter className="h-4 w-4" />
                            Filters
                        </Button>
                        {hasActiveFilters && (
                            <Button variant="outline" onClick={clearFilters} className="flex items-center gap-2 bg-transparent">
                                <X className="h-4 w-4" />
                                Clear
                            </Button>
                        )}
                    </div>

                    {/* Advanced filters */}
                    {showFilters && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 pt-4 border-t">
                            <div className="space-y-2">
                                <Label htmlFor="device">Device</Label>
                                <Select value={filters.deviceId} onValueChange={(value) => handleFilterChange("deviceId", value)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="All devices" />
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
                                <Label htmlFor="resourceType">Type</Label>
                                <Select
                                    value={filters.resourceType}
                                    onValueChange={(value) => handleFilterChange("resourceType", value)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="All types" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All types</SelectItem>
                                        <SelectItem value="image">Images</SelectItem>
                                        <SelectItem value="video">Videos</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="sourceType">Source</Label>
                                <Select value={filters.sourceType} onValueChange={(value) => handleFilterChange("sourceType", value)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="All sources" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All sources</SelectItem>
                                        <SelectItem value="camera">Camera</SelectItem>
                                        <SelectItem value="screenshot">Screenshot</SelectItem>
                                        <SelectItem value="gallery">Gallery</SelectItem>
                                        <SelectItem value="other">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="startDate">Start Date</Label>
                                <Input
                                    id="startDate"
                                    type="date"
                                    value={filters.startDate}
                                    onChange={(e) => handleFilterChange("startDate", e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="endDate">End Date</Label>
                                <Input
                                    id="endDate"
                                    type="date"
                                    value={filters.endDate}
                                    onChange={(e) => handleFilterChange("endDate", e.target.value)}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
