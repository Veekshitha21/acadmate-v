// services/fileAPI.js
/**
 * File Upload and Management API Service
 */

// Use Vite environment variable or default to localhost:5001
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

export const fileAPI = {
  /**
   * Upload a single file
   * @param {File} file - The file to upload
   * @param {string} discussionId - The discussion ID (optional, defaults to 'temp')
   * @returns {Promise<Object>} Upload response with file URL and metadata
   */
  async uploadFile(file, discussionId = 'temp') {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('discussionId', discussionId);

    const token = localStorage.getItem('token');

    const response = await fetch(`${API_URL}/api/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'File upload failed');
    }

    return await response.json();
  },

  /**
   * Upload multiple files
   * @param {File[]} files - Array of files to upload
   * @param {string} discussionId - The discussion ID
   * @param {Function} onProgress - Progress callback (fileIndex, progress)
   * @returns {Promise<Object[]>} Array of upload responses
   */
  async uploadFiles(files, discussionId = 'temp', onProgress = null) {
    const uploadedFiles = [];

    for (let i = 0; i < files.length; i++) {
      try {
        if (onProgress) onProgress(i, 0);

        const result = await this.uploadFile(files[i], discussionId);
        uploadedFiles.push(result);

        if (onProgress) onProgress(i, 100);
      } catch (error) {
        console.error(`Failed to upload ${files[i].name}:`, error);
        throw error;
      }
    }

    return uploadedFiles;
  },

  /**
   * Delete a file
   * @param {string} filePath - The Firebase Storage path of the file
   * @returns {Promise<Object>} Delete response
   */
  async deleteFile(filePath) {
    const token = localStorage.getItem('token');

    const response = await fetch(`${API_URL}/api/upload`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ filePath })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'File deletion failed');
    }

    return await response.json();
  },

  /**
   * Get file metadata
   * @param {string} url - The file URL
   * @returns {Promise<Object>} File metadata
   */
  async getFileMetadata(url) {
    const token = localStorage.getItem('token');

    const response = await fetch(url, {
      method: 'HEAD',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch file metadata');
    }

    return {
      size: response.headers.get('content-length'),
      type: response.headers.get('content-type'),
      lastModified: response.headers.get('last-modified')
    };
  }
};

// utils/fileHelpers.js
/**
 * File Helper Utilities
 */

export const fileHelpers = {
  /**
   * Validate file type
   * @param {File} file - The file to validate
   * @param {string[]} allowedTypes - Array of allowed MIME types
   * @returns {boolean} Whether file type is valid
   */
  validateFileType(file, allowedTypes = null) {
    const defaultTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'text/plain',
      'text/javascript',
      'text/html',
      'text/css',
      'application/json',
      'text/markdown'
    ];

    const types = allowedTypes || defaultTypes;
    return types.includes(file.type);
  },

  /**
   * Validate file size
   * @param {File} file - The file to validate
   * @param {number} maxSize - Maximum size in bytes (default 10MB)
   * @returns {boolean} Whether file size is valid
   */
  validateFileSize(file, maxSize = 10 * 1024 * 1024) {
    return file.size <= maxSize;
  },

  /**
   * Format file size to human readable string
   * @param {number} bytes - Size in bytes
   * @returns {string} Formatted size string
   */
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  },

  /**
   * Get file type from MIME type
   * @param {string} mimeType - The MIME type
   * @returns {string} File type category
   */
  getFileType(mimeType) {
    if (!mimeType) return 'unknown';
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType === 'application/pdf') return 'pdf';
    if (mimeType.startsWith('text/')) return 'text';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';
    return 'file';
  },

  /**
   * Get file extension from filename
   * @param {string} filename - The filename
   * @returns {string} File extension (lowercase)
   */
  getFileExtension(filename) {
    return filename.slice(((filename.lastIndexOf('.') - 1) >>> 0) + 2).toLowerCase();
  },

  /**
   * Check if file can be previewed in browser
   * @param {string} mimeType - The MIME type
   * @returns {boolean} Whether file can be previewed
   */
  canPreview(mimeType) {
    const previewableTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml',
      'application/pdf',
      'text/plain',
      'text/html',
      'text/css',
      'text/javascript',
      'application/json',
      'text/markdown'
    ];
    return previewableTypes.includes(mimeType);
  },

  /**
   * Create a temporary object URL for file preview
   * @param {File} file - The file
   * @returns {string} Object URL
   */
  createPreviewUrl(file) {
    return URL.createObjectURL(file);
  },

  /**
   * Revoke object URL to free memory
   * @param {string} url - The object URL to revoke
   */
  revokePreviewUrl(url) {
    URL.revokeObjectURL(url);
  },

  /**
   * Download file from URL
   * @param {string} url - The file URL
   * @param {string} filename - The filename to save as
   */
  downloadFile(url, filename) {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  /**
   * Compress image file
   * @param {File} file - The image file
   * @param {number} maxWidth - Maximum width
   * @param {number} maxHeight - Maximum height
   * @param {number} quality - Compression quality (0-1)
   * @returns {Promise<Blob>} Compressed image blob
   */
  async compressImage(file, maxWidth = 1920, maxHeight = 1080, quality = 0.8) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Calculate new dimensions
          if (width > height) {
            if (width > maxWidth) {
              height *= maxWidth / width;
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width *= maxHeight / height;
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => resolve(blob),
            file.type,
            quality
          );
        };

        img.onerror = () => reject(new Error('Failed to load image'));
      };

      reader.onerror = () => reject(new Error('Failed to read file'));
    });
  },

  /**
   * Validate multiple files
   * @param {FileList} files - The files to validate
   * @param {Object} options - Validation options
   * @returns {Object} Validation result with valid files and errors
   */
  validateFiles(files, options = {}) {
    const {
      maxSize = 10 * 1024 * 1024,
      allowedTypes = null,
      maxFiles = 10
    } = options;

    const validFiles = [];
    const errors = [];

    if (files.length > maxFiles) {
      errors.push(`Maximum ${maxFiles} files allowed`);
      return { validFiles, errors };
    }

    Array.from(files).forEach((file, index) => {
      if (!this.validateFileType(file, allowedTypes)) {
        errors.push(`${file.name}: Invalid file type`);
        return;
      }

      if (!this.validateFileSize(file, maxSize)) {
        errors.push(`${file.name}: File too large (max ${this.formatFileSize(maxSize)})`);
        return;
      }

      validFiles.push(file);
    });

    return { validFiles, errors };
  }
};

// Export both
export default {
  fileAPI,
  fileHelpers
};