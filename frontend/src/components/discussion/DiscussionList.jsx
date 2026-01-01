// components/discussion/DiscussionList.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { discussionAPI } from '../../services/discussionAPI';
import './DiscussionList.css';

const DiscussionList = ({ isLoggedIn, userData }) => {
  const [discussions, setDiscussions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState('createdAt');
  const [hasMore, setHasMore] = useState(false);
  
  const navigate = useNavigate();

  useEffect(() => {
    fetchDiscussions();
  }, [sortBy]);

  const fetchDiscussions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await discussionAPI.getAll({ sortBy, limit: 20 });
      
      setDiscussions(response.discussions);
      setHasMore(response.hasMore);
    } catch (err) {
      console.error('Error fetching discussions:', err);
      setError(err.message || 'Failed to load discussions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNew = () => {
    if (!isLoggedIn) {
      alert('Please login to create a discussion');
      return;
    }
    navigate('/discussions/new');
  };

  const formatDate = (date) => {
    if (!date) return 'Unknown date';
    
    const d = date.toDate ? date.toDate() : new Date(date);
    const now = new Date();
    const diffMs = now - d;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (loading) {
    return (
      <div className="discussion-list-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading discussions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="discussion-list-container">
      <div className="discussion-header">
        <h1>Discussions</h1>
        <div className="header-actions">
          <div className="sort-buttons">
            <button 
              className={sortBy === 'voteCount' ? 'sort-btn active' : 'sort-btn'}
              onClick={() => setSortBy('voteCount')}
            >
              Most Votes
            </button>
            <button 
              className={sortBy === 'createdAt' ? 'sort-btn active' : 'sort-btn'}
              onClick={() => setSortBy('createdAt')}
            >
              Newest
            </button>
          </div>
          <button onClick={handleCreateNew} className="create-btn">
            Create
          </button>
        </div>
      </div>

      {error && (
        <div className="error-message">
          <span>⚠️ {error}</span>
          <button onClick={fetchDiscussions}>Retry</button>
        </div>
      )}

      {discussions.length === 0 && !loading && !error && (
        <div className="empty-state">
          <div className="empty-icon">💬</div>
          <h2>No discussions yet</h2>
          <p>Be the first to start a discussion!</p>
          <button onClick={handleCreateNew} className="create-btn">
            Create Discussion
          </button>
        </div>
      )}

      <div className="discussions-list">
        {discussions.map((discussion, index) => (
          <React.Fragment key={discussion.id}>
            <Link to={`/discussions/${discussion.id}`} className="discussion-card-link">
              <div className="discussion-card">
                {/* Profile Avatar on Left */}
                <div className="discussion-author-section">
                  {discussion.author?.photoURL ? (
                    <img 
                      src={discussion.author.photoURL} 
                      alt={discussion.author.displayName}
                      className="author-avatar-large"
                    />
                  ) : (
                    <div className="author-avatar-placeholder-large">
                      {(discussion.author?.displayName || 'A').charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>

                {/* Content Section */}
                <div className="discussion-content">
                  {/* Name and Time at Top */}
                  <div className="discussion-header-info">
                    <span className="author-name">
                      {discussion.author?.displayName || 'Anonymous'}
                    </span>
                    <span className="discussion-date">{formatDate(discussion.createdAt)}</span>
                  </div>
                  
                  {/* Title */}
                  <div className="discussion-title">
                    {discussion.title}
                  </div>
                  
                  {/* Description */}
                  <div className="discussion-excerpt">
                    {discussion.content.substring(0, 200)}
                    {discussion.content.length > 200 && '...'}
                  </div>
                  
                  {/* Stats at Bottom */}
                  <div className="discussion-stats">
                    <span className="stat-item">
                      ↑ {discussion.voteCount || 0}
                    </span>
                    <span className="stat-item">
                      💬 {discussion.commentCount || 0}
                    </span>
                    {discussion.fileUrls && discussion.fileUrls.length > 0 && (
                      <span className="stat-item">
                        📎 {discussion.fileUrls.length}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </Link>
            {/* Separator line between discussions */}
            {index < discussions.length - 1 && <div className="discussion-separator"></div>}
          </React.Fragment>
        ))}
      </div>

      {hasMore && (
        <div className="load-more">
          <button onClick={fetchDiscussions} className="load-more-btn">
            Load More
          </button>
        </div>
      )}
    </div>
  );
};

export default DiscussionList;
