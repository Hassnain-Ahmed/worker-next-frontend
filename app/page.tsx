"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useRealtimeStats } from "@/hooks/useRealtimeStats"
import { Activity, Clock, ImageIcon, MapPin, Smartphone, Wifi, WifiOff } from "lucide-react"
import Link from "next/link"

export default function HomePage() {
  const { stats, recentLocations, recentMedia, deviceStatusChanges, lastUpdate, isConnected, connectionStatus } =
    useRealtimeStats()

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case "connected":
        return "default"
      case "error":
        return "destructive"
      default:
        return "secondary"
    }
  }

  const getConnectionStatusText = () => {
    switch (connectionStatus) {
      case "connected":
        return "Connected"
      case "error":
        return "Error"
      default:
        return "Disconnected"
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-4">
          <h1 className="text-4xl font-bold">Location Tracker Dashboard</h1>
          <Badge variant={getConnectionStatusColor()} className="flex items-center gap-1">
            {isConnected ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
            {getConnectionStatusText()}
          </Badge>
        </div>
        <p className="text-xl text-gray-600">Monitor live device locations and manage media uploads in real-time</p>
        {lastUpdate && (
          <p className="text-sm text-gray-500 flex items-center justify-center gap-1">
            <Clock className="h-4 w-4" />
            Last updated: {lastUpdate.toLocaleTimeString()}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Devices</CardTitle>
            <Smartphone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.devices.active}</div>
            <p className="text-xs text-muted-foreground">{stats.devices.websocketConnected} connected via WebSocket</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Live Locations</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.locations.recentUpdates}</div>
            <p className="text-xs text-muted-foreground">Recent updates (5 min)</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Media Files</CardTitle>
            <ImageIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.media.totalFiles}</div>
            <p className="text-xs text-muted-foreground">
              {formatBytes(stats.media.totalSize)} total • {stats.media.todayUploads} today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">WebSocket Status</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${isConnected ? "text-green-600" : "text-red-600"}`}>
              {isConnected ? "Live" : "Offline"}
            </div>
            <p className="text-xs text-muted-foreground">Real-time connection</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Live Location Tracking
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600">
              Monitor real-time location updates from all connected devices on an interactive map.
            </p>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Real-time location updates via WebSocket</li>
              <li>• Interactive OpenStreetMap integration</li>
              <li>• Device status and accuracy filtering</li>
              <li>• Live updates every second</li>
            </ul>
            <Link href="/live-location">
              <Button className="w-full">View Live Locations</Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              Media Gallery
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600">
              Browse and manage uploaded media files from all devices with advanced filtering.
            </p>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Images and videos from all devices</li>
              <li>• Filter by device, type, and source</li>
              <li>• Search functionality</li>
              <li>• Thumbnail previews and metadata</li>
            </ul>
            <Link href="/media-gallery">
              <Button className="w-full bg-transparent" variant="outline">
                Browse Media
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {recentLocations.slice(0, 3).map((location, index) => (
                <div key={index} className="text-sm p-2 bg-blue-50 rounded">
                  <div className="font-medium">{location.deviceId}</div>
                  <div className="text-gray-600">Location update • {location.accuracy}m accuracy</div>
                  <div className="text-xs text-gray-500">{new Date(location.timestamp).toLocaleTimeString()}</div>
                </div>
              ))}

              {recentMedia.slice(0, 2).map((media, index) => (
                <div key={index} className="text-sm p-2 bg-green-50 rounded">
                  <div className="font-medium">{media.deviceId}</div>
                  <div className="text-gray-600">
                    Uploaded {media.resourceType} • {formatBytes(media.size)}
                  </div>
                  <div className="text-xs text-gray-500">{new Date(media.timestamp).toLocaleTimeString()}</div>
                </div>
              ))}

              {deviceStatusChanges.slice(0, 2).map((change, index) => (
                <div key={index} className="text-sm p-2 bg-yellow-50 rounded">
                  <div className="font-medium">{change.deviceId}</div>
                  <div className="text-gray-600">Device {change.status}</div>
                  <div className="text-xs text-gray-500">{new Date(change.timestamp).toLocaleTimeString()}</div>
                </div>
              ))}

              {recentLocations.length === 0 && recentMedia.length === 0 && deviceStatusChanges.length === 0 && (
                <p className="text-gray-500 text-center py-4">No recent activity</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
