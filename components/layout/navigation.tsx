"use client"

import { Home, ImageIcon, MapPin, Menu, WifiHigh } from "lucide-react";
import Link from "next/link";
import { useState } from "react"; // Import useState hook

export default function Navigation() {
    const [isOpen, setIsOpen] = useState(false); // State to manage mobile menu visibility

    return (
        <nav className="bg-white shadow-sm border-b">
            <div className="container mx-auto px-6">
                <div className="flex items-center justify-between h-16">
                    <Link href="/" className="flex items-center gap-2 font-bold text-xl">
                        <Home className="h-6 w-6" />
                        Location Tracker
                    </Link>

                    {/* Mobile menu button */}
                    <div className="md:hidden">
                        <button
                            onClick={() => setIsOpen(!isOpen)}
                            className="text-gray-600 hover:text-gray-900 focus:outline-none focus:text-gray-900"
                        >
                            <Menu className="h-6 w-6" />
                        </button>
                    </div>

                    {/* Desktop navigation links */}
                    <div className="hidden md:flex items-center gap-6">
                        <Link
                            href="/location/live"
                            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
                        >
                            <WifiHigh className="h-5 w-5" />
                            Live
                        </Link>

                        <Link
                            href="/location"
                            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
                        >
                            <MapPin className="h-5 w-5" />
                            Location
                        </Link>

                        <Link
                            href="/media-gallery"
                            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
                        >
                            <ImageIcon className="h-5 w-5" />
                            Media Gallery
                        </Link>
                    </div>
                </div>

                {/* Mobile menu (conditionally rendered) */}
                {isOpen && (
                    <div className="md:hidden">
                        <div className="flex flex-col space-y-4 px-2 pt-2 pb-3">
                            <Link
                                href="/location/live"
                                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
                                onClick={() => setIsOpen(false)} // Close menu on link click
                            >
                                <WifiHigh className="h-5 w-5" />
                                Live
                            </Link>

                            <Link
                                href="/location"
                                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
                                onClick={() => setIsOpen(false)} // Close menu on link click
                            >
                                <MapPin className="h-5 w-5" />
                                Location
                            </Link>

                            <Link
                                href="/media-gallery"
                                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
                                onClick={() => setIsOpen(false)} // Close menu on link click
                            >
                                <ImageIcon className="h-5 w-5" />
                                Media Gallery
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </nav>
    );
}