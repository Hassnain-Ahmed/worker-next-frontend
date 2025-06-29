"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { deleteMedia, fetchMedia, getMediaDownloadUrl } from "@/lib/api"
import { formatBytes, formatDate } from "@/lib/utils"
import { Download, Eye, ImageIcon, Trash2, Video } from "lucide-react"
import Image from "next/image"
import { useEffect, useState } from "react"

interface MediaGalleryProps {
    filters: {
        deviceId: string
        resourceType: string
        sourceType: string
        startDate: string
        endDate: string
        search: string
    }
}

export function MediaGallery({ filters }: MediaGalleryProps) {
    const [media, setMedia] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedMedia, setSelectedMedia] = useState<any>(null)
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
    const { toast } = useToast()

    useEffect(() => {
        loadMedia()
    }, [filters, page])

    const loadMedia = async () => {
        try {
            setLoading(true)
            const response = await fetchMedia({
                ...filters,
                page,
                limit: 20,
                sort_by: "uploadDate",
                sort_order: "desc",
            })

            setMedia(response.data.media)
            setTotalPages(response.data.pagination.totalPages)
        } catch (error) {
            console.error("Failed to load media:", error)
            toast({
                title: "Error",
                description: "Failed to load media files",
                variant: "destructive",
            })
        } finally {
            setLoading(false)
        }
    }

    const handleDownload = async (mediaItem: any) => {
        try {
            const response = await getMediaDownloadUrl(mediaItem._id)
            window.open(response.data.downloadUrl, "_blank")

            toast({
                title: "Download Started",
                description: `Downloading ${mediaItem.originalName}`,
            })
        } catch (error) {
            console.error("Download failed:", error)
            toast({
                title: "Download Failed",
                description: "Failed to download file",
                variant: "destructive",
            })
        }
    }

    const handleDelete = async (mediaItem: any) => {
        try {
            await deleteMedia(mediaItem._id, false) // Soft delete
            setMedia((prev) => prev.filter((m) => m._id !== mediaItem._id))

            toast({
                title: "File Deleted",
                description: `${mediaItem.originalName} has been deleted`,
            })
        } catch (error) {
            console.error("Delete failed:", error)
            toast({
                title: "Delete Failed",
                description: "Failed to delete file",
                variant: "destructive",
            })
        }
    }

    const getFileIcon = (resourceType: string) => {
        switch (resourceType) {
            case "image":
                return <ImageIcon className="h-4 w-4" />
            case "video":
                return <Video className="h-4 w-4" />
            default:
                return <ImageIcon className="h-4 w-4" />
        }
    }

    const getSourceBadge = (sourceType: string, isCamera: boolean, isScreenshot: boolean) => {
        if (isCamera) return <Badge variant="secondary">Camera</Badge>
        if (isScreenshot) return <Badge variant="outline">Screenshot</Badge>
        return <Badge variant="default">{sourceType}</Badge>
    }

    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Media Gallery</CardTitle>
                    <CardDescription>Loading media files...</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {[...Array(12)].map((_, i) => (
                            <div key={i} className="aspect-square bg-muted animate-pulse rounded" />
                        ))}
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Media Gallery</CardTitle>
                            <CardDescription>{media.length} files found</CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                            <Select value={viewMode} onValueChange={(value: "grid" | "list") => setViewMode(value)}>
                                <SelectTrigger className="w-24">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="grid">Grid</SelectItem>
                                    <SelectItem value="list">List</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {viewMode === "grid" ? (
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                            {media.map((item) => (
                                <div key={item._id} className="group relative aspect-square overflow-hidden rounded-lg border bg-muted">
                                    <Dialog>
                                        <DialogTrigger asChild>
                                            <div className="cursor-pointer">
                                                {item.resourceType === "image" ? (
                                                    <Image
                                                        src={item.thumbnailUrl || item.secureUrl}
                                                        alt={item.originalName}
                                                        fill
                                                        className="object-cover transition-transform group-hover:scale-105"
                                                        sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 16vw"
                                                    />
                                                ) : (
                                                    <div className="flex items-center justify-center h-full">
                                                        <Video className="h-8 w-8 text-muted-foreground" />
                                                    </div>
                                                )}
                                            </div>
                                        </DialogTrigger>
                                        <DialogContent className="max-w-4xl">
                                            <DialogHeader>
                                                <DialogTitle>{item.originalName}</DialogTitle>
                                                <DialogDescription>
                                                    {formatBytes(item.size)} • {formatDate(item.uploadDate)}
                                                </DialogDescription>
                                            </DialogHeader>
                                            <div className="space-y-4">
                                                <div className="flex justify-center">
                                                    {item.resourceType === "image" ? (
                                                        <Image
                                                            src={item.secureUrl || "/placeholder.svg"}
                                                            alt={item.originalName}
                                                            width={800}
                                                            height={600}
                                                            className="max-h-96 object-contain"
                                                        />
                                                    ) : (
                                                        <video src={item.secureUrl} controls className="max-h-96 max-w-full" />
                                                    )}
                                                </div>
                                                <div className="grid grid-cols-2 gap-4 text-sm">
                                                    <div>
                                                        <p className="font-medium">Device</p>
                                                        <p className="text-muted-foreground">
                                                            {item.deviceModel} ({item.deviceId})
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="font-medium">Source</p>
                                                        <div className="flex items-center gap-2">
                                                            {getSourceBadge(item.sourceType, item.isCamera, item.isScreenshot)}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <p className="font-medium">Dimensions</p>
                                                        <p className="text-muted-foreground">
                                                            {item.dimensions?.width} × {item.dimensions?.height}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="font-medium">Format</p>
                                                        <p className="text-muted-foreground">{item.format?.toUpperCase()}</p>
                                                    </div>
                                                </div>
                                                <div className="flex justify-end gap-2">
                                                    <Button onClick={() => handleDownload(item)}>
                                                        <Download className="h-4 w-4 mr-2" />
                                                        Download
                                                    </Button>
                                                    <Button variant="destructive" onClick={() => handleDelete(item)}>
                                                        <Trash2 className="h-4 w-4 mr-2" />
                                                        Delete
                                                    </Button>
                                                </div>
                                            </div>
                                        </DialogContent>
                                    </Dialog>

                                    {/* Overlay with actions */}
                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                        <Button size="sm" variant="secondary" onClick={() => handleDownload(item)}>
                                            <Download className="h-4 w-4" />
                                        </Button>
                                        <Button size="sm" variant="secondary">
                                            <Eye className="h-4 w-4" />
                                        </Button>
                                        <Button size="sm" variant="destructive" onClick={() => handleDelete(item)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>

                                    {/* File type indicator */}
                                    <div className="absolute top-2 left-2">{getFileIcon(item.resourceType)}</div>

                                    {/* Source badge */}
                                    <div className="absolute top-2 right-2">
                                        {getSourceBadge(item.sourceType, item.isCamera, item.isScreenshot)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {media.map((item) => (
                                <div
                                    key={item._id}
                                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded overflow-hidden bg-muted flex items-center justify-center">
                                            {item.resourceType === "image" ? (
                                                <Image
                                                    src={item.thumbnailUrl || item.secureUrl}
                                                    alt={item.originalName}
                                                    width={48}
                                                    height={48}
                                                    className="object-cover"
                                                />
                                            ) : (
                                                <Video className="h-6 w-6 text-muted-foreground" />
                                            )}
                                        </div>
                                        <div>
                                            <p className="font-medium">{item.originalName}</p>
                                            <p className="text-sm text-muted-foreground">
                                                {formatBytes(item.size)} • {formatDate(item.uploadDate)}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {getSourceBadge(item.sourceType, item.isCamera, item.isScreenshot)}
                                        <Button size="sm" variant="outline" onClick={() => handleDownload(item)}>
                                            <Download className="h-4 w-4" />
                                        </Button>
                                        <Button size="sm" variant="outline" onClick={() => handleDelete(item)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-center gap-2 mt-6">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                                disabled={page === 1}
                            >
                                Previous
                            </Button>
                            <span className="text-sm text-muted-foreground">
                                Page {page} of {totalPages}
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                                disabled={page === totalPages}
                            >
                                Next
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
