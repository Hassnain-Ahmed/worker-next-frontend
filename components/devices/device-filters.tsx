"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { X } from "lucide-react"

interface DeviceFiltersProps {
    filters: {
        status: string
        sortBy: string
        sortOrder: string
    }
    onFiltersChange: (filters: any) => void
}

export function DeviceFilters({ filters, onFiltersChange }: DeviceFiltersProps) {
    const handleFilterChange = (key: string, value: string) => {
        onFiltersChange({
            ...filters,
            [key]: value,
        })
    }

    const clearFilters = () => {
        onFiltersChange({
            status: "all",
            sortBy: "lastSeen",
            sortOrder: "desc",
        })
    }

    const hasActiveFilters = filters.status !== "all"

    return (
        <Card>
            <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="status">Status</Label>
                        <Select value={filters.status} onValueChange={(value) => handleFilterChange("status", value)}>
                            <SelectTrigger>
                                <SelectValue placeholder="All statuses" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All statuses</SelectItem>
                                <SelectItem value="online">Online</SelectItem>
                                <SelectItem value="recent">Recent</SelectItem>
                                <SelectItem value="idle">Idle</SelectItem>
                                <SelectItem value="offline">Offline</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="sortBy">Sort by</Label>
                        <Select value={filters.sortBy} onValueChange={(value) => handleFilterChange("sortBy", value)}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="lastSeen">Last Seen</SelectItem>
                                <SelectItem value="firstSeen">First Seen</SelectItem>
                                <SelectItem value="deviceModel">Device Model</SelectItem>
                                <SelectItem value="totalUploads">Total Uploads</SelectItem>
                                <SelectItem value="totalStorage">Storage Used</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="sortOrder">Order</Label>
                        <Select value={filters.sortOrder} onValueChange={(value) => handleFilterChange("sortOrder", value)}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="desc">Descending</SelectItem>
                                <SelectItem value="asc">Ascending</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Actions</Label>
                        <div className="flex gap-2">
                            {hasActiveFilters && (
                                <Button variant="outline" onClick={clearFilters} className="flex items-center gap-2 bg-transparent">
                                    <X className="h-4 w-4" />
                                    Clear
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
