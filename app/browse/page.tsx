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
        <h1 className="text-4xl font-bold text-gray-900 mb-3 bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">Browse All Files</h1>
        <p className="text-lg text-gray-700">Browse through all crawled files with advanced pagination and filtering</p>
        {selectedType !== 'all' && (
          <div className="mt-6 flex items-center space-x-3">
            <span className="text-sm font-semibold text-gray-800">Filtering by:</span>
            <span className="inline-flex items-center px-4 py-2 rounded-xl text-sm font-semibold bg-blue-100 text-blue-800 border border-blue-200">
              {getFileIcon(selectedType)}
              <span className="ml-2 capitalize">{selectedType}</span>
            </span>
            <button
              onClick={() => setSelectedType('all')}
              className="text-sm text-blue-600 hover:text-blue-800 underline font-medium"
            >
              Clear filter
            </button>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-8 rounded-xl shadow-lg border-l-4 border-blue-500">
            <h3 className="text-3xl font-bold text-blue-600 mb-2">{stats.totalLinks.toLocaleString()}</h3>
            <p className="text-gray-700 font-medium">Total Files</p>
          </div>
          <div className="bg-white p-8 rounded-xl shadow-lg border-l-4 border-green-500">
            <h3 className="text-3xl font-bold text-green-600 mb-2">{stats.totalUrls.toLocaleString()}</h3>
            <p className="text-gray-700 font-medium">URLs Crawled</p>
          </div>
          <div className="bg-white p-8 rounded-xl shadow-lg border-l-4 border-yellow-500">
            <h3 className="text-3xl font-bold text-yellow-600 mb-2">{stats.pendingUrls.toLocaleString()}</h3>
            <p className="text-gray-700 font-medium">Pending URLs</p>
          </div>
          <div className="bg-white p-8 rounded-xl shadow-lg border-l-4 border-red-500">
            <h3 className="text-3xl font-bold text-red-600 mb-2">{stats.errorUrls.toLocaleString()}</h3>
            <p className="text-gray-700 font-medium">Error URLs</p>
          </div>
        </div>
      )}

      {/* Filter Controls */}
      <div className="bg-white p-8 rounded-xl shadow-xl mb-8 border border-gray-100">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-6">
            <div className="flex items-center space-x-3">
              <label htmlFor="type-filter" className="text-sm font-semibold text-gray-800">
                Filter by Type:
              </label>
              <select
                id="type-filter"
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="px-4 py-3 border-2 border-gray-300 rounded-xl bg-white text-gray-900 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 font-medium min-w-40"
              >
                <option value="all">All Types ({allFiles.length})</option>
                {fileTypes.map(type => (
                  <option key={type.type} value={type.type}>
                    {type.type.charAt(0).toUpperCase() + type.type.slice(1)} ({type.count})
                  </option>
                ))}
              </select>
            </div>
            
            <div className="flex items-center space-x-3">
              <label htmlFor="page-size" className="text-sm font-semibold text-gray-800">
                Per Page:
              </label>
              <select
                id="page-size"
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1); // Reset to first page
                }}
                className="px-4 py-3 border-2 border-gray-300 rounded-xl bg-white text-gray-900 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 font-medium"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
            <span className="text-sm font-medium text-gray-700">
              Showing {filteredFiles.length} files ({itemsPerPage} per page)
            </span>
            {selectedFiles.size > 0 && (
              <button
                onClick={downloadSelected}
                className="bg-green-600 text-white px-6 py-3 rounded-xl hover:bg-green-700 transition-all duration-200 flex items-center space-x-2 font-semibold shadow-lg hover:shadow-xl"
              >
                <Download className="w-4 h-4" />
                <span>Download Selected ({selectedFiles.size})</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* File List */}
      <div className="bg-white rounded-xl shadow-xl border border-gray-100">
        <div className="p-8 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900">
              Files {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, filteredFiles.length)} of {filteredFiles.length}
            </h2>
            <button
              onClick={selectAllOnPage}
              className="bg-gray-600 text-white px-6 py-3 rounded-xl hover:bg-gray-700 transition-all duration-200 font-semibold shadow-lg"
            >
              {getCurrentPageFiles().every(file => selectedFiles.has(file.id)) ? 'Deselect Page' : 'Select Page'}
            </button>
          </div>
        </div>
        
        <div className="p-8">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-700 font-medium">Loading files...</p>
            </div>
          ) : getCurrentPageFiles().length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-700 font-medium">No files found matching your criteria.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {getCurrentPageFiles().map((file) => (
                <div
                  key={file.id}
                  className={`flex items-center justify-between p-6 border-2 rounded-xl hover:bg-gray-50 transition-all duration-200 ${
                    selectedFiles.has(file.id) ? 'border-blue-500 bg-blue-50 shadow-md' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-5 flex-1 min-w-0">
                    <input
                      type="checkbox"
                      checked={selectedFiles.has(file.id)}
                      onChange={() => toggleFileSelection(file.id)}
                      className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 focus:ring-2"
                    />
                    {getFileIcon(file.type)}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate text-lg">{file.name}</h3>
                      <p className="text-gray-700 truncate mt-1">{file.link}</p>
                      <div className="flex items-center space-x-4 mt-2">
                        <span className="inline-block px-3 py-1 text-xs font-semibold bg-gray-100 text-gray-800 rounded-full border">
                          {file.type}
                        </span>
                        <span className="text-sm text-gray-600">
                          {new Date(file.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <a
                    href={file.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-3 bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-all duration-200 flex items-center space-x-2 font-semibold shadow-lg hover:shadow-xl"
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
          <div className="p-8 border-t border-gray-200 bg-gray-50 rounded-b-xl">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium text-gray-800">
                Page {currentPage} of {totalPages}
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="p-3 border-2 border-gray-300 rounded-xl hover:bg-white hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                
                {getPageNumbers().map(page => (
                  <button
                    key={page}
                    onClick={() => goToPage(page)}
                    className={`px-4 py-3 border-2 rounded-xl transition-all duration-200 font-semibold ${
                      currentPage === page
                        ? 'bg-blue-600 text-white border-blue-600 shadow-lg'
                        : 'border-gray-300 hover:bg-white hover:border-gray-400 text-gray-700 shadow-sm'
                    }`}
                  >
                    {page}
                  </button>
                ))}
                
                <button
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="p-3 border-2 border-gray-300 rounded-xl hover:bg-white hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 