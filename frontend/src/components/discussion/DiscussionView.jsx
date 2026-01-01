// components/discussion/DiscussionView.jsx
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Eye, Download, FileText, Image as ImageIcon, File, X } from 'lucide-react';
import { discussionAPI } from '../../services/discussionAPI';

const DiscussionView = () => {
  const { id } = useParams();
  const [discussion, setDiscussion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [viewerFile, setViewerFile] = useState(null);

  useEffect(() => {
    loadDiscussion();
  }, [id]);

  const loadDiscussion = async () => {
    try {
      const data = await discussionAPI.getById(id);
      setDiscussion(data);
    } catch (error) {
      console.error('Error loading discussion:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFileType = (file) => {
    const mimeType = file.mimeType || '';
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType === 'application/pdf') return 'pdf';
    if (mimeType.startsWith('text/')) return 'text';
    return 'file';
  };

  const getFileIcon = (file) => {
    const type = getFileType(file);
    if (type === 'image') return <ImageIcon className="w-5 h-5" />;
    if (type === 'pdf' || type === 'text') return <FileText className="w-5 h-5" />;
    return <File className="w-5 h-5" />;
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return 'Unknown size';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const handleViewFile = (file) => {
    setViewerFile(file);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="spinner"></div>
          <p className="mt-4 text-gray-600">Loading discussion...</p>
        </div>
      </div>
    );
  }

  if (!discussion) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-xl text-gray-600">Discussion not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Discussion Header */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          {discussion.title}
        </h1>
        
        <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
          <span>By {discussion.author?.name || 'Anonymous'}</span>
          <span>•</span>
          <span>{new Date(discussion.createdAt).toLocaleDateString()}</span>
        </div>

        <div className="prose max-w-none">
          <p className="text-gray-700 whitespace-pre-wrap">{discussion.content}</p>
        </div>
      </div>

      {/* File Attachments */}
      {discussion.files && discussion.files.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">
            Attachments ({discussion.files.length})
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {discussion.files.map((file, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all"
              >
                <div className="flex-shrink-0 text-gray-500">
                  {getFileIcon(file)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {file.fileName || `File ${index + 1}`}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatFileSize(file.fileSize)}
                  </p>
                </div>

                <button
                  onClick={() => handleViewFile(file)}
                  className="flex-shrink-0 p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                  title="View file"
                >
                  <Eye className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Comments Section (placeholder) */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Comments</h2>
        <p className="text-gray-500 text-center py-8">
          No comments yet. Be the first to comment!
        </p>
      </div>

      {/* File Viewer Modal */}
      {viewerFile && (
        <FileViewer
          file={viewerFile}
          onClose={() => setViewerFile(null)}
        />
      )}
    </div>
  );
};

/* ============================
   FILE VIEWER COMPONENT
============================ */
const FileViewer = ({ file, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const getFileType = (file) => {
    const mimeType = file.mimeType || '';
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType === 'application/pdf') return 'pdf';
    if (mimeType.startsWith('text/')) return 'text';
    return 'file';
  };

  const renderContent = () => {
    const viewType = file.viewType || getFileType(file);

    if (viewType === 'image') {
      return (
        <div className="flex items-center justify-center h-full p-4">
          <img
            src={file.url}
            alt={file.fileName}
            className="max-w-full max-h-full object-contain"
            onContextMenu={(e) => e.preventDefault()}
            draggable={false}
            onLoad={() => setLoading(false)}
            onError={() => {
              setLoading(false);
              setError('Failed to load image');
            }}
            style={{ userSelect: 'none' }}
          />
        </div>
      );
    }

    if (viewType === 'pdf') {
      return (
        <iframe
          src={file.url}
          title={file.fileName}
          className="w-full h-full border-0"
          onLoad={() => setLoading(false)}
          style={{ minHeight: '600px' }}
        />
      );
    }

    if (viewType === 'text') {
      return (
        <iframe
          src={file.url}
          title={file.fileName}
          className="w-full h-full border-0 bg-white"
          onLoad={() => setLoading(false)}
          style={{ minHeight: '600px' }}
        />
      );
    }

    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        <div className="text-center">
          <File className="w-16 h-16 mx-auto mb-4" />
          <p className="mb-4">Preview not available for this file type</p>
          <button
            onClick={() => window.open(file.url, '_blank', 'noopener,noreferrer')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Open in New Tab
          </button>
        </div>
      </div>
    );
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-black bg-opacity-90 flex flex-col"
      onClick={onClose}
      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
    >
      {/* Header */}
      <div 
        className="bg-gray-900 text-white p-4 flex justify-between items-center"
        onClick={(e) => e.stopPropagation()}
        style={{ 
          backgroundColor: '#1a1a1a', 
          color: 'white', 
          padding: '1rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          zIndex: 1
        }}
      >
        <div style={{ 
          fontWeight: '500', 
          overflow: 'hidden', 
          textOverflow: 'ellipsis', 
          whiteSpace: 'nowrap',
          flex: 1,
          marginRight: '1rem'
        }}>
          {file.fileName || 'Untitled'}
        </div>
        
        <button
          onClick={onClose}
          style={{
            padding: '0.5rem',
            backgroundColor: 'transparent',
            border: 'none',
            borderRadius: '0.375rem',
            color: 'white',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          onMouseOver={(e) => e.target.style.backgroundColor = '#374151'}
          onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
        >
          <X style={{ width: '1.5rem', height: '1.5rem' }} />
        </button>
      </div>

      {/* Loading Indicator */}
      {loading && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          color: 'white',
          zIndex: 2
        }}>
          <div className="spinner"></div>
          <p style={{ marginTop: '1rem', textAlign: 'center' }}>Loading...</p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          color: 'white',
          textAlign: 'center',
          zIndex: 2
        }}>
          <p>{error}</p>
          <button
            onClick={onClose}
            style={{
              marginTop: '1rem',
              padding: '0.5rem 1rem',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '0.375rem',
              cursor: 'pointer'
            }}
          >
            Close
          </button>
        </div>
      )}

      {/* Content */}
      <div 
        style={{
          flex: 1,
          position: 'relative',
          overflow: 'auto'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {!error && renderContent()}
      </div>

      {/* Watermark */}
      <div style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'none',
        zIndex: 0
      }}>
        <div style={{
          color: 'white',
          fontSize: '4rem',
          opacity: 0.05,
          transform: 'rotate(-45deg)',
          userSelect: 'none'
        }}>
          VIEW ONLY
        </div>
      </div>
    </div>
  );
};

export default DiscussionView;