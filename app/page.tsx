'use client';

import { useState, useEffect } from 'react';
import { Search, Download, FileText, Video, Music, Archive, Image, HardDrive, Code } from 'lucide-react';

interface Link {
  id: number;
  name: string;
  link: string;
  type: string;
  created_at: string;
}

interface Stats {
  totalLinks: number;
  totalUrls: number;
  pendingUrls: number;
  errorUrls: number;
}

interface FileType {
  type: string;
  count: number;
}

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [searchResults, setSearchResults] = useState<Link[]>([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);
  const [fileTypes, setFileTypes] = useState<FileType[]>([]);
  const [selectedLinks, setSelectedLinks] = useState<Set<number>>(new Set());

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/stats');
      const data = await response.json();
      if (data.success) {
        setStats(data.stats);
        setFileTypes(data.fileTypes);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}&type=${selectedType}&limit=50`);
      const data = await response.json();
      
      if (data.success) {
        setSearchResults(data.results);
      } else {
        alert(data.error || 'Search failed');
      }
    } catch (error) {
      console.error('Search error:', error);
      alert('Search failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'video': return <Video className="w-5 h-5 text-red-600" />;
      case 'audio': return <Music className="w-5 h-5 text-green-600" />;
      case 'image': return <Image className="w-5 h-5 text-blue-600" />;
      case 'compressed': return <Archive className="w-5 h-5 text-yellow-600" />;
      case 'text': return <FileText className="w-5 h-5 text-gray-700" />;
      case 'executable': return <Code className="w-5 h-5 text-purple-600" />;
      case 'disk': return <HardDrive className="w-5 h-5 text-orange-600" />;
      default: return <FileText className="w-5 h-5 text-gray-700" />;
    }
  };

  const toggleLinkSelection = (linkId: number) => {
    const newSelected = new Set(selectedLinks);
    if (newSelected.has(linkId)) {
      newSelected.delete(linkId);
    } else {
      newSelected.add(linkId);
    }
    setSelectedLinks(newSelected);
  };

  const downloadSelected = () => {
    const selectedUrls = searchResults
      .filter(link => selectedLinks.has(link.id))
      .map(link => link.link);
    
    if (selectedUrls.length === 0) {
      alert('Please select links to download');
      return;
    }

    // Create a text file with all selected URLs
    const urlsText = selectedUrls.join('\n');
    const blob = new Blob([urlsText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'selected_links.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <h1 className="text-5xl font-bold text-gray-900 mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          WebScraper Directory Search
        </h1>
        <p className="text-xl text-gray-700 mb-8 max-w-2xl mx-auto">
          Search through crawled directory listings to find media files, documents, and more with powerful filtering options.
        </p>
        
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <a href="/browse" className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:scale-105 border border-gray-100">
              <h3 className="text-3xl font-bold text-blue-600 mb-2">{stats.totalLinks.toLocaleString()}</h3>
              <p className="text-gray-700 font-medium">Total Files</p>
              <p className="text-sm text-blue-600 mt-2 font-medium">Click to browse all →</p>
            </a>
            <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100">
              <h3 className="text-3xl font-bold text-green-600 mb-2">{stats.totalUrls.toLocaleString()}</h3>
              <p className="text-gray-700 font-medium">URLs Crawled</p>
            </div>
            <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100">
              <h3 className="text-3xl font-bold text-yellow-600 mb-2">{stats.pendingUrls.toLocaleString()}</h3>
              <p className="text-gray-700 font-medium">Pending URLs</p>
            </div>
            <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100">
              <h3 className="text-3xl font-bold text-red-600 mb-2">{stats.errorUrls.toLocaleString()}</h3>
              <p className="text-gray-700 font-medium">Error URLs</p>
            </div>
          </div>
        )}
      </div>

      {/* Search Form */}
      <div className="bg-white p-8 rounded-xl shadow-xl mb-8 border border-gray-100">
        <form onSubmit={handleSearch} className="space-y-6">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1">
              <label htmlFor="search" className="block text-sm font-semibold text-gray-800 mb-3">
                Search Query
              </label>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-600 w-5 h-5" />
                <input
                  type="text"
                  id="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Enter search term..."
                  className="w-full pl-12 pr-4 py-4 border-2 border-gray-300 rounded-xl bg-white text-gray-900 placeholder-gray-600 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 font-medium"
                />
              </div>
            </div>
            <div className="w-full md:w-56">
              <label htmlFor="type" className="block text-sm font-semibold text-gray-800 mb-3">
                File Type
              </label>
              <select
                id="type"
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full py-4 px-4 border-2 border-gray-300 rounded-xl bg-white text-gray-900 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 font-medium"
              >
                <option value="all">All Types</option>
                <option value="video">Video</option>
                <option value="audio">Audio</option>
                <option value="image">Image</option>
                <option value="text">Text/PDF</option>
                <option value="compressed">Compressed</option>
                <option value="executable">Executable</option>
                <option value="disk">Disk Image</option>
              </select>
            </div>
          </div>
          <button
            type="submit"
            disabled={loading || !searchQuery.trim()}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 px-8 rounded-xl hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
          >
            {loading ? 'Searching...' : 'Search Files'}
          </button>
        </form>
      </div>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <div className="bg-white rounded-xl shadow-xl border border-gray-100">
          <div className="p-8 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">
                Search Results ({searchResults.length} found)
              </h2>
              {selectedLinks.size > 0 && (
                <button
                  onClick={downloadSelected}
                  className="bg-green-600 text-white px-6 py-3 rounded-xl hover:bg-green-700 transition-all duration-200 flex items-center gap-3 font-semibold shadow-lg hover:shadow-xl"
                >
                  <Download className="w-5 h-5" />
                  Download Selected ({selectedLinks.size})
                </button>
              )}
            </div>
          </div>
          
          <div className="p-8">
            <div className="space-y-4">
              {searchResults.map((link) => (
                <div
                  key={link.id}
                  className={`flex items-center justify-between p-6 border-2 rounded-xl hover:bg-gray-50 transition-all duration-200 ${
                    selectedLinks.has(link.id) 
                      ? 'border-blue-500 bg-blue-50 shadow-md' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-5 flex-1">
                    <input
                      type="checkbox"
                      checked={selectedLinks.has(link.id)}
                      onChange={() => toggleLinkSelection(link.id)}
                      className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 focus:ring-2"
                    />
                    {getFileIcon(link.type)}
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 truncate text-lg">{link.name}</h3>
                      <p className="text-gray-700 truncate mt-1">{link.link}</p>
                      <div className="flex items-center space-x-4 mt-2">
                        <span className="inline-block px-3 py-1 text-xs font-semibold bg-gray-100 text-gray-800 rounded-full border">
                          {link.type}
                        </span>
                        <span className="text-sm text-gray-600">
                          {new Date(link.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <a
                    href={link.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-all duration-200 flex items-center gap-2 font-semibold shadow-lg hover:shadow-xl"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* File Types Statistics */}
      {fileTypes.length > 0 && (
        <div className="mt-12 bg-white p-8 rounded-xl shadow-xl border border-gray-100">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">File Type Distribution</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-6">
            {fileTypes.map((fileType) => (
              <a 
                key={fileType.type} 
                href={`/browse?type=${fileType.type}`}
                className="text-center p-6 rounded-xl hover:bg-gray-50 transition-all duration-200 cursor-pointer transform hover:scale-105 border border-gray-200 hover:border-gray-300 hover:shadow-lg"
              >
                <div className="flex justify-center mb-3">
                  {getFileIcon(fileType.type)}
                </div>
                <p className="text-sm font-semibold text-gray-800 capitalize mb-1">{fileType.type}</p>
                <p className="text-2xl font-bold text-gray-900 mb-1">{fileType.count.toLocaleString()}</p>
                <p className="text-xs text-blue-600 font-medium">Click to browse →</p>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 