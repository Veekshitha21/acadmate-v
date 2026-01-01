// components/discussion/CreateDiscussion.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { discussionAPI } from '../../services/discussionAPI';
import { Eye, X, Upload, File, Image as ImageIcon, FileText } from 'lucide-react';
import './CreateDiscussion.css';

const CreateDiscussion = ({ userData, isLoggedIn }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [files, setFiles] = useState([]);
  const [uploadedFiles, setUploadedFiles] = useState([]); // Track uploaded files with URLs
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [uploadProgress, setUploadProgress] = useState({});
  const [viewerFile, setViewerFile] = useState(null); // For file preview
  
  const navigate = useNavigate();

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    const validFiles = selectedFiles.filter(file => {
      const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 
                          'application/pdf', 'text/plain', 'text/javascript', 
                          'text/html', 'text/css', 'application/json'];
      const isValidType = validTypes.includes(file.type);
      const isValidSize = file.size <= 10 * 1024 * 1024; // 10MB

      if (!isValidType) {
        alert(`${file.name}: Invalid file type`);
        return false;
      }
      if (!isValidSize) {
        alert(`${file.name}: File too large (max 10MB)`);
        return false;
      }
      return true;
    });

    setFiles(prev => [...prev, ...validFiles]);
  };

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    // Also remove from uploaded files if already uploaded
    if (uploadedFiles[index]) {
      setUploadedFiles(prev => prev.filter((_, i) => i !== index));
    }
  };

  const uploadFiles = async () => {
    const uploadedUrls = [];
    
    // Get and validate token
    const token = localStorage.getItem('token');
    
    if (!token) {
      setError('You must be logged in to upload files. Please log in again.');
      throw new Error('No authentication token found');
    }
    
    console.log('🔑 Token preview:', token.substring(0, 20) + '...');
    
    // Get backend URL
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';
    
    for (let i = 0; i < files.length; i++) {
      try {
        setUploadProgress(prev => ({ ...prev, [i]: 0 }));
        
        const formData = new FormData();
        formData.append('file', files[i]);
        formData.append('discussionId', 'temp');
        
        console.log(`📤 Uploading ${i + 1}/${files.length}:`, files[i].name);
        
        // Upload to your backend
        const response = await fetch(`${API_URL}/api/upload`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        });

        console.log(`📡 Response status:`, response.status);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error('❌ Upload error:', errorData);
          
          // Handle specific errors
          if (response.status === 401 || response.status === 403) {
            setError('Authentication failed. Please log in again.');
            throw new Error('Authentication failed');
          }
          
          throw new Error(errorData.error || `Upload failed with status ${response.status}`);
        }

        const data = await response.json();
        console.log('✅ Upload success:', data.fileName);
        
        setUploadProgress(prev => ({ ...prev, [i]: 100 }));
        
        uploadedUrls.push({
          url: data.url,
          fileName: data.fileName,
          fileSize: data.fileSize,
          mimeType: data.mimeType,
          path: data.path,
          viewType: data.viewType
        });
        
        // Update uploaded files state for preview
        setUploadedFiles(prev => [...prev, {
          url: data.url,
          fileName: data.fileName,
          fileSize: data.fileSize,
          mimeType: data.mimeType,
          path: data.path,
          viewType: data.viewType
        }]);
        
      } catch (err) {
        console.error(`Error uploading ${files[i].name}:`, err);
        throw new Error(`Failed to upload ${files[i].name}`);
      }
    }
    
    return uploadedUrls;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (title.trim().length < 3) {
      setError('Title must be at least 3 characters');
      return;
    }

    if (content.trim().length < 10) {
      setError('Content must be at least 10 characters');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      let fileData = [];

      // Upload files if any
      if (files.length > 0 && uploadedFiles.length === 0) {
        setUploading(true);
        fileData = await uploadFiles();
        setUploading(false);
      } else {
        fileData = uploadedFiles;
      }

      // Create discussion
      const discussionData = {
        title: title.trim(),
        content: content.trim(),
        fileUrls: fileData.map(f => f.url),
        files: fileData, // Include full file metadata
      };

      const response = await discussionAPI.create(discussionData);

      console.log('Discussion created:', response);

      // Navigate to the new discussion
      navigate(`/discussions/${response.discussion.id}`);
    } catch (err) {
      console.error('Error creating discussion:', err);
      setError(err.message || 'Failed to create discussion. Please try again.');
    } finally {
      setSubmitting(false);
      setUploading(false);
    }
  };

  const handleViewFile = (file, index) => {
    // If file is already uploaded, use the uploaded URL
    if (uploadedFiles[index]) {
      setViewerFile(uploadedFiles[index]);
    } else {
      // Create temporary URL for local file preview
      const tempUrl = URL.createObjectURL(files[index]);
      setViewerFile({
        url: tempUrl,
        fileName: file.name,
        mimeType: file.type,
        viewType: getFileType(file.type),
        isTemp: true
      });
    }
  };

  const getFileType = (mimeType) => {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType === 'application/pdf') return 'pdf';
    if (mimeType.startsWith('text/')) return 'text';
    return 'file';
  };

  const getFileIcon = (mimeType) => {
    const type = getFileType(mimeType);
    if (type === 'image') return <ImageIcon className="w-4 h-4" />;
    if (type === 'pdf') return <FileText className="w-4 h-4" />;
    if (type === 'text') return <FileText className="w-4 h-4" />;
    return <File className="w-4 h-4" />;
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="create-discussion-container">
      <div className="create-discussion-header">
        <h1>Create New Discussion</h1>
        <button 
          onClick={() => navigate('/discussions')} 
          className="back-btn"
          type="button"
        >
          ← Back
        </button>
      </div>

      {error && (
        <div className="error-banner">
          <span>⚠️ {error}</span>
          <button onClick={() => setError(null)} type="button">×</button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="discussion-form">
        <div className="form-group">
          <label htmlFor="title">Title *</label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter a descriptive title..."
            maxLength={200}
            required
            disabled={submitting}
          />
          <div className="char-count">{title.length}/200</div>
        </div>

        <div className="form-group">
          <label htmlFor="content">Content *</label>
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write your discussion content... (Markdown supported)"
            rows={12}
            maxLength={50000}
            required
            disabled={submitting}
          />
          <div className="char-count">{content.length}/50000</div>
        </div>

        <div className="form-group">
          <label>Attachments (optional)</label>
          <div className="file-upload-area">
            <input
              type="file"
              id="file-input"
              onChange={handleFileChange}
              multiple
              accept="image/*,.pdf,.txt,.js,.jsx,.html,.css,.json"
              disabled={submitting || uploading}
              style={{ display: 'none' }}
            />
            <label htmlFor="file-input" className="file-upload-btn">
              📎 Choose Files
            </label>
            <span className="file-upload-hint">
              Images, PDFs, and code files (max 10MB each)
            </span>
          </div>

          {files.length > 0 && (
            <div className="file-list">
              {files.map((file, index) => (
                <div key={index} className="file-item">
                  <div className="file-info">
                    <div className="file-icon">
                      {getFileIcon(file.type)}
                    </div>
                    <div className="file-details">
                      <span className="file-name">{file.name}</span>
                      <span className="file-size">{formatFileSize(file.size)}</span>
                    </div>
                  </div>
                  
                  {uploadProgress[index] !== undefined && uploadProgress[index] < 100 && (
                    <div className="upload-progress">
                      <div 
                        className="progress-bar" 
                        style={{ width: `${uploadProgress[index]}%` }}
                      />
                    </div>
                  )}
                  
                  <div className="file-actions">
                    {uploadedFiles[index] && (
                      <span className="upload-status">✓ Uploaded</span>
                    )}
                    <button
                      type="button"
                      onClick={() => handleViewFile(file, index)}
                      className="view-file-btn"
                      title="Preview file"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    {!submitting && (
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="remove-file-btn"
                        title="Remove file"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="form-actions">
          <button
            type="button"
            onClick={() => navigate('/discussions')}
            className="cancel-btn"
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="submit-btn"
            disabled={submitting || uploading || !title.trim() || !content.trim()}
          >
            {submitting ? (
              <>
                <span className="spinner-small"></span>
                {uploading ? 'Uploading files...' : 'Creating...'}
              </>
            ) : (
              'Create Discussion'
            )}
          </button>
        </div>
      </form>

      {/* File Viewer Modal */}
      {viewerFile && (
        <FileViewer
          file={viewerFile}
          onClose={() => {
            if (viewerFile.isTemp) {
              URL.revokeObjectURL(viewerFile.url);
            }
            setViewerFile(null);
          }}
        />
      )}
    </div>
  );
};

/* ============================
   FILE VIEWER COMPONENT
============================ */
const FileViewer = ({ file, onClose }) => {
  const renderContent = () => {
    const viewType = file.viewType || getFileType(file.mimeType);

    if (viewType === 'image') {
      return (
        <img
          src={file.url}
          alt={file.fileName}
          className="max-w-full max-h-full object-contain"
          onContextMenu={(e) => e.preventDefault()}
          draggable={false}
        />
      );
    }

    if (viewType === 'pdf') {
      return (
        <iframe
          src={file.url}
          title={file.fileName}
          className="w-full h-full border-0"
          sandbox="allow-scripts allow-same-origin"
        />
      );
    }

    if (viewType === 'text') {
      return (
        <iframe
          src={file.url}
          title={file.fileName}
          className="w-full h-full border-0 bg-white"
        />
      );
    }

    return (
      <div className="text-center text-gray-400">
        <p>Preview not available</p>
        <button
          onClick={() => window.open(file.url, '_blank')}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Open in New Tab
        </button>
      </div>
    );
  };

  const getFileType = (mimeType) => {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType === 'application/pdf') return 'pdf';
    if (mimeType.startsWith('text/')) return 'text';
    return 'file';
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
          alignItems: 'center'
        }}
      >
        <div style={{ fontWeight: '500', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {file.fileName}
        </div>
        <button
          onClick={onClose}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#374151',
            border: 'none',
            borderRadius: '0.375rem',
            color: 'white',
            cursor: 'pointer'
          }}
          onMouseOver={(e) => e.target.style.backgroundColor = '#4b5563'}
          onMouseOut={(e) => e.target.style.backgroundColor = '#374151'}
        >
          Close
        </button>
      </div>

      {/* Content */}
      <div 
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
          overflow: 'auto'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {renderContent()}
      </div>

      {/* Watermark */}
      <div style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'none'
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

export default CreateDiscussion;