// components/discussion/DiscussionDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { discussionAPI } from '../../services/discussionAPI';
import CommentSection from './CommentSection';
import FileViewer from './FileViewer';
import './DiscussionDetail.css';

const DiscussionDetail = ({ isLoggedIn, userData }) => {
  const [discussion, setDiscussion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [voting, setVoting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [fileViewerOpen, setFileViewerOpen] = useState(false);
  const [fileViewerIndex, setFileViewerIndex] = useState(0);
  const [hasVoted, setHasVoted] = useState(false);
  
  const { id } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    fetchDiscussion();
    if (isLoggedIn) checkVoteStatus();
  }, [id, isLoggedIn]);

  const fetchDiscussion = async () => {
    try {
      setLoading(true);
      const res = await discussionAPI.getById(id);
      setDiscussion(res.discussion);
    } catch (err) {
      setError("Failed to load discussion");
    } finally {
      setLoading(false);
    }
  };

  const checkVoteStatus = async () => {
    try {
      const res = await discussionAPI.getVoteStatus(id);
      setHasVoted(res.hasVoted);
    } catch {}
  };

  const handleVote = async () => {
    if (!isLoggedIn || !userData) {
      alert("Please login to vote");
      return;
    }

    try {
      setVoting(true);
      const res = await discussionAPI.vote(id);

      setHasVoted(res.voted);
      setDiscussion(prev => ({
        ...prev,
        voteCount: prev.voteCount + (res.voted ? 1 : -1),
      }));
    } catch {
      alert("Voting failed");
    } finally {
      setVoting(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete this discussion?")) return;

    try {
      setDeleting(true);
      await discussionAPI.delete(id);
      navigate("/discussions");
    } catch {
      alert("Delete failed");
    } finally {
      setDeleting(false);
    }
  };

  const canModify =
    isLoggedIn &&
    userData &&
    (userData.uid === discussion?.author?.uid ||
      userData.role === "admin");

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
    if (url.match(/\.(doc|docx)$/i)) return '📝';
    if (url.match(/\.(xls|xlsx)$/i)) return '📊';
    return '📎';
  };

  const openFileViewer = (index) => {
    setFileViewerIndex(index);
    setFileViewerOpen(true);
  };

  const renderFilePreview = (url, index) => {
    const isImage = url.match(/\.(jpg|jpeg|png|gif|webp)$/i);
    const filename = url.split('/').pop().split('?')[0];
    const decodedFilename = decodeURIComponent(filename);

    if (isImage) {
      return (
        <div 
          key={index} 
          className="file-preview image-preview"
          onClick={() => openFileViewer(index)}
        >
          <img src={url} alt={`Attachment ${index + 1}`} />
          <div className="view-overlay">
            <span className="view-text">Click to view</span>
          </div>
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
        <span className="file-name">{decodedFilename}</span>
        <span className="file-action">Open →</span>
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
      <div className="discussion-main">
        {/* Avatar */}
        <div className="discussion-author-section">
          <div className="author-avatar-placeholder-large">
            {(discussion.author?.displayName || "A")[0].toUpperCase()}
          </div>
        </div>

        <div className="discussion-content-area">
          {/* Header */}
          <div className="discussion-header-info">
            <span className="author-name">
              {discussion.author?.displayName || "Anonymous"}
            </span>
            <span className="discussion-date">
              Asked {formatDate(discussion.createdAt)}
            </span>
          </div>

          {/* Title */}
          <h1 className="discussion-title">{discussion.title}</h1>

          {/* Body */}
          <div className="discussion-body">
            {discussion.content.split("\n").map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>

          {/* Attachments */}
          {discussion.fileUrls && discussion.fileUrls.length > 0 && (
            <div className="discussion-attachments">
              <h3>📎 Attachments ({discussion.fileUrls.length})</h3>
              <div className="attachments-grid">
                {discussion.fileUrls.map((url, index) => renderFilePreview(url, index))}
              </div>
            </div>
          )}

          {/* ACTIONS ROW */}
          <div className="discussion-actions-bottom">
            {/* Vote Button */}
            <button
              onClick={handleVote}
              className={`vote-button-modern ${hasVoted ? "voted" : ""}`}
              disabled={voting || !isLoggedIn}
              title={hasVoted ? "Remove vote" : "Upvote"}
            >
              <div className="vote-icon-wrapper">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 19V5M5 12l7-7 7 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <span className="vote-count-modern">{discussion.voteCount || 0}</span>
            </button>

            {/* Delete */}
            {canModify && (
              <button
                className="delete-btn"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? "Deleting..." : "🗑️ Delete"}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Comments */}
      <CommentSection
        discussionId={id}
        isLoggedIn={isLoggedIn}
        userData={userData}
        onCommentAdded={fetchDiscussion}
      />

      {/* File Viewer Modal */}
      {fileViewerOpen && discussion?.fileUrls && discussion.fileUrls.length > 0 && (
        <FileViewer
          files={discussion.fileUrls}
          initialIndex={fileViewerIndex}
          onClose={() => setFileViewerOpen(false)}
        />
      )}
    </div>
  );
};

export default DiscussionDetail;