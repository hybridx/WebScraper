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
  const [stats, setStats] = useState<Stats | null>(null);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');
  const [urls, setUrls] = useState<CrawledUrl[]>([]);
  const [selectedUrls, setSelectedUrls] = useState<Set<string>>(new Set());
  const [healthStatus, setHealthStatus] = useState<any>(null);

  useEffect(() => {
    fetchStats();
    fetchUrls();
    fetchHealthStatus();
  }, []);

  const fetchHealthStatus = async () => {
    try {
      const response = await fetch('/api/health');
      const data = await response.json();
      setHealthStatus(data);
    } catch (error) {
      console.error('Error fetching health status:', error);
    }
  };

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

      if (!response.ok) {
        if (response.status === 405) {
          showMessage('⚠️ API Error: Method not allowed. Please redeploy the application.', 'error');
          return;
        }
        showMessage(`⚠️ Server Error: ${response.status} ${response.statusText}`, 'error');
        return;
      }

      const data = await response.json();

      if (data.success) {
        showMessage('URL added to crawl queue successfully!', 'success');
        setUrl('');
        fetchStats();
        fetchUrls();
      } else {
        const errorMsg = data.error || 'Failed to add URL';
        if (errorMsg.includes('SETUP_REQUIRED')) {
          showMessage('⚠️ Setup Required: Please configure Supabase environment variables in Vercel dashboard', 'error');
        } else if (errorMsg.includes('TABLES_MISSING')) {
          showMessage('⚠️ Database Setup: Please run the SQL schema in your Supabase dashboard', 'error');
        } else {
          showMessage(errorMsg, 'error');
        }
      }
    } catch (error) {
      console.error('Error adding URL:', error);
      showMessage('Failed to add URL. Please try again.', 'error');
    } finally {
      setLoading(false);
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
                className="w-full px-4 py-3 border-2 border-gray-400 rounded-lg bg-white text-gray-900 placeholder-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
                required
              />
              <p className="mt-2 text-sm text-gray-700">
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
                className="w-full px-4 py-3 border-2 border-gray-400 rounded-lg bg-white text-gray-900 placeholder-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
                required
              />
              <p className="mt-2 text-sm text-gray-700">
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

        {/* GitHub Actions Crawler Control */}
        <div className="bg-white p-8 rounded-lg shadow-lg">
          <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center space-x-2">
            <Play className="w-5 h-5" />
            <span>GitHub Actions Crawler</span>
          </h2>

          <div className="space-y-6">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="flex items-center space-x-2 mb-2">
                <CheckCircle className="w-5 h-5 text-blue-600" />
                <span className="font-medium text-blue-800">GitHub Actions Integration</span>
              </div>
              <p className="text-sm text-blue-900">
                Crawling now runs via GitHub Actions workflows, bypassing Vercel serverless limitations.
                This provides better reliability and handles authentication issues.
              </p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium text-gray-800 mb-2">How it works:</h3>
              <ul className="text-sm text-gray-800 space-y-1">
                <li>• Add URLs to the crawl queue using the form on the left</li>
                <li>• Click "Start GitHub Crawl" to trigger workflows</li>
                <li>• GitHub Actions will crawl URLs and store results in database</li>
                <li>• Files appear in 2-3 minutes after workflow completion</li>
                <li>• Check GitHub repository Actions tab for progress</li>
              </ul>
            </div>

            {/* Health Status Display */}
            {healthStatus && (
              <div className={`p-4 rounded-lg border mb-4 ${
                healthStatus.database?.status === 'connected' 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-red-50 border-red-200'
              }`}>
                <div className="flex items-center space-x-2 mb-2">
                  {healthStatus.database?.status === 'connected' ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-600" />
                  )}
                  <span className={`font-medium ${
                    healthStatus.database?.status === 'connected' 
                      ? 'text-green-800' 
                      : 'text-red-800'
                  }`}>
                    System Status: {healthStatus.database?.status === 'connected' ? 'Ready' : 'Configuration Required'}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <p className={`font-medium mb-1 ${
                      healthStatus.database?.status === 'connected' ? 'text-green-800' : 'text-red-800'
                    }`}>Environment Variables:</p>
                    <ul className={`space-y-1 ${
                      healthStatus.database?.status === 'connected' ? 'text-green-700' : 'text-red-700'
                    }`}>
                      <li>SUPABASE_URL: {healthStatus.environment?.SUPABASE_URL ? '✅' : '❌'}</li>
                      <li>SUPABASE_ANON_KEY: {healthStatus.environment?.SUPABASE_ANON_KEY ? '✅' : '❌'}</li>
                      <li>POSTGRES_URL: {healthStatus.environment?.POSTGRES_URL ? '✅' : '❌'}</li>
                    </ul>
                  </div>
                  <div>
                    <p className={`font-medium mb-1 ${
                      healthStatus.database?.status === 'connected' ? 'text-green-800' : 'text-red-800'
                    }`}>Database Status:</p>
                    <p className={`text-xs ${
                      healthStatus.database?.status === 'connected' ? 'text-green-700' : 'text-red-700'
                    }`}>
                      {healthStatus.database?.status === 'connected' 
                        ? '✅ Connected and ready' 
                        : `❌ ${healthStatus.database?.error || 'Connection failed'}`
                      }
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
              <div className="flex items-center space-x-2 mb-2">
                <AlertCircle className="w-5 h-5 text-amber-600" />
                <span className="font-medium text-amber-800">Setup Instructions</span>
              </div>
              <p className="text-sm text-amber-900 mb-3">
                <strong>To use the WebScraper, ensure these are configured:</strong>
              </p>
              <ol className="text-sm text-amber-900 space-y-2 mb-3">
                <li><strong>1.</strong> Create a Supabase project at <a href="https://supabase.com/dashboard" target="_blank" className="underline font-medium">supabase.com</a></li>
                <li><strong>2.</strong> Add <code className="bg-amber-100 px-1 rounded">SUPABASE_URL</code> environment variable in <a href="https://vercel.com/dashboard" target="_blank" className="underline font-medium">Vercel dashboard</a></li>
                <li><strong>3.</strong> Run the SQL schema from <code className="bg-amber-100 px-1 rounded">supabase-schema.sql</code> in your Supabase SQL Editor</li>
                <li><strong>4.</strong> Check the system status above for confirmation</li>
              </ol>
              <button
                onClick={fetchHealthStatus}
                className="bg-amber-600 text-white px-3 py-1 rounded text-sm hover:bg-amber-700 transition-colors"
              >
                🔄 Refresh Status
              </button>
            </div>

            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <div className="flex items-center space-x-2 mb-2">
                <AlertCircle className="w-5 h-5 text-yellow-600" />
                <span className="font-medium text-yellow-800">GitHub Actions Integration</span>
              </div>
              <p className="text-sm text-yellow-900 mb-2">
                <strong>Manual Crawling (Available Now):</strong>
              </p>
              <ol className="text-sm text-yellow-900 space-y-1 mb-3">
                <li>1. Go to <a href="https://github.com/hybridx/WebScraper/actions" target="_blank" className="underline font-medium">GitHub Actions</a></li>
                <li>2. Click "🕷️ Crawl and Store Files" → "Run workflow"</li>
                <li>3. Enter URL to crawl and configure options:</li>
                <li className="ml-4">• <strong>Recursive crawling:</strong> Enable to crawl subdirectories</li>
                <li className="ml-4">• <strong>Max depth:</strong> Set crawl depth (1-5 levels deep)</li>
                <li>4. Click "Run workflow" - files appear in 2-3 minutes</li>
              </ol>
              <div className="bg-yellow-100 p-3 rounded border border-yellow-300 mb-3">
                <p className="text-sm text-yellow-900 font-medium mb-2">🆕 New Recursive Crawling Features:</p>
                <ul className="text-sm text-yellow-900 space-y-1">
                  <li>• <strong>Folder Discovery:</strong> Automatically finds and crawls subdirectories</li>
                  <li>• <strong>Depth Control:</strong> Set how deep to crawl (prevents infinite loops)</li>
                  <li>• <strong>Smart Detection:</strong> Recognizes folders vs files in directory listings</li>
                  <li>• <strong>Error Handling:</strong> Continues crawling even if some folders fail</li>
                  <li>• <strong>Performance:</strong> Limits subdirectories per level to prevent timeouts</li>
                </ul>
              </div>
              <p className="text-sm text-yellow-900">
                <strong>Recommended settings:</strong> Depth 2-3 for most sites, Depth 1 for large sites
              </p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg border">
              <div className="flex items-center space-x-2 mb-2">
                <AlertCircle className="w-5 h-5 text-gray-600" />
                <span className="font-medium text-gray-800">Troubleshooting</span>
              </div>
              <p className="text-sm text-gray-800 mb-2">
                <strong>If new crawled data doesn't appear:</strong>
              </p>
              <ul className="text-sm text-gray-800 space-y-1">
                <li>• Add Supabase environment variables in Vercel Dashboard</li>
                <li>• <code className="bg-gray-200 px-1 rounded">NEXT_PUBLIC_SUPABASE_URL</code></li>
                <li>• <code className="bg-gray-200 px-1 rounded">NEXT_PUBLIC_SUPABASE_ANON_KEY</code></li>
                <li>• Redeploy after adding variables</li>
              </ul>
            </div>

            <a
              href="https://github.com/hybridx/WebScraper/actions/workflows/crawl-and-store.yml"
              target="_blank"
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center justify-center space-x-2"
            >
              <Play className="w-4 h-4" />
              <span>🚀 Open GitHub Actions</span>
            </a>

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
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors duration-200 flex items-center space-x-2"
            >
              <input
                type="checkbox"
                checked={selectedUrls.size === urls.length && urls.length > 0}
                onChange={() => {}}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 pointer-events-none"
              />
              <span>{selectedUrls.size === urls.length && urls.length > 0 ? 'Deselect All' : 'Select All'}</span>
            </button>
            <button
              onClick={handleDeleteSelected}
              disabled={selectedUrls.size === 0 || !password.trim()}
              className={`px-4 py-2 rounded-lg transition-colors duration-200 flex items-center space-x-2 ${
                selectedUrls.size === 0 
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                  : password.trim()
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'bg-red-400 text-white cursor-not-allowed'
              }`}
            >
              <span>Delete Selected {selectedUrls.size > 0 ? `(${selectedUrls.size})` : ''}</span>
            </button>
          </div>
        </div>

        {/* Instructions for delete functionality */}
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>💡 How to delete:</strong> Check the boxes next to URLs you want to delete, then click "Delete Selected". 
            Make sure you've entered your admin password in the form above first.
          </p>
        </div>

        {urls.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600">No URLs found. Add some URLs to get started.</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {urls.map((urlObj) => (
              <div
                key={urlObj.id}
                className={`flex items-center justify-between p-4 border-2 rounded-lg hover:bg-gray-50 transition-all duration-200 cursor-pointer ${
                  selectedUrls.has(urlObj.url) 
                    ? 'border-blue-500 bg-blue-50 shadow-md' 
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                onClick={() => toggleUrlSelection(urlObj.url)}
              >
                <div className="flex items-center space-x-4 flex-1">
                  <input
                    type="checkbox"
                    checked={selectedUrls.has(urlObj.url)}
                    onChange={() => toggleUrlSelection(urlObj.url)}
                    className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 focus:ring-2"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900 truncate text-sm">{urlObj.url}</h3>
                    <div className="flex items-center space-x-4 mt-1">
                      <span className={`inline-block px-3 py-1 text-xs font-medium rounded-full ${
                        urlObj.status === 'completed' ? 'bg-green-100 text-green-800 border border-green-200' :
                        urlObj.status === 'pending' ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' :
                        'bg-red-100 text-red-800 border border-red-200'
                      }`}>
                        {urlObj.status}
                      </span>
                      <span className="text-xs text-gray-600">
                        Added: {new Date(urlObj.created_at).toLocaleDateString()}
                      </span>
                      {urlObj.last_crawled && (
                        <span className="text-xs text-gray-600">
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
                  className="ml-3 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 text-sm font-medium shadow-sm"
                  onClick={(e) => e.stopPropagation()}
                >
                  Visit
                </a>
              </div>
            ))}
          </div>
        )}

        {/* Selection Summary */}
        {selectedUrls.size > 0 && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>{selectedUrls.size} URL{selectedUrls.size === 1 ? '' : 's'} selected.</strong> 
              {!password.trim() && (
                <span className="ml-2 text-red-700">⚠️ Enter admin password above to enable deletion.</span>
              )}
            </p>
          </div>
        )}
      </div>
    </div>
  );
} 