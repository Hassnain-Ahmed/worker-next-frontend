"use client"

import { useToast } from "@/hooks/use-toast"
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react"

interface WebSocketContextType {
    isConnected: boolean
    lastMessage: any
    sendMessage: (message: any) => void
    connectedDevices: any[]
    lastLocationUpdate: any
    connectionStats: any
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined)

export function useWebSocketContext() {
    const context = useContext(WebSocketContext)
    if (context === undefined) {
        throw new Error("useWebSocketContext must be used within a WebSocketProvider")
    }
    return context
}

interface WebSocketProviderProps {
    children: ReactNode
}

export function WebSocketProvider({ children }: WebSocketProviderProps) {
    const [isConnected, setIsConnected] = useState(false)
    const [lastMessage, setLastMessage] = useState<any>(null)
    const [connectedDevices, setConnectedDevices] = useState<any[]>([])
    const [lastLocationUpdate, setLastLocationUpdate] = useState<any>(null)
    const [connectionStats, setConnectionStats] = useState<any>(null)
    const wsRef = useRef<WebSocket | null>(null)
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
    const { toast } = useToast()

    const connect = () => {
        try {
            const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:3000/ws"
            wsRef.current = new WebSocket(wsUrl)

            wsRef.current.onopen = () => {
                setIsConnected(true)
                console.log("WebSocket connected")

                // Send connection message
                sendMessage({
                    type: "connection",
                    device_id: "dashboard_client",
                    app_version: "1.0.0",
                    service_type: "dashboard",
                })

                toast({
                    title: "Connected",
                    description: "Real-time connection established",
                })
            }

            wsRef.current.onmessage = (event) => {
                try {
                    const message = JSON.parse(event.data)
                    setLastMessage(message)
                    handleMessage(message)
                } catch (error) {
                    console.error("Error parsing WebSocket message:", error)
                }
            }

            wsRef.current.onclose = () => {
                setIsConnected(false)
                console.log("WebSocket disconnected")

                // Attempt to reconnect after 3 seconds
                reconnectTimeoutRef.current = setTimeout(() => {
                    connect()
                }, 3000)
            }

            wsRef.current.onerror = (error) => {
                console.error("WebSocket error:", error)
                toast({
                    title: "Connection Error",
                    description: "Failed to connect to real-time updates",
                    variant: "destructive",
                })
            }
        } catch (error) {
            console.error("Failed to create WebSocket connection:", error)
        }
    }

    const handleMessage = (message: any) => {
        switch (message.type) {
            case "welcome":
                console.log("Welcome message received:", message)
                break

            case "connection_ack":
                console.log("Connection acknowledged:", message)
                break

            case "location_update":
                setLastLocationUpdate(message)
                break

            case "location_ack":
                console.log("Location update acknowledged:", message)
                break

            case "device_status_update":
                // Update connected devices list
                break

            case "upload_notification":
                toast({
                    title: "New Upload",
                    description: `File uploaded: ${message.fileName}`,
                })
                break

            case "upload_response":
                if (message.duplicate) {
                    toast({
                        title: "Duplicate File",
                        description: `File ${message.fileName} already exists`,
                    })
                } else {
                    toast({
                        title: "Upload Successful",
                        description: `File ${message.fileName} uploaded successfully`,
                    })
                }
                break

            case "duplicate_check_response":
                console.log("Duplicate check response:", message)
                break

            case "pong":
                console.log("Pong received")
                break

            case "test_response":
                console.log("Test response:", message)
                break

            case "error":
                console.error("WebSocket error:", message.error)
                toast({
                    title: "Error",
                    description: message.error.message,
                    variant: "destructive",
                })
                break

            default:
                console.log("Unhandled message type:", message.type)
        }
    }

    const sendMessage = (message: any) => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify(message))
        } else {
            console.warn("WebSocket not connected, cannot send message")
        }
    }

    useEffect(() => {
        connect()

        return () => {
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current)
            }
            if (wsRef.current) {
                wsRef.current.close()
            }
        }
    }, [])

    // Ping/pong heartbeat
    useEffect(() => {
        if (isConnected) {
            const interval = setInterval(() => {
                sendMessage({ type: "ping", timestamp: Date.now() })
            }, 30000)

            return () => clearInterval(interval)
        }
    }, [isConnected])

    const value = {
        isConnected,
        lastMessage,
        sendMessage,
        connectedDevices,
        lastLocationUpdate,
        connectionStats,
    }

    return <WebSocketContext.Provider value={value}>{children}</WebSocketContext.Provider>
}
