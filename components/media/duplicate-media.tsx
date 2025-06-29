"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"
import { batchDeleteMedia, findDuplicateMedia, getMediaDownloadUrl } from "@/lib/api"
import { formatBytes, formatDate } from "@/lib/utils"
import { AlertTriangle, Download, Eye, Trash2 } from "lucide-react"
import Image from "next/image"
import { useEffect, useState } from "react"

export function DuplicateMedia() {
    const [duplicates, setDuplicates] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set())
    const [deleting, setDeleting] = useState(false)
    const { toast } = useToast()

    useEffect(() => {
        loadDuplicates()
    }, [])

    const loadDuplicates = async () => {
        try {
            setLoading(true)
            const response = await findDuplicateMedia({ limit: 50 })
            setDuplicates(response.data.duplicates || [])
        } catch (error) {
            console.error("Failed to load duplicates:", error)
            toast({
                title: "Error",
                description: "Failed to load duplicate files",
                variant: "destructive",
            })
        } finally {
            setLoading(false)
        }
    }

    const handleSelectFile = (fileId: string, checked: boolean) => {
        const newSelected = new Set(selectedFiles)
        if (checked) {
            newSelected.add(fileId)
        } else {
            newSelected.delete(fileId)
        }
        setSelectedFiles(newSelected)
    }

    const handleSelectGroup = (group: any, checked: boolean) => {
        const newSelected = new Set(selectedFiles)
        group.files.forEach((file: any) => {
            if (checked) {
                newSelected.add(file.id)
            } else {
                newSelected.delete(file.id)
            }
        })
        setSelectedFiles(newSelected)
    }

    const handleDeleteSelected = async () => {
        if (selectedFiles.size === 0) return

        try {
            setDeleting(true)
            await batchDeleteMedia(Array.from(selectedFiles), false) // Soft delete

            // Remove deleted files from the duplicates list
            setDuplicates((prev) =>
                prev
                    .map((group) => ({
                        ...group,
                        files: group.files.filter((file: any) => !selectedFiles.has(file.id)),
                        count: group.files.filter((file: any) => !selectedFiles.has(file.id)).length,
                    }))
                    .filter((group) => group.count > 1),
            )

            setSelectedFiles(new Set())

            toast({
                title: "Files Deleted",
                description: `${selectedFiles.size} duplicate files have been deleted`,
            })
        } catch (error) {
            console.error("Delete failed:", error)
            toast({
                title: "Delete Failed",
                description: "Failed to delete selected files",
                variant: "destructive",
            })
        } finally {
            setDeleting(false)
        }
    }

    const handleDownload = async (file: any) => {
        try {
            const response = await getMediaDownloadUrl(file.id)
            window.open(response.data.downloadUrl, "_blank")
        } catch (error) {
            console.error("Download failed:", error)
            toast({
                title: "Download Failed",
                description: "Failed to download file",
                variant: "destructive",
            })
        }
    }

    const getTotalWastedSpace = () => {
        return duplicates.reduce((total, group) => {
            // Calculate wasted space (keep one file, count others as waste)
            const fileSize = group.files[0]?.size || 0
            return total + fileSize * (group.count - 1)
        }, 0)
    }

    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Duplicate Files</CardTitle>
                    <CardDescription>Loading duplicate files...</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="h-20 bg-muted animate-pulse rounded" />
                        ))}
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="space-y-6">
            {/* Summary */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                                Duplicate Files
                            </CardTitle>
                            <CardDescription>
                                {duplicates.length} duplicate groups found • {formatBytes(getTotalWastedSpace())} wasted space
                            </CardDescription>
                        </div>
                        {selectedFiles.size > 0 && (
                            <Button variant="destructive" onClick={handleDeleteSelected} disabled={deleting}>
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete Selected ({selectedFiles.size})
                            </Button>
                        )}
                    </div>
                </CardHeader>
            </Card>

            {/* Duplicate Groups */}
            <div className="space-y-4">
                {duplicates.map((group, groupIndex) => (
                    <Card key={group._id}>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Checkbox
                                        checked={group.files.every((file: any) => selectedFiles.has(file.id))}
                                        onCheckedChange={(checked) => handleSelectGroup(group, checked as boolean)}
                                    />
                                    <div>
                                        <CardTitle className="text-base">Duplicate Group #{groupIndex + 1}</CardTitle>
                                        <CardDescription>
                                            {group.count} identical files • {formatBytes(group.files[0]?.size || 0)} each
                                        </CardDescription>
                                    </div>
                                </div>
                                <Badge variant="destructive">
                                    {formatBytes((group.files[0]?.size || 0) * (group.count - 1))} wasted
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-4">
                                {group.files.map((file: any, fileIndex: number) => (
                                    <div key={file.id} className="flex items-center gap-4 p-4 border rounded-lg">
                                        <Checkbox
                                            checked={selectedFiles.has(file.id)}
                                            onCheckedChange={(checked) => handleSelectFile(file.id, checked as boolean)}
                                        />

                                        <div className="w-16 h-16 rounded overflow-hidden bg-muted flex items-center justify-center">
                                            <Image
                                                src={file.cloudinaryUrl || "/placeholder.svg"}
                                                alt={file.originalName}
                                                width={64}
                                                height={64}
                                                className="object-cover"
                                            />
                                        </div>

                                        <div className="flex-1">
                                            <p className="font-medium">{file.originalName}</p>
                                            <p className="text-sm text-muted-foreground">
                                                {formatBytes(file.size)} • {formatDate(file.uploadDate)}
                                            </p>
                                            <p className="text-sm text-muted-foreground">Device: {file.deviceId}</p>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            {fileIndex === 0 && <Badge variant="secondary">Original</Badge>}
                                            <Button size="sm" variant="outline" onClick={() => handleDownload(file)}>
                                                <Download className="h-4 w-4" />
                                            </Button>
                                            <Button size="sm" variant="outline">
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {duplicates.length === 0 && (
                <Card>
                    <CardContent className="text-center py-8">
                        <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                        <p className="text-lg font-medium mb-2">No Duplicate Files Found</p>
                        <p className="text-muted-foreground">
                            All your media files are unique. Great job keeping your storage organized!
                        </p>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
