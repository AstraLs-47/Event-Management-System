import React, { useState } from 'react';

function getInitials(name) {
    const src = name || '';
    if (!src) return 'U';
    return src.trim().charAt(0).toUpperCase();
}

function formatTimestamp(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short',
    });
}

const CommentSection = ({ comments, currentUser, onSubmit }) => {
    const [commentText, setCommentText] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (commentText.trim()) {
            onSubmit(commentText.trim());
            setCommentText('');
        }
    };

    return (
        <div className="comment-section">
            <h3>Comments</h3>
            <div className="comment-list">
                {comments.length === 0 ? (
                    <p className="muted">No comments yet. Be the first to comment!</p>
                ) : (
                    comments.map((comment) => (
                        <div key={comment.id || comment.createdAt} className="comment-item">
                            <div className="comment-avatar">
                                {getInitials(comment.user?.fullName || comment.user?.username)}
                            </div>
                            <div className="comment-content">
                                <div className="comment-header">
                                    <span className="comment-author">{comment.user?.fullName || comment.user?.username || 'Anonymous'}</span>
                                    <span className="comment-timestamp">{formatTimestamp(comment.createdAt)}</span>
                                </div>
                                <p className="comment-text">{comment.text}</p>
                            </div>
                        </div>
                    ))
                )}
            </div>
            <form className="comment-form" onSubmit={handleSubmit}>
                <div className="comment-form-avatar">
                    {getInitials(currentUser.fullName || currentUser.username)}
                </div>
                <input
                    type="text"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Add a comment..."
                    className="comment-input"
                />
                <button type="submit" className="btn-primary comment-submit-btn" disabled={!commentText.trim()}>
                    Post
                </button>
            </form>
        </div>
    );
};

export default CommentSection;