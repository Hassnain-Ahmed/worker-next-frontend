"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, Filter, ImageIcon, Search, Video } from "lucide-react"
import { useEffect, useState } from "react"

interface MediaFile {
    _id: string
    originalName: string
    deviceId: string
    resourceType: "image" | "video"
    sourceType: string
    secureUrl: string
    thumbnailUrl: string
    size: number
    uploadDate: string
    deviceModel?: string
    deviceBrand?: string
    tags: string[]
    humanReadableSize: string
}

export default function MediaGalleryPage() {
    const [media, setMedia] = useState<MediaFile[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [filters, setFilters] = useState({
        deviceId: "all",
        resourceType: "all",
        sourceType: "all",
        search: "",
    })
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)

    const fetchMedia = async (resetPage = false) => {
        try {
            setLoading(true)
            const currentPage = resetPage ? 1 : page

            const params = new URLSearchParams({
                page: currentPage.toString(),
                limit: "20",
            })

            if (filters.deviceId !== "all") params.append("deviceId", filters.deviceId)
            if (filters.resourceType !== "all") params.append("resourceType", filters.resourceType)
            if (filters.sourceType !== "all") params.append("sourceType", filters.sourceType)

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/media?${params}`)
            const data = await response.json()

            if (data.success) {
                setMedia(data.data)
                setTotalPages(data.pagination.pages)
                if (resetPage) setPage(1)
                setError(null)
            } else {
                setError(data.error || "Failed to fetch media")
            }
        } catch (err) {
            setError("Network error occurred")
            console.error("Fetch error:", err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchMedia(true)
    }, [filters])

    useEffect(() => {
        fetchMedia()
    }, [page])

    // Filter media by search term
    const filteredMedia = media.filter(
        (item) =>
            filters.search === "" ||
            item.originalName.toLowerCase().includes(filters.search.toLowerCase()) ||
            item.deviceId.toLowerCase().includes(filters.search.toLowerCase()),
    )

    const handleFilterChange = (key: string, value: string) => {
        setFilters((prev) => ({ ...prev, [key]: value }))
    }

    const getUniqueDevices = () => {
        return Array.from(new Set(media.map((item) => item.deviceId)))
    }

    return (
        <div className="container mx-auto p-6 space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">Media Gallery</h1>
                <Badge variant="outline">
                    {filteredMedia.length} File{filteredMedia.length !== 1 ? "s" : ""}
                </Badge>
            </div>

            {/* Filters */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Filter className="h-5 w-5" />
                        Filters
                    </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    <div>
                        <label className="text-sm font-medium mb-2 block">Search</label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Search files..."
                                value={filters.search}
                                onChange={(e) => handleFilterChange("search", e.target.value)}
                                className="pl-10"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="text-sm font-medium mb-2 block">Device</label>
                        <Select value={filters.deviceId} onValueChange={(value) => handleFilterChange("deviceId", value)}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Devices</SelectItem>
                                {getUniqueDevices().map((deviceId) => (
                                    <SelectItem key={deviceId} value={deviceId}>
                                        {deviceId}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div>
                        <label className="text-sm font-medium mb-2 block">Type</label>
                        <Select value={filters.resourceType} onValueChange={(value) => handleFilterChange("resourceType", value)}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Types</SelectItem>
                                <SelectItem value="image">Images</SelectItem>
                                <SelectItem value="video">Videos</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div>
                        <label className="text-sm font-medium mb-2 block">Source</label>
                        <Select value={filters.sourceType} onValueChange={(value) => handleFilterChange("sourceType", value)}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Sources</SelectItem>
                                <SelectItem value="camera">Camera</SelectItem>
                                <SelectItem value="screenshot">Screenshot</SelectItem>
                                <SelectItem value="gallery">Gallery</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex items-end">
                        <Button onClick={() => fetchMedia(true)} disabled={loading} className="w-full">
                            {loading ? "Loading..." : "Refresh"}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {error && (
                <Card className="border-red-200 bg-red-50">
                    <CardContent className="pt-6">
                        <p className="text-red-600">{error}</p>
                    </CardContent>
                </Card>
            )}

            {/* Media Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {filteredMedia.map((item) => (
                    <Card key={item._id} className="overflow-hidden hover:shadow-lg transition-shadow">
                        <div className="aspect-square relative bg-gray-100">
                            {item.resourceType === "image" ? (
                                <img
                                    src={item.thumbnailUrl || item.secureUrl}
                                    alt={item.originalName}
                                    className="w-full h-full object-cover"
                                    loading="lazy"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gray-200">
                                    <Video className="h-12 w-12 text-gray-400" />
                                </div>
                            )}

                            <div className="absolute top-2 right-2">
                                <Badge variant={item.resourceType === "image" ? "default" : "secondary"}>
                                    {item.resourceType === "image" ? (
                                        <ImageIcon className="h-3 w-3 mr-1" />
                                    ) : (
                                        <Video className="h-3 w-3 mr-1" />
                                    )}
                                    {item.resourceType}
                                </Badge>
                            </div>
                        </div>

                        <CardContent className="p-3 space-y-2">
                            <h3 className="font-medium text-sm truncate" title={item.originalName}>
                                {item.originalName}
                            </h3>

                            <div className="text-xs text-gray-600 space-y-1">
                                <p>Device: {item.deviceId}</p>
                                <p>Size: {item.humanReadableSize}</p>
                                <p>
                                    <Calendar className="inline h-3 w-3 mr-1" />
                                    {new Date(item.uploadDate).toLocaleDateString()}
                                </p>
                            </div>

                            <div className="flex flex-wrap gap-1">
                                <Badge variant="outline" className="text-xs">
                                    {item.sourceType}
                                </Badge>
                                {item.tags.slice(0, 2).map((tag) => (
                                    <Badge key={tag} variant="secondary" className="text-xs">
                                        {tag}
                                    </Badge>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {filteredMedia.length === 0 && !loading && (
                <Card>
                    <CardContent className="py-12 text-center">
                        <p className="text-gray-500">No media files found</p>
                    </CardContent>
                </Card>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex justify-center gap-2">
                    <Button variant="outline" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1 || loading}>
                        Previous
                    </Button>

                    <span className="flex items-center px-4 py-2 text-sm">
                        Page {page} of {totalPages}
                    </span>

                    <Button
                        variant="outline"
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages || loading}
                    >
                        Next
                    </Button>
                </div>
            )}
        </div>
    )
}
