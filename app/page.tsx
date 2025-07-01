"use client"

import LeafletLocationMap from "@/components/LeafletLocationMap"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Activity,
  BarChart3,
  Calendar,
  Filter,
  MapPin,
  Navigation,
  RefreshCw,
  Smartphone,
  Target,
  TrendingUp,
  Users,
  X,
} from "lucide-react"
import { useEffect, useMemo, useState } from "react"

// Enhanced types based on API response
interface DeviceInfo {
  model: string | null
  brand: string | null
  osVersion: string | null
  appVersion: string
  networkType: string | null
  batteryLevel: string | null
}

interface Location {
  _id: string
  deviceId: string
  appVersion: string
  latitude: number
  longitude: number
  altitude: number
  accuracy: number
  speed: number | null
  bearing: number | null
  timestamp: string
  syncTime: string
  provider: string
  activityType: string
  source: string
  tags: string[]
  processed: boolean
  deviceInfo: DeviceInfo
  createdAt: string
  updatedAt: string
  trackingType?: string
  isSameLocation?: boolean
  syncType?: string
  __v: number
}

interface LocationsResponse {
  locations: Location[]
  pagination: {
    currentPage: number
    totalPages: number
    totalRecords: number
    hasNextPage: boolean
    hasPrevPage: boolean
  }
  statistics: {
    totalPoints: number
    averageAccuracy: number
    bestAccuracy: number
    worstAccuracy: number
    uniqueDevices: number
    providers: string[]
    activities: string[]
    trackingTypes?: string[]
    syncTypes?: string[]
    sameLocationCount?: number
    differentLocationCount?: number
    sameLocationPercentage?: number
    movementAnalysis?: {
      totalLocations: number
      sameLocation: number
      newLocations: number
      movementRate: number
    }
  }
  filterOptions?: {
    trackingTypes: string[]
    syncTypes: string[]
    isSameLocationOptions: boolean[]
  }
}

interface ParsedDevice {
  deviceId: string
  brand: string
  model: string
  displayName: string
  count: number
  color: string
}

interface FilterState {
  selectedDevices: string[]
  startDate: string
  endDate: string
  startTime: string
  endTime: string
  provider: string
  activityType: string
  trackingType: string
  isSameLocation: string
  syncType: string
  minAccuracy: string
  maxAccuracy: string
}

// Helper function to parse device ID
function parseDeviceId(deviceId: string): { brand: string; model: string; displayName: string } {
  const parts = deviceId.split("_")
  if (parts.length >= 2) {
    const brand = parts[0]
    const model = parts[1]
    return {
      brand,
      model,
      displayName: `${brand} ${model}`,
    }
  }
  return {
    brand: "Unknown",
    model: "Unknown",
    displayName: deviceId,
  }
}

// Helper function to get device color
function getDeviceColor(deviceId: string): string {
  const brand = deviceId.split("_")[0]?.toLowerCase() || ""
  const colorMap: { [key: string]: string } = {
    huawei: "#FF5722",
    google: "#4CAF50",
    samsung: "#2196F3",
    xiaomi: "#FF9800",
    oneplus: "#F44336",
    oppo: "#9C27B0",
    vivo: "#673AB7",
    realme: "#00BCD4",
    motorola: "#795548",
    lg: "#607D8B",
    htc: "#E91E63",
    sony: "#3F51B5",
    nokia: "#009688",
  }
  return colorMap[brand] || "#757575"
}

// Helper function to format date for input
function formatDateForInput(dateString: string): string {
  return dateString.split("T")[0]
}

// Helper function to format time for input
function formatTimeForInput(dateString: string): string {
  return dateString.split("T")[1]?.split(".")[0] || "00:00:00"
}

// Helper function to combine date and time
function combineDateAndTime(date: string, time: string): Date {
  return new Date(`${date}T${time}`)
}

