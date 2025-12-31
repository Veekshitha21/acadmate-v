// components/discussion/DiscussionDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { discussionAPI } from '../../services/discussionAPI';
import CommentSection from './CommentSection';
import './DiscussionDetail.css';

const DiscussionDetail = ({ isLoggedIn, userData }) => {
  const [discussion, setDiscussion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [voting, setVoting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  
  const { id } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    fetchDiscussion();
    if (isLoggedIn) {
      checkVoteStatus();
    }
  }, [id, isLoggedIn]);

  const fetchDiscussion = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await discussionAPI.getById(id);
      setDiscussion(response.discussion);
    } catch (err) {
      console.error('Error fetching discussion:', err);
      setError(err.message || 'Failed to load discussion. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const checkVoteStatus = async () => {
    try {
      const response = await discussionAPI.getVoteStatus(id);
      setHasVoted(response.hasVoted);
    } catch (err) {
      console.error('Error checking vote status:', err);
    }
  };

  const handleVote = async () => {
    if (!isLoggedIn || !userData) {
      alert('Please login to vote');
      return;
    }

    try {
      setVoting(true);
      
      const response = await discussionAPI.vote(id);
      
      setHasVoted(response.voted);
      
      // Update local vote count
      setDiscussion(prev => ({
        ...prev,
        voteCount: prev.voteCount + (response.voted ? 1 : -1)
      }));
    } catch (err) {
      console.error('Error voting:', err);
      alert(err.message || 'Failed to vote. Please try again.');
    } finally {
      setVoting(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this discussion? This action cannot be undone.')) {
      return;
    }

    try {
      setDeleting(true);
      
      await discussionAPI.delete(id);
      
      navigate('/discussions');
    } catch (err) {
      console.error('Error deleting discussion:', err);
      alert(err.message || 'Failed to delete discussion. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  const handleCommentAdded = () => {
    // Refresh discussion to update comment count
    fetchDiscussion();
  };

  const canModify = isLoggedIn && userData && (
    userData.uid === discussion?.author?.uid || 
    userData.role === 'admin'
  );

  const formatDate = (date) => {
    if (!date) return 'Unknown date';
    
    const d = date.toDate ? date.toDate() : new Date(date);
    
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getFileIcon = (url) => {
    if (url.match(/\.(jpg|jpeg|png|gif|webp)$/i)) return '🖼️';
    if (url.match(/\.pdf$/i)) return '📄';
    return '📎';
  };

  const renderFilePreview = (url, index) => {
    const isImage = url.match(/\.(jpg|jpeg|png|gif|webp)$/i);
    const filename = url.split('/').pop();

    if (isImage) {
      return (
        <div key={index} className="file-preview image-preview">
          <img src={url} alt={`Attachment ${index + 1}`} />
          <a href={url} target="_blank" rel="noopener noreferrer" className="view-full">
            View Full Size
          </a>
        </div>
      );
    }

    return (
      <a
        key={index}
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="file-attachment"
      >
        <span className="file-icon">{getFileIcon(url)}</span>
        <span className="file-name">{decodeURIComponent(filename)}</span>
      </a>
    );
  };

  if (loading) {
    return (
      <div className="discussion-detail-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading discussion...</p>
        </div>
      </div>
    );
  }

  if (error || !discussion) {
    return (
      <div className="discussion-detail-container">
        <div className="error-state">
          <h2>⚠️ {error || 'Discussion not found'}</h2>
          <button onClick={() => navigate('/discussions')} className="back-btn">
            ← Back to Discussions
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="discussion-detail-container">
      <div className="discussion-header">
        <button onClick={() => navigate('/discussions')} className="back-btn">
          ← Back
        </button>
        
        {canModify && (
          <div className="discussion-actions">
            <button 
              onClick={handleDelete}
              className="delete-btn"
              disabled={deleting}
            >
              {deleting ? '...' : '🗑️ Delete'}
            </button>
          </div>
        )}
      </div>

      <div className="discussion-main">
        <div className="discussion-sidebar">
          <button
            onClick={handleVote}
            className={`vote-btn ${hasVoted ? 'voted' : ''}`}
            disabled={voting || !isLoggedIn}
            title={!isLoggedIn ? 'Login to vote' : ''}
          >
            <span className="vote-icon">▲</span>
            <span className="vote-count">{discussion.voteCount || 0}</span>
          </button>
        </div>

        <div className="discussion-content-area">
          <h1 className="discussion-title">{discussion.title}</h1>

          <div className="discussion-meta">
            <div className="author-info">
              {discussion.author?.photoURL ? (
                <img 
                  src={discussion.author.photoURL} 
                  alt={discussion.author.displayName}
                  className="author-avatar"
                />
              ) : (
                <div className="author-avatar-placeholder">
                  {(discussion.author?.displayName || 'A').charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <div className="author-name">
                  {discussion.author?.displayName || 'Anonymous'}
                </div>
                <div className="discussion-date">
                  Asked {formatDate(discussion.createdAt)}
                </div>
              </div>
            </div>
          </div>

          <div className="discussion-body">
            {discussion.content.split('\n').map((paragraph, idx) => (
              <p key={idx}>{paragraph}</p>
            ))}
          </div>

          {discussion.fileUrls && discussion.fileUrls.length > 0 && (
            <div className="discussion-attachments">
              <h3>Attachments</h3>
              <div className="attachments-grid">
                {discussion.fileUrls.map((url, index) => 
                  renderFilePreview(url, index)
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <CommentSection 
        discussionId={id} 
        isLoggedIn={isLoggedIn}
        userData={userData}
        onCommentAdded={handleCommentAdded}
      />
    </div>
  );
};

export default DiscussionDetail;