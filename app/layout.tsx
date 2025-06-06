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
        <nav className="bg-gray-800 text-white p-4">
          <div className="container mx-auto flex justify-between items-center">
            <a href="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
              <img 
                src="https://hybridx.github.io/assets/logo.17c5626f.svg" 
                alt="WebScraper Logo" 
                className="h-8 w-8"
              />
              <h1 className="text-xl font-bold">WebScraper</h1>
            </a>
            <div className="space-x-4">
              <a href="/" className="hover:text-gray-300">Search</a>
              <a href="/browse" className="hover:text-gray-300">Browse</a>
              <a href="/download" className="hover:text-gray-300">Download</a>
              <a href="/admin" className="hover:text-gray-300">Admin</a>
            </div>
          </div>
        </nav>
        <main className="min-h-screen bg-gray-50">
          {children}
        </main>
      </body>
    </html>
  )
} 