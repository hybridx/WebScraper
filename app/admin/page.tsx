'use client';

import { useState, useEffect } from 'react';
import { Plus, Play, RefreshCw, AlertCircle, CheckCircle, Globe, Database } from 'lucide-react';

interface Stats {
  totalLinks: number;
  totalUrls: number;
  pendingUrls: number;
  errorUrls: number;
}

interface CrawledUrl {
  id: number;
  url: string;
  status: 'pending' | 'completed' | 'error';
  last_crawled?: string;
  created_at: string;
}

export default function AdminPage() {
  const [url, setUrl] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [crawling, setCrawling] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');
  const [urls, setUrls] = useState<CrawledUrl[]>([]);
  const [selectedUrls, setSelectedUrls] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchStats();
    fetchUrls();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/stats');
      const data = await response.json();
      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchUrls = async () => {
    try {
      const response = await fetch('/api/admin/urls');
      const data = await response.json();
      if (data.success) {
        setUrls(data.urls);
      }
    } catch (error) {
      console.error('Error fetching URLs:', error);
    }
  };

  const showMessage = (msg: string, type: 'success' | 'error') => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => setMessage(''), 5000);
  };

  const handleAddUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim() || !password.trim()) {
      showMessage('Please enter both URL and password', 'error');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/admin/add-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url, password }),
      });

      const data = await response.json();

      if (data.success) {
        showMessage('URL added to crawl queue successfully!', 'success');
        setUrl('');
        fetchStats();
        fetchUrls();
      } else {
        showMessage(data.error || 'Failed to add URL', 'error');
      }
    } catch (error) {
      console.error('Error adding URL:', error);
      showMessage('Failed to add URL. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleStartCrawling = async () => {
    if (!password.trim()) {
      showMessage('Please enter password first', 'error');
      return;
    }

    setCrawling(true);
    try {
      // Get pending URLs and crawl them
      const pendingUrls = urls.filter(url => url.status === 'pending');
      
      if (pendingUrls.length === 0) {
        showMessage('No pending URLs to crawl', 'error');
        setCrawling(false);
        return;
      }

      showMessage(`Starting to crawl ${pendingUrls.length} URLs...`, 'success');

      // Crawl each pending URL
      for (const urlObj of pendingUrls.slice(0, 3)) { // Limit to 3 URLs to avoid timeouts
        try {
          const response = await fetch('/api/crawler', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ url: urlObj.url }),
          });

          const result = await response.json();
          if (result.success) {
            showMessage(`Successfully crawled ${urlObj.url}: ${result.total_links} files found`, 'success');
          } else {
            showMessage(`Failed to crawl ${urlObj.url}: ${result.error}`, 'error');
          }
        } catch (error) {
          showMessage(`Error crawling ${urlObj.url}: ${String(error)}`, 'error');
        }
      }

      // Refresh data
      fetchStats();
      fetchUrls();
      
    } catch (error) {
      console.error('Error starting crawler:', error);
      showMessage('Failed to start crawling. Please try again.', 'error');
    } finally {
      setCrawling(false);
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedUrls.size === 0) {
      showMessage('Please select URLs to delete', 'error');
      return;
    }

    if (!password.trim()) {
      showMessage('Please enter password first', 'error');
      return;
    }

    try {
      for (const url of Array.from(selectedUrls)) {
        const response = await fetch('/api/admin/delete-url', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ url, password }),
        });

        const data = await response.json();
        if (!data.success) {
          showMessage(`Failed to delete ${url}: ${data.error}`, 'error');
          return;
        }
      }

      showMessage(`Successfully deleted ${selectedUrls.size} URLs`, 'success');
      setSelectedUrls(new Set());
      fetchStats();
      fetchUrls();
    } catch (error) {
      console.error('Error deleting URLs:', error);
      showMessage('Failed to delete URLs. Please try again.', 'error');
    }
  };

  const toggleUrlSelection = (url: string) => {
    const newSelected = new Set(selectedUrls);
    if (newSelected.has(url)) {
      newSelected.delete(url);
    } else {
      newSelected.add(url);
    }
    setSelectedUrls(newSelected);
  };

  const selectAllUrls = () => {
    if (selectedUrls.size === urls.length) {
      setSelectedUrls(new Set());
    } else {
      setSelectedUrls(new Set(urls.map(url => url.url)));
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Admin Panel</h1>
        <p className="text-gray-600">Manage URLs to crawl and monitor system status</p>
      </div>

      {/* Message Display */}
      {message && (
        <div className={`mb-6 p-4 rounded-lg flex items-center space-x-3 ${
          messageType === 'success' 
            ? 'bg-green-50 text-green-800 border border-green-200' 
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {messageType === 'success' ? (
            <CheckCircle className="w-5 h-5 text-green-600" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600" />
          )}
          <span>{message}</span>
        </div>
      )}

      {/* Stats Dashboard */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500">
            <div className="flex items-center space-x-3">
              <Database className="w-8 h-8 text-blue-600" />
              <div>
                <h3 className="text-2xl font-bold text-gray-800">{stats.totalLinks.toLocaleString()}</h3>
                <p className="text-gray-600">Total Files</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-500">
            <div className="flex items-center space-x-3">
              <Globe className="w-8 h-8 text-green-600" />
              <div>
                <h3 className="text-2xl font-bold text-gray-800">{stats.totalUrls.toLocaleString()}</h3>
                <p className="text-gray-600">URLs Crawled</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-yellow-500">
            <div className="flex items-center space-x-3">
              <RefreshCw className="w-8 h-8 text-yellow-600" />
              <div>
                <h3 className="text-2xl font-bold text-gray-800">{stats.pendingUrls.toLocaleString()}</h3>
                <p className="text-gray-600">Pending URLs</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-red-500">
            <div className="flex items-center space-x-3">
              <AlertCircle className="w-8 h-8 text-red-600" />
              <div>
                <h3 className="text-2xl font-bold text-gray-800">{stats.errorUrls.toLocaleString()}</h3>
                <p className="text-gray-600">Error URLs</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Add URL Form */}
        <div className="bg-white p-8 rounded-lg shadow-lg">
          <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center space-x-2">
            <Plus className="w-5 h-5" />
            <span>Add URL to Crawl</span>
          </h2>
          
          <form onSubmit={handleAddUrl} className="space-y-6">
            <div>
              <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-2">
                Directory Listing URL
              </label>
              <input
                type="url"
                id="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com/files/"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
              <p className="mt-2 text-sm text-gray-500">
                Enter the URL of a directory listing page (e.g., Apache directory index)
              </p>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Admin Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter admin password"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
              <p className="mt-2 text-sm text-gray-500">
                Default password: admin123
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Adding...</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Add URL</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Crawler Control */}
        <div className="bg-white p-8 rounded-lg shadow-lg">
          <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center space-x-2">
            <Play className="w-5 h-5" />
            <span>Crawler Control</span>
          </h2>

          <div className="space-y-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium text-gray-800 mb-2">How it works:</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Add URLs to the crawl queue using the form on the left</li>
                <li>• The crawler will scan directory listings for media files</li>
                <li>• Files are automatically categorized by type</li>
                <li>• Use the search page to find and download files</li>
              </ul>
            </div>

            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <div className="flex items-center space-x-2 mb-2">
                <AlertCircle className="w-5 h-5 text-yellow-600" />
                <span className="font-medium text-yellow-800">Note</span>
              </div>
              <p className="text-sm text-yellow-700">
                The crawler runs automatically when URLs are added. 
                Check the stats above to monitor progress.
              </p>
            </div>

            <button
              onClick={handleStartCrawling}
              disabled={crawling || !password.trim()}
              className="w-full bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center space-x-2"
            >
              {crawling ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Crawling...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  <span>Start Manual Crawl</span>
                </>
              )}
            </button>

            <button
              onClick={fetchStats}
              className="w-full bg-gray-600 text-white py-3 px-6 rounded-lg hover:bg-gray-700 transition-colors duration-200 flex items-center justify-center space-x-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh Stats</span>
            </button>
          </div>
        </div>
      </div>

      {/* URL Management Section */}
      <div className="mt-8 bg-white p-8 rounded-lg shadow-lg">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-800">Manage Crawled URLs</h2>
          <div className="flex space-x-4">
            <button
              onClick={selectAllUrls}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors duration-200"
            >
              {selectedUrls.size === urls.length ? 'Deselect All' : 'Select All'}
            </button>
            {selectedUrls.size > 0 && (
              <button
                onClick={handleDeleteSelected}
                disabled={!password.trim()}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center space-x-2"
              >
                <span>Delete Selected ({selectedUrls.size})</span>
              </button>
            )}
          </div>
        </div>

        {urls.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600">No URLs found. Add some URLs to get started.</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {urls.map((urlObj) => (
              <div
                key={urlObj.id}
                className={`flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors duration-200 ${
                  selectedUrls.has(urlObj.url) ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                }`}
              >
                <div className="flex items-center space-x-4 flex-1">
                  <input
                    type="checkbox"
                    checked={selectedUrls.has(urlObj.url)}
                    onChange={() => toggleUrlSelection(urlObj.url)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-800 truncate">{urlObj.url}</h3>
                    <div className="flex items-center space-x-4 mt-1">
                      <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                        urlObj.status === 'completed' ? 'bg-green-100 text-green-700' :
                        urlObj.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {urlObj.status}
                      </span>
                      <span className="text-xs text-gray-400">
                        Added: {new Date(urlObj.created_at).toLocaleDateString()}
                      </span>
                      {urlObj.last_crawled && (
                        <span className="text-xs text-gray-400">
                          Last crawled: {new Date(urlObj.last_crawled).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <a
                  href={urlObj.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-3 bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition-colors duration-200 text-sm"
                >
                  Visit
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 