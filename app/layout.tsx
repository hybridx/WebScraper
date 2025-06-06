import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'WebScraper',
  description: 'Search and download files from crawled directory listings',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <nav className="bg-gradient-to-r from-gray-900 to-gray-800 text-white shadow-xl border-b border-gray-700">
          <div className="container mx-auto px-4 py-4">
            <div className="flex justify-between items-center">
              <a href="/" className="flex items-center space-x-3 hover:opacity-90 transition-opacity group">
                <img 
                  src="https://hybridx.github.io/assets/logo.17c5626f.svg" 
                  alt="WebScraper Logo" 
                  className="h-10 w-10 transform group-hover:scale-110 transition-transform duration-200"
                />
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">WebScraper</h1>
              </a>
              <div className="flex space-x-6">
                <a href="/" className="px-4 py-2 rounded-lg hover:bg-white/10 transition-all duration-200 font-medium border border-transparent hover:border-white/20 backdrop-blur-sm">
                  Search
                </a>
                <a href="/browse" className="px-4 py-2 rounded-lg hover:bg-white/10 transition-all duration-200 font-medium border border-transparent hover:border-white/20 backdrop-blur-sm">
                  Browse
                </a>
                <a href="/download" className="px-4 py-2 rounded-lg hover:bg-white/10 transition-all duration-200 font-medium border border-transparent hover:border-white/20 backdrop-blur-sm">
                  Download
                </a>
                <a href="/admin" className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:scale-105 border border-blue-500">
                  Admin
                </a>
              </div>
            </div>
          </div>
        </nav>
        <main className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
          {children}
        </main>
      </body>
    </html>
  )
} 