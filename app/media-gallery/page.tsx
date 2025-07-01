"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
    Activity,
    Calendar,
    Camera,
    ChevronLeft,
    ChevronRight,
    Clock,
    Download,
    Eye,
    FileImage,
    Filter,
    GridIcon,
    HardDrive,
    Info,
    List,
    Monitor,
    Play,
    RefreshCw,
    Search,
    Signal,
    Smartphone,
    Video,
    Wifi,
    X
} from "lucide-react"
import { useCallback, useEffect, useMemo, useState } from "react"

// Date utility functions
const formatDate = (dateString: string, formatStr: string) => {
    const date = new Date(dateString)

    if (formatStr === "MMM d, yyyy") {
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
        return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`
    }
    if (formatStr === "h:mm a") {
        return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })
    }
    if (formatStr === "MMM d, h:mm a") {
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
        const time = date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })
        return `${months[date.getMonth()]} ${date.getDate()}, ${time}`
    }
    if (formatStr === "yyyy-MM-dd") {
        return date.toISOString().split("T")[0]
    }
    if (formatStr === "full") {
        return date.toLocaleString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
            second: "2-digit",
            hour12: true,
        })
    }
    return date.toLocaleDateString()
}

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value)

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value)
        }, delay)

        return () => {
            clearTimeout(handler)
        }
    }, [value, delay])

    return debouncedValue
}

// Updated interface to match new API response
interface MediaRecord {
    _id: string
    originalName: string
    fileHash: string
    cloudinaryId: string
    cloudinaryUrl: string
    secureUrl: string
    mimeType: string
    size: number
    format: string
    resourceType: "image" | "video" | "raw"
    timestamp: number
    deviceId: string
    deviceModel?: string
    deviceBrand?: string
    osVersion?: string
    appVersion?: string
    sourceType: string
    sourcePath: string
    isCamera: boolean
    isScreenshot: boolean
    networkType?: string
    websocketEnabled: boolean
    duration?: number | null
    creationTime?: string
    modifiedTime?: string
    processingStatus: string
    isDuplicate: boolean
    isDeleted: boolean
    viewCount: number
    downloadCount: number
    tags: string[]
    category: string
    uploadDate: string
    createdAt: string
    updatedAt: string
    ageInDays: number
    humanReadableSize: string
    thumbnailUrl: string
    mediumUrl: string
    id: string
    dimensions: {
        width: number | null
        height: number | null
    }
}

interface ApiResponse {
    success: boolean
    data: MediaRecord[]
    pagination: {
        page: number
        limit: number
        total: number
        pages: number
    }
}

interface Filters {
    deviceId: string
    resourceType: string
    sourceType: string
    category: string
}

type ViewMode = "grid" | "list"

export default function RecordsPage() {
    const [allRecords, setAllRecords] = useState<MediaRecord[]>([])
    const [data, setData] = useState<ApiResponse | null>(null)
    const [loading, setLoading] = useState(true)
    const [refetching, setRefetching] = useState(false)
    const [currentPage, setCurrentPage] = useState(1)
    const [viewMode, setViewMode] = useState<ViewMode>("grid")
    const [searchQuery, setSearchQuery] = useState("")
    const [showFilters, setShowFilters] = useState(false)
    const [selectedRecord, setSelectedRecord] = useState<MediaRecord | null>(null)
    const [filters, setFilters] = useState<Filters>({
        deviceId: "all",
        resourceType: "all",
        sourceType: "all",
        category: "all"
    })

    const debouncedSearchQuery = useDebounce(searchQuery, 500)

    const fetchRecords = useCallback(async (page = 1, isRefetch = false) => {
        try {
            if (isRefetch) {
                setRefetching(true)
            } else {
                setLoading(true)
            }

            const params = new URLSearchParams({
                page: page.toString(),
                limit: "100",
                key: "111077"
            })

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/media?${params}`)
            const result = await response.json()

            if (result.success) {
                if (page === 1) {
                    setAllRecords(result.data)
                } else {
                    setAllRecords((prev) => [...prev, ...result.data])
                }
                setData(result)
            } else {
                console.error("API returned error:", result)
            }
        } catch (error) {
            console.error("Error fetching records:", error)
        } finally {
            setLoading(false)
            setRefetching(false)
        }
    }, [])

    // Helper function to format device names
    const formatDeviceName = (brand?: string, model?: string): string => {
        if (brand && model) {
            return `${brand} ${model}`
        }
        if (brand) return brand
        if (model) return model
        return "Unknown Device"
    }

    // Helper function to get device ID from the actual deviceId field
    const getDeviceId = (deviceId: string): string => {
        return deviceId || "unknown_device"
    }

    // Helper function to get device color based on brand
    const getDeviceColor = (brand?: string): string => {
        if (!brand) return '#757575'

        const brandLower = brand.toLowerCase()
        const colorMap: { [key: string]: string } = {
            'huawei': '#FF5722',      // Orange
            'honor': '#FF5722',       // Orange (same as Huawei)
            'google': '#4CAF50',      // Green
            'samsung': '#2196F3',     // Blue
            'xiaomi': '#FF9800',      // Amber
            'oneplus': '#F44336',     // Red
            'oppo': '#9C27B0',        // Purple
            'vivo': '#673AB7',        // Deep Purple
            'realme': '#00BCD4',      // Cyan
            'motorola': '#795548',    // Brown
            'lg': '#607D8B',          // Blue Grey
            'htc': '#E91E63',         // Pink
            'sony': '#3F51B5',        // Indigo
            'nokia': '#009688',       // Teal
            'apple': '#000000',       // Black
            'iphone': '#000000',      // Black
        }

        return colorMap[brandLower] || '#757575' // Default grey for unknown brands
    }

    // Client-side filtering and searching
    const filteredRecords = useMemo(() => {
        let filtered = [...allRecords]

        // Apply search filter
        if (debouncedSearchQuery.trim()) {
            const query = debouncedSearchQuery.toLowerCase()
            filtered = filtered.filter(
                (record) =>
                    record.originalName.toLowerCase().includes(query) ||
                    record.mimeType.toLowerCase().includes(query) ||
                    record.deviceModel?.toLowerCase().includes(query) ||
                    record.deviceBrand?.toLowerCase().includes(query) ||
                    record.sourceType.toLowerCase().includes(query) ||
                    record.tags.some(tag => tag.toLowerCase().includes(query))
            )
        }

        // Apply device filter
        if (filters.deviceId !== "all") {
            filtered = filtered.filter((record) => record.deviceId === filters.deviceId)
        }

        // Apply resource type filter
        if (filters.resourceType !== "all") {
            filtered = filtered.filter((record) => record.resourceType === filters.resourceType)
        }

        // Apply source type filter
        if (filters.sourceType !== "all") {
            filtered = filtered.filter((record) => record.sourceType === filters.sourceType)
        }

        // Apply category filter
        if (filters.category !== "all") {
            filtered = filtered.filter((record) => record.category === filters.category)
        }

        return filtered
    }, [allRecords, debouncedSearchQuery, filters])

    // Pagination for filtered results
    const itemsPerPage = 20
    const totalPages = Math.ceil(filteredRecords.length / itemsPerPage)
    const paginatedRecords = filteredRecords.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

    useEffect(() => {
        fetchRecords(1)
    }, [fetchRecords])

    // Reset to first page when filters change
    useEffect(() => {
        setCurrentPage(1)
    }, [debouncedSearchQuery, filters])

    const handleRefetch = () => {
        fetchRecords(1, true)
    }

    const handleFilterChange = (key: keyof Filters, value: string) => {
        setFilters((prev) => ({ ...prev, [key]: value }))
    }

    const clearFilters = () => {
        setFilters({
            deviceId: "all",
            resourceType: "all",
            sourceType: "all",
            category: "all"
        })
        setSearchQuery("")
    }

    const getUniqueDevices = () => {
        const deviceMap = new Map<string, { count: number; name: string; color: string; brand?: string; model?: string }>()

        allRecords.forEach(record => {
            const deviceId = record.deviceId
            const existing = deviceMap.get(deviceId) || { count: 0, name: '', color: '', brand: undefined, model: undefined }
            deviceMap.set(deviceId, {
                count: existing.count + 1,
                name: formatDeviceName(record.deviceBrand, record.deviceModel),
                color: getDeviceColor(record.deviceBrand),
                brand: record.deviceBrand,
                model: record.deviceModel
            })
        })

        return Array.from(deviceMap.entries()).map(([deviceId, info]) => ({
            id: deviceId,
            name: info.name,
            count: info.count,
            color: info.color,
            brand: info.brand,
            model: info.model
        }))
    }

    const getUniqueValues = (field: keyof MediaRecord) => {
        const values = new Set<string>()
        allRecords.forEach(record => {
            const value = record[field]
            if (value && typeof value === 'string') {
                values.add(value)
            }
        })
        return Array.from(values).sort()
    }

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return "0 B"
        const k = 1024
        const sizes = ["B", "KB", "MB", "GB"]
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i]
    }

    const formatDuration = (duration: number) => {
        const minutes = Math.floor(duration / 60)
        const seconds = Math.floor(duration % 60)
        return `${minutes}:${seconds.toString().padStart(2, "0")}`
    }

    const getDateLabel = (dateString: string) => {
        return formatDate(dateString, "MMM d, yyyy")
    }

    const groupRecordsByDate = (records: MediaRecord[]) => {
        const groups: { [key: string]: MediaRecord[] } = {}
        records?.forEach((record) => {
            // Use uploadDate for grouping
            const date = formatDate(record.uploadDate, "yyyy-MM-dd")
            if (!groups[date]) groups[date] = []
            groups[date].push(record)
        })
        return groups
    }

    const DetailModal = ({ record, open, onClose }: { record: MediaRecord; open: boolean; onClose: () => void }) => (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Info className="h-5 w-5" />
                        Media Details
                    </DialogTitle>
                </DialogHeader>

                <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
                    {/* Media Preview */}
                    <div className="space-y-4">
                        <Card>
                            <CardContent className="p-4">
                                <div className="relative aspect-square bg-muted rounded-lg overflow-hidden">
                                    <img
                                        src={record.secureUrl || record.cloudinaryUrl || "/placeholder.svg"}
                                        alt={record.originalName}
                                        className="w-full h-full object-contain"
                                    />
                                    {record.resourceType === "video" && record.duration && (
                                        <div className="absolute bottom-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-sm flex items-center gap-1">
                                            <Play className="h-4 w-4" />
                                            {formatDuration(record.duration)}
                                        </div>
                                    )}
                                </div>

                                <div className="flex gap-2 mt-4">
                                    <Button asChild className="flex-1">
                                        <a href={record.secureUrl || record.cloudinaryUrl} target="_blank" rel="noopener noreferrer">
                                            <Eye className="h-4 w-4 mr-2" />
                                            View Full Size
                                        </a>
                                    </Button>
                                    <Button variant="outline" asChild>
                                        <a href={record.secureUrl || record.cloudinaryUrl} download={record.originalName}>
                                            <Download className="h-4 w-4 mr-2" />
                                            Download
                                        </a>
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Details */}
                    <div className="space-y-4">
                        {/* File Information */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <FileImage className="h-5 w-5" />
                                    File Information
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="grid grid-cols-1 gap-4 text-sm">
                                    <div>
                                        <div className="font-medium text-muted-foreground">Name</div>
                                        <div className="break-all">{record.originalName}</div>
                                    </div>
                                    <div>
                                        <div className="font-medium text-muted-foreground">Type</div>
                                        <div>{record.mimeType}</div>
                                    </div>
                                    <div>
                                        <div className="font-medium text-muted-foreground">Size</div>
                                        <div>{record.humanReadableSize}</div>
                                    </div>
                                    <div>
                                        <div className="font-medium text-muted-foreground">Resolution</div>
                                        <div>
                                            {record.dimensions.width && record.dimensions.height
                                                ? `${record.dimensions.width} × ${record.dimensions.height}`
                                                : 'Unknown'
                                            }
                                        </div>
                                    </div>
                                    {record.duration && (
                                        <div>
                                            <div className="font-medium text-muted-foreground">Duration</div>
                                            <div>{formatDuration(record.duration)}</div>
                                        </div>
                                    )}
                                    <div>
                                        <div className="font-medium text-muted-foreground">File Hash</div>
                                        <div className="font-mono text-xs break-all">{record.fileHash}</div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Device Information */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <Smartphone className="h-5 w-5" />
                                    Device Information
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <div className="font-medium text-muted-foreground">Device</div>
                                        <div className="flex items-center gap-2">
                                            <div
                                                className="w-3 h-3 rounded-full"
                                                style={{ backgroundColor: getDeviceColor(record.deviceBrand) }}
                                            ></div>
                                            <span>{formatDeviceName(record.deviceBrand, record.deviceModel)}</span>
                                        </div>
                                    </div>
                                    <div>
                                        <div className="font-medium text-muted-foreground">App Version</div>
                                        <div>{record.appVersion || "Unknown"}</div>
                                    </div>
                                    <div>
                                        <div className="font-medium text-muted-foreground">Brand</div>
                                        <div>{record.deviceBrand || "Unknown"}</div>
                                    </div>
                                    <div>
                                        <div className="font-medium text-muted-foreground">Model</div>
                                        <div>{record.deviceModel || "Unknown"}</div>
                                    </div>
                                    <div>
                                        <div className="font-medium text-muted-foreground">OS Version</div>
                                        <div>{record.osVersion || "Unknown"}</div>
                                    </div>
                                    <div>
                                        <div className="font-medium text-muted-foreground">Network</div>
                                        <div className="flex items-center gap-1">
                                            {record.networkType === "wifi" ? (
                                                <Wifi className="h-4 w-4" />
                                            ) : (
                                                <Signal className="h-4 w-4" />
                                            )}
                                            {record.networkType || "Unknown"}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="font-medium text-muted-foreground">Device ID</div>
                                        <div className="font-mono text-xs break-all">{record.deviceId}</div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Timestamps */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <Clock className="h-5 w-5" />
                                    Timestamps
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="space-y-2 text-sm">
                                    <div>
                                        <div className="font-medium text-muted-foreground">Captured</div>
                                        <div>{formatDate(new Date(record.timestamp).toISOString(), "full")}</div>
                                    </div>
                                    {record.creationTime && (
                                        <div>
                                            <div className="font-medium text-muted-foreground">File Created</div>
                                            <div>{formatDate(record.creationTime, "full")}</div>
                                        </div>
                                    )}
                                    {record.modifiedTime && (
                                        <div>
                                            <div className="font-medium text-muted-foreground">File Modified</div>
                                            <div>{formatDate(record.modifiedTime, "full")}</div>
                                        </div>
                                    )}
                                    <div>
                                        <div className="font-medium text-muted-foreground">Uploaded</div>
                                        <div>{formatDate(record.uploadDate, "full")}</div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Metadata */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <Activity className="h-5 w-5" />
                                    Metadata
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="flex flex-wrap gap-2">
                                    {record.resourceType === "video" ? (
                                        <Badge className="bg-red-500/90 hover:bg-red-500 text-white">
                                            <Video className="h-3 w-3 mr-1" />
                                            Video
                                        </Badge>
                                    ) : (
                                        <Badge className="bg-blue-500/90 hover:bg-blue-500 text-white">
                                            <FileImage className="h-3 w-3 mr-1" />
                                            Image
                                        </Badge>
                                    )}

                                    {record.isCamera && (
                                        <Badge className="bg-green-500/90 hover:bg-green-500 text-white">
                                            <Camera className="h-3 w-3 mr-1" />
                                            Camera
                                        </Badge>
                                    )}

                                    {record.isScreenshot && (
                                        <Badge className="bg-purple-500/90 hover:bg-purple-500 text-white">
                                            <Monitor className="h-3 w-3 mr-1" />
                                            Screenshot
                                        </Badge>
                                    )}

                                    <Badge variant={record.processingStatus === "completed" ? "default" : "secondary"}>
                                        {record.processingStatus}
                                    </Badge>

                                    <Badge variant="outline">
                                        {record.category}
                                    </Badge>
                                </div>

                                <div className="text-sm space-y-2">
                                    <div>
                                        <div className="font-medium text-muted-foreground">Source Path</div>
                                        <div className="font-mono text-xs break-all bg-muted p-2 rounded">{record.sourcePath}</div>
                                    </div>
                                    <div>
                                        <div className="font-medium text-muted-foreground">Source Type</div>
                                        <div>{record.sourceType}</div>
                                    </div>
                                    {record.tags.length > 0 && (
                                        <div>
                                            <div className="font-medium text-muted-foreground">Tags</div>
                                            <div className="flex flex-wrap gap-1 mt-1">
                                                {record.tags.map((tag, index) => (
                                                    <Badge key={index} variant="outline" className="text-xs">
                                                        {tag}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <div className="font-medium text-muted-foreground">Views</div>
                                            <div>{record.viewCount}</div>
                                        </div>
                                        <div>
                                            <div className="font-medium text-muted-foreground">Downloads</div>
                                            <div>{record.downloadCount}</div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )

    const MediaCard = ({ record }: { record: MediaRecord }) => (
        <Card className="group overflow-hidden hover:shadow-lg transition-all duration-200 border-0 shadow-md">
            <CardContent className="p-0">
                <div className="relative aspect-square bg-muted overflow-hidden">
                    <img
                        src={record.thumbnailUrl || record.secureUrl || record.cloudinaryUrl || "/placeholder.svg"}
                        alt={record.originalName}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        loading="lazy"
                    />

                    <div className="absolute top-2 left-2 flex gap-1">
                        {record.resourceType === "video" ? (
                            <Badge className="bg-red-500/90 hover:bg-red-500 text-white text-xs">
                                <Video className="h-3 w-3 mr-1" />
                                Video
                            </Badge>
                        ) : (
                            <Badge className="bg-blue-500/90 hover:bg-blue-500 text-white text-xs">
                                <FileImage className="h-3 w-3 mr-1" />
                                Image
                            </Badge>
                        )}
                    </div>

                    {record.duration && (
                        <div className="absolute bottom-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
                            <Play className="h-3 w-3" />
                            {formatDuration(record.duration)}
                        </div>
                    )}

                    <div className="absolute top-2 right-2 flex flex-col gap-1">
                        {record.isCamera && (
                            <Badge variant="secondary" className="text-xs bg-green-500/90 hover:bg-green-500 text-white">
                                <Camera className="h-3 w-3" />
                            </Badge>
                        )}
                        {record.isScreenshot && (
                            <Badge variant="secondary" className="text-xs bg-purple-500/90 hover:bg-purple-500 text-white">
                                <Monitor className="h-3 w-3" />
                            </Badge>
                        )}
                    </div>

                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200">
                        <div className="flex gap-2">
                            <Button size="sm" variant="secondary" className="h-8 w-8 p-0" onClick={() => setSelectedRecord(record)}>
                                <Info className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="secondary" className="h-8 w-8 p-0" asChild>
                                <a href={record.secureUrl || record.cloudinaryUrl} target="_blank" rel="noopener noreferrer">
                                    <Eye className="h-4 w-4" />
                                </a>
                            </Button>
                            <Button size="sm" variant="secondary" className="h-8 w-8 p-0" asChild>
                                <a href={record.secureUrl || record.cloudinaryUrl} download={record.originalName}>
                                    <Download className="h-4 w-4" />
                                </a>
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="p-4 space-y-3">
                    <div>
                        <h3 className="font-medium text-sm truncate" title={record.originalName}>
                            {record.originalName}
                        </h3>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                            <Clock className="h-3 w-3" />
                            {formatDate(record.uploadDate, "h:mm a")}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                        <div className="flex items-center gap-1 text-muted-foreground">
                            <Eye className="h-3 w-3 text-blue-500" />
                            <span>
                                {record.dimensions.width && record.dimensions.height
                                    ? `${record.dimensions.width}×${record.dimensions.height}`
                                    : 'Unknown'
                                }
                            </span>
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground">
                            <HardDrive className="h-3 w-3 text-green-500" />
                            <span>{record.humanReadableSize}</span>
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground col-span-2">
                            <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: getDeviceColor(record.deviceBrand) }}
                            ></div>
                            <Smartphone className="h-3 w-3 text-gray-500" />
                            <span className="truncate">
                                {formatDeviceName(record.deviceBrand, record.deviceModel)}
                            </span>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )

    const MediaListItem = ({ record }: { record: MediaRecord }) => (
        <Card className="group hover:shadow-md transition-all duration-200">
            <CardContent className="p-4">
                <div className="flex items-center gap-4">
                    <div className="relative w-16 h-16 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                        <img
                            src={record.thumbnailUrl || record.secureUrl || record.cloudinaryUrl || "/placeholder.svg"}
                            alt={record.originalName}
                            className="w-full h-full object-cover"
                            loading="lazy"
                        />
                        {record.resourceType === "video" && (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <Play className="h-4 w-4 text-white drop-shadow-lg" />
                            </div>
                        )}
                    </div>

                    <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0 flex-1">
                                <h3 className="font-medium text-sm truncate" title={record.originalName}>
                                    {record.originalName}
                                </h3>
                                <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1 flex-wrap">
                                    <div className="flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        {formatDate(record.uploadDate, "MMM d, h:mm a")}
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Eye className="h-3 w-3" />
                                        {record.dimensions.width && record.dimensions.height
                                            ? `${record.dimensions.width}×${record.dimensions.height}`
                                            : 'Unknown'
                                        }
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <HardDrive className="h-3 w-3" />
                                        {record.humanReadableSize}
                                    </div>
                                    {record.duration && (
                                        <div className="flex items-center gap-1">
                                            <Play className="h-3 w-3" />
                                            {formatDuration(record.duration)}
                                        </div>
                                    )}
                                    <div className="flex items-center gap-1">
                                        <div
                                            className="w-3 h-3 rounded-full"
                                            style={{ backgroundColor: getDeviceColor(record.deviceBrand) }}
                                        ></div>
                                        <Smartphone className="h-3 w-3" />
                                        <span className="truncate">
                                            {formatDeviceName(record.deviceBrand, record.deviceModel)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 flex-shrink-0">
                                <div className="flex gap-1">
                                    {record.resourceType === "video" ? (
                                        <Badge variant="secondary" className="text-xs">
                                            <Video className="h-3 w-3 mr-1" />
                                            Video
                                        </Badge>
                                    ) : (
                                        <Badge variant="secondary" className="text-xs">
                                            <FileImage className="h-3 w-3 mr-1" />
                                            Image
                                        </Badge>
                                    )}
                                    {record.isCamera && (
                                        <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
                                            <Camera className="h-3 w-3" />
                                        </Badge>
                                    )}
                                    {record.isScreenshot && (
                                        <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-700">
                                            <Monitor className="h-3 w-3" />
                                        </Badge>
                                    )}
                                </div>

                                <div className="flex gap-1">
                                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => setSelectedRecord(record)}>
                                        <Info className="h-4 w-4" />
                                    </Button>
                                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0" asChild>
                                        <a href={record.secureUrl || record.cloudinaryUrl} target="_blank" rel="noopener noreferrer">
                                            <Eye className="h-4 w-4" />
                                        </a>
                                    </Button>
                                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0" asChild>
                                        <a href={record.secureUrl || record.cloudinaryUrl} download={record.originalName}>
                                            <Download className="h-4 w-4" />
                                        </a>
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )

    if (loading) {
        return (
            <div className="container mx-auto p-4 sm:p-6">
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            </div>
        )
    }

    if (!data || !data.success) {
        return (
            <div className="container mx-auto p-4 sm:p-6">
                <div className="text-center text-muted-foreground">No data available or API error</div>
            </div>
        )
    }

    const groupedRecords = groupRecordsByDate(paginatedRecords)
    const hasActiveFilters = filters.deviceId !== "all" || filters.resourceType !== "all" ||
        filters.sourceType !== "all" || filters.category !== "all" || searchQuery
    const uniqueDevices = getUniqueDevices()

    return (
        <div className="container mx-auto p-4 sm:p-6 space-y-6 sm:space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <h1 className="text-2xl sm:text-3xl font-bold">Media Records</h1>
                    <Badge variant="secondary" className="text-sm px-3 py-1">
                        <Activity className="h-4 w-4 mr-1" />
                        {filteredRecords.length} of {allRecords.length}
                    </Badge>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRefetch}
                        disabled={refetching}
                        className="flex items-center gap-2"
                    >
                        <RefreshCw className={`h-4 w-4 ${refetching ? "animate-spin" : ""}`} />
                        <span className="hidden sm:inline">Refresh</span>
                    </Button>

                    <div className="flex items-center gap-1 border rounded-lg p-1">
                        <Button
                            variant={viewMode === "grid" ? "secondary" : "ghost"}
                            size="sm"
                            onClick={() => setViewMode("grid")}
                            className="h-8 w-8 p-0"
                        >
                            <GridIcon className="h-4 w-4" />
                        </Button>
                        <Button
                            variant={viewMode === "list" ? "secondary" : "ghost"}
                            size="sm"
                            onClick={() => setViewMode("list")}
                            className="h-8 w-8 p-0"
                        >
                            <List className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>

            {/* Search and Advanced Filters */}
            <Card className="border-0 shadow-md">
                <CardContent className="p-4 sm:p-6 space-y-4">
                    {/* Search Bar */}
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search media files... (name, type, device, source, tags)"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowFilters(!showFilters)}
                            className="flex items-center gap-2"
                        >
                            <Filter className="h-4 w-4" />
                            <span className="hidden sm:inline">Filters</span>
                        </Button>
                    </div>

                    {/* Advanced Filters */}
                    {showFilters && (
                        <div className="pt-4 border-t space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                {/* Device Selection */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Device</label>
                                    <Select value={filters.deviceId} onValueChange={(value) => handleFilterChange("deviceId", value)}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">
                                                <div className="flex items-center gap-2">
                                                    <span>All Devices ({allRecords.length})</span>
                                                </div>
                                            </SelectItem>
                                            {uniqueDevices.map((device) => (
                                                <SelectItem key={device.id} value={device.id}>
                                                    <div className="flex items-center gap-2">
                                                        <div
                                                            className="w-3 h-3 rounded-full"
                                                            style={{ backgroundColor: device.color }}
                                                        ></div>
                                                        <span>{device.name} ({device.count})</span>
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Resource Type Filter */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Media Type</label>
                                    <Select value={filters.resourceType} onValueChange={(value) => handleFilterChange("resourceType", value)}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Types</SelectItem>
                                            <SelectItem value="image">
                                                <div className="flex items-center gap-2">
                                                    <FileImage className="h-4 w-4" />
                                                    Images
                                                </div>
                                            </SelectItem>
                                            <SelectItem value="video">
                                                <div className="flex items-center gap-2">
                                                    <Video className="h-4 w-4" />
                                                    Videos
                                                </div>
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Source Type Filter */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Source</label>
                                    <Select value={filters.sourceType} onValueChange={(value) => handleFilterChange("sourceType", value)}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Sources</SelectItem>
                                            {getUniqueValues('sourceType').map((sourceType) => (
                                                <SelectItem key={sourceType} value={sourceType}>
                                                    {sourceType}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Category Filter */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Category</label>
                                    <Select value={filters.category} onValueChange={(value) => handleFilterChange("category", value)}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Categories</SelectItem>
                                            {getUniqueValues('category').map((category) => (
                                                <SelectItem key={category} value={category}>
                                                    {category}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* Device Overview */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Devices Overview</label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                    {uniqueDevices.map((device) => (
                                        <div
                                            key={device.id}
                                            className={`p-3 border rounded-lg cursor-pointer transition-colors ${filters.deviceId === device.id
                                                ? 'border-blue-500 bg-blue-50'
                                                : 'border-gray-200 hover:bg-gray-50'
                                                }`}
                                            onClick={() => handleFilterChange("deviceId", device.id)}
                                        >
                                            <div className="flex items-center gap-2">
                                                <div
                                                    className="w-4 h-4 rounded-full"
                                                    style={{ backgroundColor: device.color }}
                                                ></div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-sm font-medium truncate">{device.name}</div>
                                                    <div className="text-xs text-muted-foreground">{device.count} media files</div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {hasActiveFilters && (
                                <div className="flex justify-end">
                                    <Button variant="outline" size="sm" onClick={clearFilters} className="flex items-center gap-2">
                                        <X className="h-4 w-4" />
                                        Clear Filters
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Content */}
            <div className="space-y-8 sm:space-y-10">
                {Object.entries(groupedRecords).map(([date, records]) => (
                    <div key={date} className="space-y-4 sm:space-y-6">
                        <div className="flex items-center gap-3 pb-2 border-b">
                            <Calendar className="h-5 w-5 text-primary" />
                            <h2 className="text-xl sm:text-2xl font-semibold">{getDateLabel(records[0].uploadDate)}</h2>
                            <Badge variant="outline" className="ml-2">
                                {records.length} items
                            </Badge>
                        </div>

                        {viewMode === "grid" ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 sm:gap-6">
                                {records.map((record) => (
                                    <MediaCard key={record._id} record={record} />
                                ))}
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {records.map((record) => (
                                    <MediaListItem key={record._id} record={record} />
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <Card className="border-0 shadow-md">
                    <CardContent className="p-4 sm:p-6">
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="text-sm text-muted-foreground flex items-center gap-2">
                                <Eye className="h-4 w-4" />
                                Page {currentPage} of {totalPages} ({filteredRecords.length} results)
                            </div>

                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage((prev) => prev - 1)}
                                    disabled={currentPage === 1}
                                    className="flex items-center gap-1"
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                    <span className="hidden sm:inline">Previous</span>
                                </Button>

                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage((prev) => prev + 1)}
                                    disabled={currentPage === totalPages}
                                    className="flex items-center gap-1"
                                >
                                    <span className="hidden sm:inline">Next</span>
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Detail Modal */}
            {selectedRecord && (
                <DetailModal record={selectedRecord} open={!!selectedRecord} onClose={() => setSelectedRecord(null)} />
            )}
        </div>
    )
}