'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Download, ExternalLink, FileText, Video, Music, Archive, Image, HardDrive, Code } from 'lucide-react';

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

export default function BrowsePage() {
  const [allFiles, setAllFiles] = useState<Link[]>([]);
  const [filteredFiles, setFilteredFiles] = useState<Link[]>([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);
  const [fileTypes, setFileTypes] = useState<FileType[]>([]);
  const [selectedType, setSelectedType] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedFiles, setSelectedFiles] = useState<Set<number>>(new Set());
  const [itemsPerPage, setItemsPerPage] = useState(20);

  useEffect(() => {
    fetchStats();
    fetchAllFiles();
    
    // Check for parameters in URL
    const urlParams = new URLSearchParams(window.location.search);
    const typeParam = urlParams.get('type');
    const pageSizeParam = urlParams.get('pageSize');
    
    if (typeParam) {
      setSelectedType(typeParam);
    }
    if (pageSizeParam && [10, 20, 50].includes(Number(pageSizeParam))) {
      setItemsPerPage(Number(pageSizeParam));
    }
  }, []);

  useEffect(() => {
    filterFiles();
  }, [allFiles, selectedType]);

  useEffect(() => {
    // Update URL when page size changes
    const url = new URL(window.location.href);
    if (itemsPerPage !== 20) {
      url.searchParams.set('pageSize', itemsPerPage.toString());
    } else {
      url.searchParams.delete('pageSize');
    }
    window.history.replaceState({}, '', url.toString());
  }, [itemsPerPage]);

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

  const fetchAllFiles = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/search?q=&type=all&limit=1000');
      const data = await response.json();
      
      if (data.success) {
        setAllFiles(data.results);
      }
    } catch (error) {
      console.error('Error fetching files:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterFiles = () => {
    let filtered = allFiles;

    if (selectedType !== 'all') {
      filtered = filtered.filter(file => file.type === selectedType);
    }

    setFilteredFiles(filtered);
    setCurrentPage(1); // Reset to first page when filtering
    
    // Update URL to reflect current filter and page size
    const url = new URL(window.location.href);
    if (selectedType === 'all') {
      url.searchParams.delete('type');
    } else {
      url.searchParams.set('type', selectedType);
    }
    if (itemsPerPage !== 20) {
      url.searchParams.set('pageSize', itemsPerPage.toString());
    } else {
      url.searchParams.delete('pageSize');
    }
    window.history.replaceState({}, '', url.toString());
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'video': return <Video className="w-5 h-5 text-red-500" />;
      case 'audio': return <Music className="w-5 h-5 text-green-500" />;
      case 'image': return <Image className="w-5 h-5 text-blue-500" />;
      case 'compressed': return <Archive className="w-5 h-5 text-yellow-500" />;
      case 'text': return <FileText className="w-5 h-5 text-gray-500" />;
      case 'executable': return <Code className="w-5 h-5 text-purple-500" />;
      case 'disk': return <HardDrive className="w-5 h-5 text-orange-500" />;
      default: return <FileText className="w-5 h-5 text-gray-500" />;
    }
  };

  const toggleFileSelection = (fileId: number) => {
    const newSelected = new Set(selectedFiles);
    if (newSelected.has(fileId)) {
      newSelected.delete(fileId);
    } else {
      newSelected.add(fileId);
    }
    setSelectedFiles(newSelected);
  };

  const selectAllOnPage = () => {
    const pageFiles = getCurrentPageFiles();
    const pageFileIds = pageFiles.map(file => file.id);
    const newSelected = new Set(selectedFiles);
    
    const allPageSelected = pageFileIds.every(id => newSelected.has(id));
    
    if (allPageSelected) {
      // Deselect all on page
      pageFileIds.forEach(id => newSelected.delete(id));
    } else {
      // Select all on page
      pageFileIds.forEach(id => newSelected.add(id));
    }
    
    setSelectedFiles(newSelected);
  };

  const downloadSelected = () => {
    const selectedUrls = allFiles
      .filter(file => selectedFiles.has(file.id))
      .map(file => file.link);
    
    if (selectedUrls.length === 0) {
      alert('Please select files to download');
      return;
    }

    const urlsText = selectedUrls.join('\n');
    const blob = new Blob([urlsText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'selected_files.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getCurrentPageFiles = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredFiles.slice(startIndex, endIndex);
  };

  const totalPages = Math.ceil(filteredFiles.length / itemsPerPage);

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      window.scrollTo(0, 0);
    }
  };

  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    return pages;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Browse All Files</h1>
        <p className="text-gray-600">Browse through all crawled files with pagination</p>
        {selectedType !== 'all' && (
          <div className="mt-4 flex items-center space-x-2">
            <span className="text-sm text-gray-500">Filtering by:</span>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-700">
              {getFileIcon(selectedType)}
              <span className="ml-2 capitalize">{selectedType}</span>
            </span>
            <button
              onClick={() => setSelectedType('all')}
              className="text-sm text-blue-600 hover:text-blue-800 underline"
            >
              Clear filter
            </button>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500">
            <h3 className="text-2xl font-bold text-blue-600">{stats.totalLinks.toLocaleString()}</h3>
            <p className="text-gray-600">Total Files</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-500">
            <h3 className="text-2xl font-bold text-green-600">{stats.totalUrls.toLocaleString()}</h3>
            <p className="text-gray-600">URLs Crawled</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-yellow-500">
            <h3 className="text-2xl font-bold text-yellow-600">{stats.pendingUrls.toLocaleString()}</h3>
            <p className="text-gray-600">Pending URLs</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-red-500">
            <h3 className="text-2xl font-bold text-red-600">{stats.errorUrls.toLocaleString()}</h3>
            <p className="text-gray-600">Error URLs</p>
          </div>
        </div>
      )}

      {/* Filter Controls */}
      <div className="bg-white p-6 rounded-lg shadow-lg mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center space-x-4">
            <label htmlFor="type-filter" className="text-sm font-medium text-gray-700">
              Filter by Type:
            </label>
            <select
              id="type-filter"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Types ({allFiles.length})</option>
              {fileTypes.map(type => (
                <option key={type.type} value={type.type}>
                  {type.type.charAt(0).toUpperCase() + type.type.slice(1)} ({type.count})
                </option>
              ))}
            </select>
            
            <label htmlFor="page-size" className="text-sm font-medium text-gray-700">
              Per Page:
            </label>
            <select
              id="page-size"
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1); // Reset to first page
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>
          
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">
              Showing {filteredFiles.length} files ({itemsPerPage} per page)
            </span>
            {selectedFiles.size > 0 && (
              <button
                onClick={downloadSelected}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors duration-200 flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Download Selected ({selectedFiles.size})</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* File List */}
      <div className="bg-white rounded-lg shadow-lg">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-800">
              Files {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, filteredFiles.length)} of {filteredFiles.length}
            </h2>
            <button
              onClick={selectAllOnPage}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors duration-200"
            >
              {getCurrentPageFiles().every(file => selectedFiles.has(file.id)) ? 'Deselect Page' : 'Select Page'}
            </button>
          </div>
        </div>
        
        <div className="p-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-2">Loading files...</p>
            </div>
          ) : getCurrentPageFiles().length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600">No files found matching your criteria.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {getCurrentPageFiles().map((file) => (
                <div
                  key={file.id}
                  className={`flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors duration-200 ${
                    selectedFiles.has(file.id) ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-center space-x-4 flex-1 min-w-0">
                    <input
                      type="checkbox"
                      checked={selectedFiles.has(file.id)}
                      onChange={() => toggleFileSelection(file.id)}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    {getFileIcon(file.type)}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-800 truncate">{file.name}</h3>
                      <p className="text-sm text-gray-500 truncate">{file.link}</p>
                      <div className="flex items-center space-x-4 mt-1">
                        <span className="inline-block px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full">
                          {file.type}
                        </span>
                        <span className="text-xs text-gray-400">
                          {new Date(file.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <a
                    href={file.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-3 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center space-x-2"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Open</span>
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-6 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Page {currentPage} of {totalPages}
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                
                {getPageNumbers().map(page => (
                  <button
                    key={page}
                    onClick={() => goToPage(page)}
                    className={`px-4 py-2 border rounded-lg transition-colors duration-200 ${
                      currentPage === page
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                ))}
                
                <button
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 