'use client';

import { useState, useEffect } from 'react';
import { Download, Trash2, ExternalLink, Copy, Check } from 'lucide-react';

interface Link {
  id: number;
  name: string;
  link: string;
  type: string;
  created_at: string;
}

export default function DownloadPage() {
  const [selectedLinks, setSelectedLinks] = useState<Set<number>>(new Set());
  const [allLinks, setAllLinks] = useState<Link[]>([]);
  const [filteredLinks, setFilteredLinks] = useState<Link[]>([]);
  const [loading, setLoading] = useState(false);
  const [typeFilter, setTypeFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchAllLinks();
  }, []);

  useEffect(() => {
    filterLinks();
  }, [allLinks, typeFilter, searchQuery]);

  const fetchAllLinks = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/search?q=&type=all&limit=1000');
      const data = await response.json();
      
      if (data.success) {
        setAllLinks(data.results);
      }
    } catch (error) {
      console.error('Error fetching links:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterLinks = () => {
    let filtered = allLinks;

    if (typeFilter !== 'all') {
      filtered = filtered.filter(link => link.type === typeFilter);
    }

    if (searchQuery.trim()) {
      filtered = filtered.filter(link => 
        link.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        link.link.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredLinks(filtered);
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

  const selectAll = () => {
    if (selectedLinks.size === filteredLinks.length) {
      setSelectedLinks(new Set());
    } else {
      setSelectedLinks(new Set(filteredLinks.map(link => link.id)));
    }
  };

  const downloadSelected = (format: 'txt' | 'wget' | 'aria2') => {
    const selectedUrls = filteredLinks
      .filter(link => selectedLinks.has(link.id))
      .map(link => link.link);
    
    if (selectedUrls.length === 0) {
      alert('Please select links to download');
      return;
    }

    let content = '';
    let filename = '';

    switch (format) {
      case 'txt':
        content = selectedUrls.join('\n');
        filename = 'download_links.txt';
        break;
      case 'wget':
        content = selectedUrls.map(url => `wget "${url}"`).join('\n');
        filename = 'download_script.sh';
        break;
      case 'aria2':
        content = selectedUrls.join('\n');
        filename = 'download_links.aria2';
        break;
    }

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const copyToClipboard = async () => {
    const selectedUrls = filteredLinks
      .filter(link => selectedLinks.has(link.id))
      .map(link => link.link);
    
    if (selectedUrls.length === 0) {
      alert('Please select links to copy');
      return;
    }

    try {
      await navigator.clipboard.writeText(selectedUrls.join('\n'));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      alert('Failed to copy to clipboard');
    }
  };

  const getFileTypes = () => {
    const types = Array.from(new Set(allLinks.map(link => link.type)));
    return types.sort();
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Bulk Download Manager</h1>
        <p className="text-gray-600">Select multiple files and download them using various methods</p>
      </div>

      {/* Controls */}
      <div className="bg-white p-6 rounded-lg shadow-lg mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
              Search Files
            </label>
            <input
              type="text"
              id="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name or URL..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Type
            </label>
            <select
              id="type"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Types</option>
              {getFileTypes().map(type => (
                <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={selectAll}
              className="w-full bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors duration-200"
            >
              {selectedLinks.size === filteredLinks.length ? 'Deselect All' : 'Select All'}
            </button>
          </div>
        </div>

        {/* Download Actions */}
        {selectedLinks.size > 0 && (
          <div className="border-t pt-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-gray-700">
                {selectedLinks.size} files selected
              </span>
              <button
                onClick={copyToClipboard}
                className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copy URLs</span>
                  </>
                )}
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => downloadSelected('txt')}
                className="bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors duration-200 flex items-center justify-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Download as TXT</span>
              </button>
              
              <button
                onClick={() => downloadSelected('wget')}
                className="bg-orange-600 text-white py-3 px-4 rounded-lg hover:bg-orange-700 transition-colors duration-200 flex items-center justify-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Download as wget script</span>
              </button>
              
              <button
                onClick={() => downloadSelected('aria2')}
                className="bg-purple-600 text-white py-3 px-4 rounded-lg hover:bg-purple-700 transition-colors duration-200 flex items-center justify-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Download for aria2</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* File List */}
      <div className="bg-white rounded-lg shadow-lg">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">
            Available Files ({filteredLinks.length} total)
          </h2>
        </div>
        
        <div className="p-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-2">Loading files...</p>
            </div>
          ) : filteredLinks.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600">No files found matching your criteria.</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredLinks.map((link) => (
                <div
                  key={link.id}
                  className={`flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors duration-200 ${
                    selectedLinks.has(link.id) ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <input
                      type="checkbox"
                      checked={selectedLinks.has(link.id)}
                      onChange={() => toggleLinkSelection(link.id)}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-800 truncate">{link.name}</h3>
                      <p className="text-sm text-gray-500 truncate">{link.link}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="inline-block px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full">
                          {link.type}
                        </span>
                        <span className="text-xs text-gray-400">
                          {new Date(link.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <a
                    href={link.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-3 bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition-colors duration-200 flex items-center space-x-1 text-sm"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span>Open</span>
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-8 bg-gray-50 p-6 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Download Instructions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
          <div>
            <h4 className="font-medium text-gray-700 mb-2">TXT File</h4>
            <p className="text-gray-600">Simple list of URLs, one per line. Use with any download manager.</p>
          </div>
          <div>
            <h4 className="font-medium text-gray-700 mb-2">wget Script</h4>
            <p className="text-gray-600">Bash script ready to run: <code className="bg-gray-200 px-1 rounded">bash download_script.sh</code></p>
          </div>
          <div>
            <h4 className="font-medium text-gray-700 mb-2">aria2 File</h4>
            <p className="text-gray-600">Use with aria2: <code className="bg-gray-200 px-1 rounded">aria2c -i download_links.aria2</code></p>
          </div>
        </div>
      </div>
    </div>
  );
} 