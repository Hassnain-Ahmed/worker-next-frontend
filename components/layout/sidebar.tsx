"use client"

import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { Database, LayoutDashboard, MapPin, Menu, Settings, Smartphone, X } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"

const navigation = [
    {
        name: "Dashboard",
        href: "/",
        icon: LayoutDashboard,
    },
    {
        name: "Media",
        href: "/media",
        icon: Database,
    },
    {
        name: "Location",
        href: "/location",
        icon: MapPin,
    },
    {
        name: "Devices",
        href: "/devices",
        icon: Smartphone,
    },
    {
        name: "Settings",
        href: "/settings",
        icon: Settings,
    },
]

export function Sidebar() {
    const [collapsed, setCollapsed] = useState(false)
    const pathname = usePathname()

    return (
        <>
            {/* Mobile overlay */}
            {!collapsed && <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setCollapsed(true)} />}

            {/* Sidebar */}
            <div
                className={cn(
                    "fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-background border-r transition-transform duration-300 ease-in-out lg:translate-x-0",
                    collapsed ? "-translate-x-full" : "translate-x-0",
                )}
            >
                {/* Header */}
                <div className="flex h-16 items-center justify-between px-6 border-b">
                    <h1 className="text-xl font-bold">Worker Dashboard</h1>
                    <Button variant="ghost" size="sm" onClick={() => setCollapsed(true)} className="lg:hidden">
                        <X className="h-4 w-4" />
                    </Button>
                </div>

                {/* Navigation */}
                <ScrollArea className="flex-1 px-3 py-4">
                    <nav className="space-y-2">
                        {navigation.map((item) => {
                            const isActive = pathname === item.href
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={cn(
                                        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                                        isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground",
                                    )}
                                >
                                    <item.icon className="h-4 w-4" />
                                    {item.name}
                                </Link>
                            )
                        })}
                    </nav>
                </ScrollArea>

                {/* Footer */}
                <div className="border-t p-4">
                    <p className="text-xs text-muted-foreground">Worker Dashboard v1.0.0</p>
                </div>
            </div>

            {/* Mobile menu button */}
            <Button
                variant="ghost"
                size="sm"
                onClick={() => setCollapsed(false)}
                className={cn("fixed top-4 left-4 z-40 lg:hidden", !collapsed && "hidden")}
            >
                <Menu className="h-4 w-4" />
            </Button>

            {/* Spacer for desktop */}
            <div className="hidden lg:block lg:w-64" />
        </>
    )
}
