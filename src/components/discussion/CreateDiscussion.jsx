// components/discussion/CreateDiscussion.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { discussionAPI } from '../../services/discussionAPI';
import './CreateDiscussion.css';

const CreateDiscussion = ({ userData, isLoggedIn }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [uploadProgress, setUploadProgress] = useState({});
  
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
  };

  const uploadFiles = async () => {
    // TODO: Implement file upload to Firebase Storage or your server
    const uploadedUrls = [];
    
    for (let i = 0; i < files.length; i++) {
      try {
        setUploadProgress(prev => ({ ...prev, [i]: 0 }));
        
        // Simulated upload - replace with actual Firebase Storage upload
        // Example with Firebase Storage:
        // const storageRef = storage.ref(`discussions/${Date.now()}_${files[i].name}`);
        // const uploadTask = storageRef.put(files[i]);
        // 
        // uploadTask.on('state_changed',
        //   (snapshot) => {
        //     const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        //     setUploadProgress(prev => ({ ...prev, [i]: progress }));
        //   }
        // );
        // 
        // await uploadTask;
        // const url = await storageRef.getDownloadURL();
        // uploadedUrls.push(url);
        
        // For now, just simulate:
        for (let progress = 0; progress <= 100; progress += 20) {
          await new Promise(resolve => setTimeout(resolve, 100));
          setUploadProgress(prev => ({ ...prev, [i]: progress }));
        }
        
        uploadedUrls.push(`https://placeholder.com/${files[i].name}`);
        
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

      let fileUrls = [];

      // Upload files if any
      if (files.length > 0) {
        setUploading(true);
        fileUrls = await uploadFiles();
        setUploading(false);
      }

      // Create discussion
      const discussionData = {
        title: title.trim(),
        content: content.trim(),
        fileUrls,
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
                    <span className="file-name">{file.name}</span>
                    <span className="file-size">{formatFileSize(file.size)}</span>
                  </div>
                  {uploadProgress[index] !== undefined && (
                    <div className="upload-progress">
                      <div 
                        className="progress-bar" 
                        style={{ width: `${uploadProgress[index]}%` }}
                      />
                    </div>
                  )}
                  {!submitting && (
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="remove-file-btn"
                    >
                      ×
                    </button>
                  )}
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
    </div>
  );
};

export default CreateDiscussion;