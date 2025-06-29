// import { Header } from "@/components/layout/header"
// import { Sidebar } from "@/components/layout/sidebar"
// import { WebSocketProvider } from "@/components/providers/websocket-provider"
// import { ThemeProvider } from "@/components/theme-provider"
// import { Toaster } from "@/components/ui/toaster"
// import type { Metadata } from "next"
// import { Inter } from "next/font/google"
// import type React from "react"
// import "./globals.css"

// const inter = Inter({ subsets: ["latin"] })

// export const metadata: Metadata = {
//   title: "Worker Dashboard - Media & Location Tracking",
//   description: "Real-time dashboard for media uploads and location tracking",
// }

// export default function RootLayout({
//   children,
// }: {
//   children: React.ReactNode
// }) {
//   return (
//     <html lang="en" suppressHydrationWarning>
//       <body className={inter.className}>
//         <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
//           <WebSocketProvider>
//             <div className="flex h-screen overflow-hidden">
//               <Sidebar />
//               <div className="flex flex-col flex-1 overflow-hidden">
//                 <Header />
//                 <main className="flex-1 overflow-x-hidden overflow-y-auto bg-background">{children}</main>
//               </div>
//             </div>
//             <Toaster />
//           </WebSocketProvider>
//         </ThemeProvider>
//       </body>
//     </html>
//   )
// }
// // 


import Navigation from "@/components/layout/navigation"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import type React from "react"
import Layout from "./admin"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Location Tracker Dashboard",
  description: "Real-time location tracking and media gallery",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <Layout>
      <html lang="en">
        <head>
          <link
            rel="stylesheet"
            href="https://unpkg.com/leaflet@1.7.1/dist/leaflet.css"
            integrity="sha512-xodZBNTC5n17Xt2atTPuE1HxjVMSvLVW9ocqUKLsCC5CXdbqCmblAshOMAS6/keqq/sMZMZ19scR4PsZChSR7A=="
            crossOrigin=""
          />
        </head>
        <body className={inter.className}>
          <Navigation />
          <main className="min-h-screen bg-gray-50">{children}</main>
        </body>
      </html>
    </Layout>

  )
}
