// components/discussion/CommentSection.jsx
import React, { useState, useEffect } from 'react';
import { commentAPI } from '../../services/discussionAPI';
import './CommentSection.css';

const Comment = ({ comment, onReply, onEdit, onDelete, currentUser, depth = 0 }) => {
  const [isReplying, setIsReplying] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [editContent, setEditContent] = useState(comment.content);
  const [submitting, setSubmitting] = useState(false);

  const canModify = currentUser && (
    currentUser.uid === comment.author?.uid || 
    currentUser.role === 'admin'
  );

  const handleReply = async () => {
    if (!replyContent.trim()) return;

    try {
      setSubmitting(true);
      await onReply(comment.id, replyContent.trim());
      setReplyContent('');
      setIsReplying(false);
    } catch (err) {
      console.error('Error replying:', err);
      alert('Failed to post reply');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async () => {
    if (!editContent.trim() || editContent === comment.content) {
      setIsEditing(false);
      return;
    }

    try {
      setSubmitting(true);
      await onEdit(comment.id, editContent.trim());
      setIsEditing(false);
    } catch (err) {
      console.error('Error editing:', err);
      alert('Failed to edit comment');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return 'just now';
    
    const d = date.toDate ? date.toDate() : new Date(date);
    const now = new Date();
    const diffMs = now - d;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return d.toLocaleDateString();
  };

  return (
    <div className={`comment ${depth > 0 ? 'comment-reply' : ''}`}>
      <div className="comment-header">
        <div className="comment-author">
          {comment.author?.photoURL ? (
            <img 
              src={comment.author.photoURL} 
              alt={comment.author.displayName}
              className="comment-avatar"
            />
          ) : (
            <div className="comment-avatar-placeholder">
              {(comment.author?.displayName || 'A').charAt(0).toUpperCase()}
            </div>
          )}
          <span className="comment-author-name">
            {comment.author?.displayName || 'Anonymous'}
          </span>
          <span className="comment-date">{formatDate(comment.createdAt)}</span>
          {comment.updatedAt && comment.createdAt && 
           new Date(comment.updatedAt.toDate ? comment.updatedAt.toDate() : comment.updatedAt).getTime() > 
           new Date(comment.createdAt.toDate ? comment.createdAt.toDate() : comment.createdAt).getTime() + 1000 && (
            <span className="comment-edited">(edited)</span>
          )}
        </div>
        
        {canModify && (
          <div className="comment-actions">
            <button onClick={() => setIsEditing(true)} className="action-btn">
              Edit
            </button>
            <button onClick={() => onDelete(comment.id)} className="action-btn delete">
              Delete
            </button>
          </div>
        )}
      </div>

      <div className="comment-body">
        {isEditing ? (
          <div className="comment-edit-form">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              rows={3}
              disabled={submitting}
            />
            <div className="edit-actions">
              <button 
                onClick={() => {
                  setIsEditing(false);
                  setEditContent(comment.content);
                }}
                className="cancel-btn"
                disabled={submitting}
              >
                Cancel
              </button>
              <button 
                onClick={handleEdit}
                className="save-btn"
                disabled={submitting}
              >
                {submitting ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        ) : (
          <div className="comment-content">
            {comment.content}
          </div>
        )}
      </div>

      {!isEditing && currentUser && depth < 5 && (
        <button 
          onClick={() => setIsReplying(!isReplying)}
          className="reply-btn"
        >
          Reply
        </button>
      )}

      {isReplying && (
        <div className="reply-form">
          <textarea
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            placeholder="Write your reply..."
            rows={3}
            disabled={submitting}
          />
          <div className="reply-actions">
            <button 
              onClick={() => {
                setIsReplying(false);
                setReplyContent('');
              }}
              className="cancel-btn"
              disabled={submitting}
            >
              Cancel
            </button>
            <button 
              onClick={handleReply}
              className="submit-btn"
              disabled={submitting || !replyContent.trim()}
            >
              {submitting ? 'Posting...' : 'Post Reply'}
            </button>
          </div>
        </div>
      )}

      {comment.replies && comment.replies.length > 0 && (
        <div className="comment-replies">
          {comment.replies.map((reply) => (
            <Comment
              key={reply.id}
              comment={reply}
              onReply={onReply}
              onEdit={onEdit}
              onDelete={onDelete}
              currentUser={currentUser}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const CommentSection = ({ discussionId, isLoggedIn, userData, onCommentAdded }) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchComments();
  }, [discussionId]);

  const fetchComments = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await commentAPI.getByDiscussion(discussionId);
      setComments(response.comments);
    } catch (err) {
      console.error('Error fetching comments:', err);
      setError(err.message || 'Failed to load comments');
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!isLoggedIn || !userData) {
      alert('Please login to comment');
      return;
    }

    if (!newComment.trim()) return;

    try {
      setSubmitting(true);
      
      await commentAPI.create({
        discussionId,
        content: newComment.trim(),
        parentId: null,
      });

      setNewComment('');
      await fetchComments();
      
      if (onCommentAdded) {
        onCommentAdded();
      }
    } catch (err) {
      console.error('Error adding comment:', err);
      alert(err.message || 'Failed to post comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReply = async (parentId, content) => {
    try {
      await commentAPI.create({
        discussionId,
        content,
        parentId,
      });

      await fetchComments();
      
      if (onCommentAdded) {
        onCommentAdded();
      }
    } catch (err) {
      console.error('Error replying:', err);
      throw err;
    }
  };

  const handleEdit = async (commentId, content) => {
    try {
      await commentAPI.update(commentId, content);
      await fetchComments();
    } catch (err) {
      console.error('Error editing comment:', err);
      throw err;
    }
  };

  const handleDelete = async (commentId) => {
    if (!window.confirm('Delete this comment and all its replies?')) return;
    
    try {
      await commentAPI.delete(commentId);
      await fetchComments();
      
      if (onCommentAdded) {
        onCommentAdded();
      }
    } catch (err) {
      console.error('Error deleting comment:', err);
      alert(err.message || 'Failed to delete comment');
    }
  };

  return (
    <div className="comment-section">
      <h2 className="comment-section-title">
        {loading ? 'Comments' : `${comments.length} ${comments.length === 1 ? 'Comment' : 'Comments'}`}
      </h2>

      <div className="add-comment-form">
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder={isLoggedIn ? "Write your comment..." : "Login to comment"}
          rows={4}
          disabled={!isLoggedIn || submitting}
        />
        <button
          onClick={handleAddComment}
          className="submit-comment-btn"
          disabled={!isLoggedIn || submitting || !newComment.trim()}
        >
          {submitting ? 'Posting...' : 'Post Comment'}
        </button>
      </div>

      {loading ? (
        <div className="loading-comments">Loading comments...</div>
      ) : error ? (
        <div className="error-comments">{error}</div>
      ) : comments.length === 0 ? (
        <div className="no-comments">
          No comments yet. Be the first to comment!
        </div>
      ) : (
        <div className="comments-list">
          {comments.map((comment) => (
            <Comment
              key={comment.id}
              comment={comment}
              onReply={handleReply}
              onEdit={handleEdit}
              onDelete={handleDelete}
              currentUser={userData}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default CommentSection;