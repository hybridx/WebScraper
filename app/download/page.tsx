'use client';

import { useState, useEffect } from 'react';
import { Download, Trash2, ExternalLink, Copy, Check, FileText, Code } from 'lucide-react';

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
        <h1 className="text-4xl font-bold text-gray-900 mb-3 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Bulk Download Manager</h1>
        <p className="text-lg text-gray-700">Select multiple files and download them using various methods and formats</p>
      </div>

      {/* Controls */}
      <div className="bg-white p-8 rounded-xl shadow-xl mb-8 border border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div>
            <label htmlFor="search" className="block text-sm font-semibold text-gray-800 mb-3">
              Search Files
            </label>
            <input
              type="text"
              id="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name or URL..."
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl bg-white text-gray-900 placeholder-gray-600 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 font-medium"
            />
          </div>
          
          <div>
            <label htmlFor="type" className="block text-sm font-semibold text-gray-800 mb-3">
              Filter by Type
            </label>
            <select
              id="type"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl bg-white text-gray-900 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 font-medium"
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
              className="w-full bg-gray-600 text-white py-3 px-6 rounded-xl hover:bg-gray-700 transition-all duration-200 font-semibold shadow-lg"
            >
              {selectedLinks.size === filteredLinks.length ? 'Deselect All' : 'Select All'}
            </button>
          </div>
        </div>

        {/* Download Actions */}
        {selectedLinks.size > 0 && (
          <div className="border-t-2 border-gray-200 pt-8">
            <div className="flex items-center justify-between mb-6">
              <span className="text-sm font-semibold text-gray-800 bg-blue-100 px-4 py-2 rounded-full border border-blue-200">
                {selectedLinks.size} files selected
              </span>
              <button
                onClick={copyToClipboard}
                className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl"
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
                className="bg-green-600 text-white py-4 px-6 rounded-xl hover:bg-green-700 transition-all duration-200 flex items-center justify-center space-x-2 font-semibold shadow-lg hover:shadow-xl"
              >
                <Download className="w-5 h-5" />
                <span>Download as TXT</span>
              </button>
              
              <button
                onClick={() => downloadSelected('wget')}
                className="bg-orange-600 text-white py-4 px-6 rounded-xl hover:bg-orange-700 transition-all duration-200 flex items-center justify-center space-x-2 font-semibold shadow-lg hover:shadow-xl"
              >
                <Download className="w-5 h-5" />
                <span>Download as wget script</span>
              </button>
              
              <button
                onClick={() => downloadSelected('aria2')}
                className="bg-purple-600 text-white py-4 px-6 rounded-xl hover:bg-purple-700 transition-all duration-200 flex items-center justify-center space-x-2 font-semibold shadow-lg hover:shadow-xl"
              >
                <Download className="w-5 h-5" />
                <span>Download for aria2</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* File List */}
      <div className="bg-white rounded-xl shadow-xl border border-gray-100">
        <div className="p-8 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">
            Available Files ({filteredLinks.length} total)
          </h2>
        </div>
        
        <div className="p-8">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-700 font-medium">Loading files...</p>
            </div>
          ) : filteredLinks.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-700 font-medium">No files found matching your criteria.</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {filteredLinks.map((link) => (
                <div
                  key={link.id}
                  className={`flex items-center justify-between p-4 border-2 rounded-xl hover:bg-gray-50 transition-all duration-200 ${
                    selectedLinks.has(link.id) ? 'border-blue-500 bg-blue-50 shadow-md' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-4 flex-1 min-w-0">
                    <input
                      type="checkbox"
                      checked={selectedLinks.has(link.id)}
                      onChange={() => toggleLinkSelection(link.id)}
                      className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 focus:ring-2"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">{link.name}</h3>
                      <p className="text-gray-700 truncate mt-1">{link.link}</p>
                      <div className="flex items-center space-x-3 mt-2">
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
                    className="ml-3 bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition-all duration-200 flex items-center space-x-2 text-sm font-semibold shadow-lg"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Open</span>
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-8 bg-gradient-to-r from-gray-50 to-blue-50 p-8 rounded-xl border border-gray-200">
        <h3 className="text-xl font-bold text-gray-900 mb-6">Download Instructions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-sm">
          <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
            <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
              <FileText className="w-5 h-5 text-green-600 mr-2" />
              TXT File
            </h4>
            <p className="text-gray-700">Simple list of URLs, one per line. Use with any download manager or browser extension.</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
            <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
              <Code className="w-5 h-5 text-orange-600 mr-2" />
              wget Script
            </h4>
            <p className="text-gray-700">Ready-to-run bash script: <code className="bg-gray-200 px-2 py-1 rounded font-mono text-xs">bash download_script.sh</code></p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
            <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
              <Download className="w-5 h-5 text-purple-600 mr-2" />
              aria2 File
            </h4>
            <p className="text-gray-700">Use with aria2: <code className="bg-gray-200 px-2 py-1 rounded font-mono text-xs">aria2c -i download_links.aria2</code></p>
          </div>
        </div>
      </div>
    </div>
  );
} 