export default function MapsPage() {
  const [data, setData] = useState<LocationsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  const [filters, setFilters] = useState<FilterState>({
    selectedDevices: [],
    startDate: "",
    endDate: "",
    startTime: "00:00:00",
    endTime: "23:59:59",
    provider: "all",
    activityType: "all",
    trackingType: "all",
    isSameLocation: "all",
    syncType: "all",
    minAccuracy: "",
    maxAccuracy: "",
  })

  const fetchLocations = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }

      const params = new URLSearchParams({
        key: "111077",
        limit: "1000", // Get more data for better map visualization
      })

      // Add filter parameters to API call
      if (filters.provider !== "all") params.append("provider", filters.provider)
      if (filters.activityType !== "all") params.append("activityType", filters.activityType)
      if (filters.trackingType !== "all") params.append("trackingType", filters.trackingType)
      if (filters.isSameLocation !== "all") params.append("isSameLocation", filters.isSameLocation)
      if (filters.syncType !== "all") params.append("syncType", filters.syncType)
      if (filters.minAccuracy) params.append("minAccuracy", filters.minAccuracy)
      if (filters.startDate) params.append("startDate", filters.startDate)
      if (filters.endDate) params.append("endDate", filters.endDate)

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/location?${params}`)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const json: LocationsResponse = await response.json()
      setData(json)

      // Initialize date filters with actual data range
      if (json.locations && json.locations.length > 0 && !filters.startDate) {
        const timestamps = json.locations.map((loc) => new Date(loc.timestamp))
        const minDate = new Date(Math.min(...timestamps.map((d) => d.getTime())))
        const maxDate = new Date(Math.max(...timestamps.map((d) => d.getTime())))

        setFilters((prev) => ({
          ...prev,
          startDate: formatDateForInput(minDate.toISOString()),
          endDate: formatDateForInput(maxDate.toISOString()),
        }))
      }
    } catch (err) {
      console.error("Error fetching locations:", err)
      setError(err instanceof Error ? err.message : "Failed to fetch locations")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchLocations()
  }, [])

  // Extract unique devices from data
  const devices = useMemo((): ParsedDevice[] => {
    if (!data?.locations) return []

    const deviceMap = new Map<string, ParsedDevice>()

    data.locations.forEach((location) => {
      const deviceId = location.deviceId
      if (deviceMap.has(deviceId)) {
        deviceMap.get(deviceId)!.count++
      } else {
        const parsed = parseDeviceId(deviceId)
        deviceMap.set(deviceId, {
          deviceId,
          brand: parsed.brand,
          model: parsed.model,
          displayName: parsed.displayName,
          count: 1,
          color: getDeviceColor(deviceId),
        })
      }
    })

    return Array.from(deviceMap.values()).sort((a, b) => a.displayName.localeCompare(b.displayName))
  }, [data])

  // Filter locations based on current filters
  const filteredData = useMemo((): LocationsResponse | null => {
    if (!data) return null

    let filteredLocations = data.locations

    // Filter by selected devices
    if (filters.selectedDevices.length > 0) {
      filteredLocations = filteredLocations.filter((location) => filters.selectedDevices.includes(location.deviceId))
    }

    // Filter by date and time range
    if (filters.startDate && filters.endDate) {
      const startDateTime = combineDateAndTime(filters.startDate, filters.startTime)
      const endDateTime = combineDateAndTime(filters.endDate, filters.endTime)

      filteredLocations = filteredLocations.filter((location) => {
        const locationTime = new Date(location.timestamp)
        return locationTime >= startDateTime && locationTime <= endDateTime
      })
    }

    // Filter by accuracy range
    if (filters.maxAccuracy) {
      const maxAcc = Number.parseFloat(filters.maxAccuracy)
      filteredLocations = filteredLocations.filter((location) => location.accuracy <= maxAcc)
    }

    // Recalculate statistics for filtered data
    const filteredStats = {
      ...data.statistics,
      totalPoints: filteredLocations.length,
      uniqueDevices: new Set(filteredLocations.map((loc) => loc.deviceId)).size,
      averageAccuracy:
        filteredLocations.length > 0
          ? filteredLocations.reduce((sum, loc) => sum + loc.accuracy, 0) / filteredLocations.length
          : 0,
      bestAccuracy: filteredLocations.length > 0 ? Math.min(...filteredLocations.map((loc) => loc.accuracy)) : 0,
      worstAccuracy: filteredLocations.length > 0 ? Math.max(...filteredLocations.map((loc) => loc.accuracy)) : 0,
      sameLocationCount: filteredLocations.filter((loc) => loc.isSameLocation).length,
      differentLocationCount: filteredLocations.filter((loc) => !loc.isSameLocation).length,
    }

    return {
      ...data,
      locations: filteredLocations,
      statistics: filteredStats,
    }
  }, [data, filters])

  // Handle device selection
  const handleDeviceToggle = (deviceId: string) => {
    setFilters((prev) => ({
      ...prev,
      selectedDevices: prev.selectedDevices.includes(deviceId)
        ? prev.selectedDevices.filter((id) => id !== deviceId)
        : [...prev.selectedDevices, deviceId],
    }))
  }

  // Handle select all devices
  const handleSelectAllDevices = () => {
    setFilters((prev) => ({
      ...prev,
      selectedDevices: prev.selectedDevices.length === devices.length ? [] : devices.map((device) => device.deviceId),
    }))
  }

  // Reset filters
  const resetFilters = () => {
    if (data?.locations && data.locations.length > 0) {
      const timestamps = data.locations.map((loc) => new Date(loc.timestamp))
      const minDate = new Date(Math.min(...timestamps.map((d) => d.getTime())))
      const maxDate = new Date(Math.max(...timestamps.map((d) => d.getTime())))

      setFilters({
        selectedDevices: [],
        startDate: formatDateForInput(minDate.toISOString()),
        endDate: formatDateForInput(maxDate.toISOString()),
        startTime: "00:00:00",
        endTime: "23:59:59",
        provider: "all",
        activityType: "all",
        trackingType: "all",
        isSameLocation: "all",
        syncType: "all",
        minAccuracy: "",
        maxAccuracy: "",
      })
    }
  }

  const applyFilters = () => {
    fetchLocations()
  }

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading location data...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center p-6 bg-red-50 rounded-lg border border-red-200">
          <div className="text-red-600 mb-2">
            <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-red-800 mb-2">Error Loading Data</h3>
          <p className="text-red-700 mb-4">{error}</p>
          <Button onClick={() => fetchLocations()} className="bg-red-600 hover:bg-red-700">
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  // No data state
  if (!data || !data.locations || data.locations.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center p-6 bg-gray-50 rounded-lg border border-gray-200">
          <div className="text-gray-400 mb-2">
            <MapPin className="w-8 h-8 mx-auto" />
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">No Location Data</h3>
          <p className="text-gray-600">No location records found to display on the map.</p>
        </div>
      </div>
    )
  }

  const hasActiveFilters =
    filters.selectedDevices.length > 0 ||
    filters.provider !== "all" ||
    filters.activityType !== "all" ||
    filters.trackingType !== "all" ||
    filters.isSameLocation !== "all" ||
    filters.syncType !== "all" ||
    filters.minAccuracy ||
    filters.maxAccuracy

  // Success state - render the map with enhanced filters
  return (
    <div className="container mx-auto p-4">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Enhanced Location Map View</h1>
            <p className="text-gray-600">
              Showing {filteredData?.statistics.totalPoints || 0} of {data.statistics.totalPoints} location points
              {filteredData?.statistics.uniqueDevices !== undefined && (
                <span> from {filteredData.statistics.uniqueDevices} device(s)</span>
              )}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => fetchLocations(true)}
              disabled={refreshing}
              variant="outline"
              className="flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button onClick={() => setShowFilters(!showFilters)} className="flex items-center gap-2">
              <Filter className="w-4 h-4" />
              {showFilters ? "Hide Filters" : "Show Filters"}
            </Button>
          </div>
        </div>

        {/* Enhanced Statistics Summary */}
        {filteredData && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-4">
            <Card className="p-3">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-blue-600" />
                <div>
                  <div className="text-blue-600 text-sm font-medium">Total Points</div>
                  <div className="text-blue-900 text-lg font-bold">{filteredData.statistics.totalPoints}</div>
                </div>
              </div>
            </Card>

            <Card className="p-3">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-green-600" />
                <div>
                  <div className="text-green-600 text-sm font-medium">Devices</div>
                  <div className="text-green-900 text-lg font-bold">{filteredData.statistics.uniqueDevices}</div>
                </div>
              </div>
            </Card>

            <Card className="p-3">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-purple-600" />
                <div>
                  <div className="text-purple-600 text-sm font-medium">Avg Accuracy</div>
                  <div className="text-purple-900 text-lg font-bold">
                    {filteredData.statistics.averageAccuracy.toFixed(1)}m
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-3">
              <div className="flex items-center gap-2">
                <Navigation className="w-5 h-5 text-orange-600" />
                <div>
                  <div className="text-orange-600 text-sm font-medium">Best Accuracy</div>
                  <div className="text-orange-900 text-lg font-bold">{filteredData.statistics.bestAccuracy}m</div>
                </div>
              </div>
            </Card>

            {/* Movement Analysis */}
            {filteredData.statistics.movementAnalysis && (
              <>
                <Card className="p-3">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-red-600" />
                    <div>
                      <div className="text-red-600 text-sm font-medium">Movement Rate</div>
                      <div className="text-red-900 text-lg font-bold">
                        {filteredData.statistics.movementAnalysis.movementRate}%
                      </div>
                    </div>
                  </div>
                </Card>

                <Card className="p-3">
                  <div className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-indigo-600" />
                    <div>
                      <div className="text-indigo-600 text-sm font-medium">Same Location</div>
                      <div className="text-indigo-900 text-lg font-bold">
                        {filteredData.statistics.sameLocationCount || 0}
                      </div>
                    </div>
                  </div>
                </Card>
              </>
            )}
          </div>
        )}
      </div>

      {/* Enhanced Filters Panel */}
      {showFilters && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Filter className="w-5 h-5" />
                Advanced Filters
              </span>
              <div className="flex gap-2">
                <Button onClick={applyFilters} size="sm">
                  Apply Filters
                </Button>
                <Button onClick={resetFilters} variant="outline" size="sm">
                  <X className="w-4 h-4 mr-1" />
                  Reset All
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Device Selection */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-800 flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Device Selection
                </h3>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="select-all"
                    checked={filters.selectedDevices.length === devices.length && devices.length > 0}
                    onCheckedChange={handleSelectAllDevices}
                  />
                  <label htmlFor="select-all" className="font-medium text-gray-700">
                    Select All ({devices.length} devices)
                  </label>
                </div>

                <div className="max-h-48 overflow-y-auto border border-gray-200 rounded p-2 space-y-2">
                  {devices.map((device) => (
                    <div
                      key={device.deviceId}
                      className="flex items-center justify-between p-2 rounded hover:bg-gray-50"
                    >
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={device.deviceId}
                          checked={filters.selectedDevices.includes(device.deviceId)}
                          onCheckedChange={() => handleDeviceToggle(device.deviceId)}
                        />
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: device.color }}></div>
                          <div>
                            <div className="font-medium text-gray-800 text-sm">{device.displayName}</div>
                            <div className="text-xs text-gray-500">{device.deviceId}</div>
                          </div>
                        </div>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {device.count}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>

              {/* Date and Time Filters */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-800 flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Date & Time Range
                </h3>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                    <Input
                      type="date"
                      value={filters.startDate}
                      onChange={(e) => setFilters((prev) => ({ ...prev, startDate: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                    <Input
                      type="date"
                      value={filters.endDate}
                      onChange={(e) => setFilters((prev) => ({ ...prev, endDate: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                    <Input
                      type="time"
                      step="1"
                      value={filters.startTime}
                      onChange={(e) => setFilters((prev) => ({ ...prev, startTime: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                    <Input
                      type="time"
                      step="1"
                      value={filters.endTime}
                      onChange={(e) => setFilters((prev) => ({ ...prev, endTime: e.target.value }))}
                    />
                  </div>
                </div>
              </div>

              {/* Advanced Filters */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-800 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Advanced Filters
                </h3>

                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Provider</label>
                    <Select
                      value={filters.provider}
                      onValueChange={(value) => setFilters((prev) => ({ ...prev, provider: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Providers</SelectItem>
                        {data?.statistics.providers.map((provider) => (
                          <SelectItem key={provider} value={provider}>
                            {provider}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Activity Type</label>
                    <Select
                      value={filters.activityType}
                      onValueChange={(value) => setFilters((prev) => ({ ...prev, activityType: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Activities</SelectItem>
                        {data?.statistics.activities.map((activity) => (
                          <SelectItem key={activity} value={activity}>
                            {activity}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {data?.statistics.trackingTypes && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Tracking Type</label>
                      <Select
                        value={filters.trackingType}
                        onValueChange={(value) => setFilters((prev) => ({ ...prev, trackingType: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Types</SelectItem>
                          {data.statistics.trackingTypes.map((type) => (
                            <SelectItem key={type} value={type}>
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Same Location</label>
                    <Select
                      value={filters.isSameLocation}
                      onValueChange={(value) => setFilters((prev) => ({ ...prev, isSameLocation: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Locations</SelectItem>
                        <SelectItem value="true">Same Location</SelectItem>
                        <SelectItem value="false">Different Location</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Min Accuracy (m)</label>
                      <Input
                        type="number"
                        placeholder="0"
                        value={filters.minAccuracy}
                        onChange={(e) => setFilters((prev) => ({ ...prev, minAccuracy: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Max Accuracy (m)</label>
                      <Input
                        type="number"
                        placeholder="100"
                        value={filters.maxAccuracy}
                        onChange={(e) => setFilters((prev) => ({ ...prev, maxAccuracy: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Active Filters Summary */}
            {hasActiveFilters && (
              <div className="pt-4 border-t border-gray-200">
                <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <Filter className="w-4 h-4" />
                  Active Filters:
                </h4>
                <div className="flex flex-wrap gap-2">
                  {filters.selectedDevices.length > 0 && (
                    <Badge variant="secondary">{filters.selectedDevices.length} device(s) selected</Badge>
                  )}
                  {filters.provider !== "all" && <Badge variant="secondary">Provider: {filters.provider}</Badge>}
                  {filters.activityType !== "all" && (
                    <Badge variant="secondary">Activity: {filters.activityType}</Badge>
                  )}
                  {filters.trackingType !== "all" && (
                    <Badge variant="secondary">Tracking: {filters.trackingType}</Badge>
                  )}
                  {filters.isSameLocation !== "all" && (
                    <Badge variant="secondary">
                      {filters.isSameLocation === "true" ? "Same Location" : "Different Location"}
                    </Badge>
                  )}
                  {filters.maxAccuracy && <Badge variant="secondary">Max Accuracy: {filters.maxAccuracy}m</Badge>}
                  {filters.startDate && <Badge variant="secondary">From: {filters.startDate}</Badge>}
                  {filters.endDate && <Badge variant="secondary">To: {filters.endDate}</Badge>}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Map Component */}
      {filteredData && filteredData.locations.length > 0 ? (
        <LeafletLocationMap apiData={filteredData} />
      ) : (
        <div className="flex items-center justify-center min-h-[400px] bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <div className="text-center p-6">
            <div className="text-gray-400 mb-2">
              <BarChart3 className="w-12 h-12 mx-auto" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">No Data Matches Filters</h3>
            <p className="text-gray-600 mb-4">Try adjusting your filters to see location data on the map.</p>
            <Button onClick={resetFilters}>Reset Filters</Button>
          </div>
        </div>
      )}
    </div>
  )
}
