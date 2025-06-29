"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/hooks/use-toast"
import { useWebSocket } from "@/hooks/use-websocket"
import { uploadMedia } from "@/lib/api"
import { AlertCircle, CheckCircle, File, ImageIcon, Upload, Video, XCircle } from "lucide-react"
import { useCallback, useState } from "react"
import { useDropzone } from "react-dropzone"

interface UploadFile {
    file: File
    id: string
    status: "pending" | "uploading" | "success" | "error" | "duplicate"
    progress: number
    error?: string
    result?: any
}

export function MediaUpload() {
    const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([])
    const [isUploading, setIsUploading] = useState(false)
    const { toast } = useToast()
    const { sendMessage, isConnected } = useWebSocket()

    const onDrop = useCallback((acceptedFiles: File[]) => {
        const newFiles: UploadFile[] = acceptedFiles.map((file) => ({
            file,
            id: Math.random().toString(36).substr(2, 9),
            status: "pending",
            progress: 0,
        }))

        setUploadFiles((prev) => [...prev, ...newFiles])
    }, [])

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            "image/*": [".jpg", ".jpeg", ".png", ".gif", ".webp"],
            "video/*": [".mp4", ".mov", ".avi", ".mkv"],
        },
        maxSize: 25 * 1024 * 1024, // 25MB
    })

    const uploadFile = async (uploadFile: UploadFile) => {
        try {
            setUploadFiles((prev) =>
                prev.map((f) => (f.id === uploadFile.id ? { ...f, status: "uploading", progress: 0 } : f)),
            )

            // Check for duplicates first if WebSocket is connected
            if (isConnected) {
                sendMessage({
                    type: "duplicate_check",
                    fileHash: await generateFileHash(uploadFile.file),
                    originalName: uploadFile.file.name,
                    size: uploadFile.file.size,
                })
            }

            const formData = new FormData()
            formData.append("media", uploadFile.file)
            formData.append("device_id", "dashboard_upload")
            formData.append("timestamp", Date.now().toString())
            formData.append("app_version", "1.0.0")
            formData.append("source_type", "dashboard")

            const response = await uploadMedia(formData, (progress) => {
                setUploadFiles((prev) => prev.map((f) => (f.id === uploadFile.id ? { ...f, progress } : f)))
            })

            if (response.data.duplicate) {
                setUploadFiles((prev) =>
                    prev.map((f) =>
                        f.id === uploadFile.id
                            ? {
                                ...f,
                                status: "duplicate",
                                progress: 100,
                                result: response.data,
                            }
                            : f,
                    ),
                )

                toast({
                    title: "Duplicate File",
                    description: `${uploadFile.file.name} already exists`,
                    variant: "default",
                })
            } else {
                setUploadFiles((prev) =>
                    prev.map((f) =>
                        f.id === uploadFile.id
                            ? {
                                ...f,
                                status: "success",
                                progress: 100,
                                result: response.data,
                            }
                            : f,
                    ),
                )

                toast({
                    title: "Upload Successful",
                    description: `${uploadFile.file.name} uploaded successfully`,
                })

                // Notify via WebSocket
                if (isConnected) {
                    sendMessage({
                        type: "upload_complete",
                        fileName: uploadFile.file.name,
                        status: "success",
                        duplicate: false,
                    })
                }
            }
        } catch (error: any) {
            setUploadFiles((prev) =>
                prev.map((f) =>
                    f.id === uploadFile.id
                        ? {
                            ...f,
                            status: "error",
                            error: error.message || "Upload failed",
                        }
                        : f,
                ),
            )

            toast({
                title: "Upload Failed",
                description: error.message || "Failed to upload file",
                variant: "destructive",
            })
        }
    }

    const uploadAll = async () => {
        setIsUploading(true)
        const pendingFiles = uploadFiles.filter((f) => f.status === "pending")

        for (const file of pendingFiles) {
            await uploadFile(file)
        }

        setIsUploading(false)
    }

    const clearCompleted = () => {
        setUploadFiles((prev) => prev.filter((f) => f.status === "pending" || f.status === "uploading"))
    }

    const removeFile = (id: string) => {
        setUploadFiles((prev) => prev.filter((f) => f.id !== id))
    }

    const generateFileHash = async (file: File): Promise<string> => {
        // Simple hash generation for demo
        return `${file.name}_${file.size}_${file.lastModified}`
    }

    const getFileIcon = (file: File) => {
        if (file.type.startsWith("image/")) return <ImageIcon className="h-4 w-4" />
        if (file.type.startsWith("video/")) return <Video className="h-4 w-4" />
        return <File className="h-4 w-4" />
    }

    const getStatusIcon = (status: UploadFile["status"]) => {
        switch (status) {
            case "success":
                return <CheckCircle className="h-4 w-4 text-green-500" />
            case "error":
                return <XCircle className="h-4 w-4 text-red-500" />
            case "duplicate":
                return <AlertCircle className="h-4 w-4 text-yellow-500" />
            default:
                return null
        }
    }

    const getStatusBadge = (status: UploadFile["status"]) => {
        const variants = {
            pending: "secondary",
            uploading: "default",
            success: "default",
            error: "destructive",
            duplicate: "secondary",
        } as const

        return <Badge variant={variants[status]}>{status}</Badge>
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Upload className="h-5 w-5" />
                        Upload Media Files
                    </CardTitle>
                    <CardDescription>
                        Drag and drop files or click to select. Supports images and videos up to 25MB.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div
                        {...getRootProps()}
                        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"
                            }`}
                    >
                        <input {...getInputProps()} />
                        <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                        {isDragActive ? (
                            <p className="text-lg">Drop the files here...</p>
                        ) : (
                            <div>
                                <p className="text-lg mb-2">Drag & drop files here, or click to select</p>
                                <p className="text-sm text-muted-foreground">Supports JPG, PNG, GIF, WebP, MP4, MOV, AVI, MKV</p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {uploadFiles.length > 0 && (
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle>Upload Queue ({uploadFiles.length})</CardTitle>
                            <div className="flex gap-2">
                                <Button onClick={uploadAll} disabled={isUploading || uploadFiles.every((f) => f.status !== "pending")}>
                                    Upload All
                                </Button>
                                <Button variant="outline" onClick={clearCompleted}>
                                    Clear Completed
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {uploadFiles.map((uploadFile) => (
                                <div key={uploadFile.id} className="flex items-center gap-4 p-4 border rounded-lg">
                                    <div className="flex items-center gap-2 flex-1">
                                        {getFileIcon(uploadFile.file)}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate">{uploadFile.file.name}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {(uploadFile.file.size / 1024 / 1024).toFixed(2)} MB
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        {getStatusIcon(uploadFile.status)}
                                        {getStatusBadge(uploadFile.status)}
                                    </div>

                                    {uploadFile.status === "uploading" && (
                                        <div className="w-24">
                                            <Progress value={uploadFile.progress} />
                                        </div>
                                    )}

                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => removeFile(uploadFile.id)}
                                        disabled={uploadFile.status === "uploading"}
                                    >
                                        Remove
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
