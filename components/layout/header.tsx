"use client"

import { Button } from "@/components/ui/button"
import { useWebSocket } from "@/hooks/use-websocket"
import { Bell, Settings, User } from "lucide-react"
import { usePathname } from "next/navigation"

const pageNames: Record<string, string> = {
    "/": "Dashboard",
    "/media": "Media Management",
    "/location": "Location Tracking",
    "/devices": "Device Management",
    "/settings": "Settings",
}

export function Header() {
    const pathname = usePathname()
    const { isConnected } = useWebSocket()
    const pageName = pageNames[pathname] || "Dashboard"

    return (
        <header className="flex h-16 items-center justify-between border-b bg-background px-6">
            <div>
                <h1 className="text-2xl font-semibold">{pageName}</h1>
            </div>

            <div className="flex items-center gap-4">
                {/* Connection Status */}
                <div className="flex items-center gap-2">
                    <div className={`h-2 w-2 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"}`} />
                    <span className="text-sm text-muted-foreground">{isConnected ? "Connected" : "Disconnected"}</span>
                </div>

                {/* Notifications */}
                <Button variant="ghost" size="sm">
                    <Bell className="h-4 w-4" />
                </Button>

                {/* Settings */}
                <Button variant="ghost" size="sm">
                    <Settings className="h-4 w-4" />
                </Button>

                {/* User */}
                <Button variant="ghost" size="sm">
                    <User className="h-4 w-4" />
                </Button>
            </div>
        </header>
    )
}
