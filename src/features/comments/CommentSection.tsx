import React, { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { addComment, replyToComment, voteOnComment, editComment } from './commentsSlice';
import { addNotification } from '../events/eventsSlice';
import type { Comment } from '../../types';
import { v4 as uuidv4 } from 'uuid';

interface Props {
  eventId: string;
  eventCreatorId: string;
}

const CommentSection: React.FC<Props> = ({ eventId, eventCreatorId }) => {
  const dispatch = useAppDispatch();
  const comments = useAppSelector((s) => s.comments.items.filter((c) => c.eventId === eventId));
  const { user } = useAppSelector((s) => s.auth);
  const profiles = useAppSelector((s) => s.profile.profiles);
  const [newText, setNewText] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [hiddenReplies, setHiddenReplies] = useState<Set<string>>(new Set());
  const [hoveredDepth, setHoveredDepth] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  const topLevel = comments.filter((c) => !c.parentId);
  const getReplies = (parentId: string) => comments.filter((c) => c.parentId === parentId);

  const countThread = useCallback((parentId: string): number => {
    let count = 0;
    for (const c of comments) {
      if (c.parentId === parentId) {
        count += 1 + countThread(c.id);
      }
    }
    return count;
  }, [comments]);

  const displayName = (userId: string) => profiles[userId]?.displayName || userId.slice(0, 8);
  const timeAgo = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'now';
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    const days = Math.floor(hrs / 24);
    return `${days}d`;
  };

  const netVotes = (c: Comment) => {
    let up = 0, down = 0;
    for (const d of Object.values(c.votes)) {
      if (d === 'up') up++;
      else down++;
    }
    return up - down;
  };
  const totalVotes = (c: Comment) => {
    let up = 0, down = 0;
    for (const d of Object.values(c.votes)) {
      if (d === 'up') up++;
      else down++;
    }
    return up + down;
  };

  const myVote = (c: Comment) => (user ? c.votes[user.id] : undefined);

  const handleVote = (commentId: string, direction: 'up' | 'down') => {
    if (!user) return;
    const comment = comments.find((c) => c.id === commentId);
    if (!comment) return;
    const current = comment.votes[user.id];
    const newDir = current === direction ? null : direction;
    dispatch(voteOnComment({ commentId, userId: user.id, direction: newDir }));
  };

  const handleEdit = (c: Comment) => {
    setEditingId(c.id);
    setEditText(c.text);
  };

  const handleSaveEdit = async (commentId: string) => {
    if (!editText.trim()) return;
    await dispatch(editComment({ commentId, text: editText.trim() })).unwrap();
    setEditingId(null);
    setEditText('');
  };

  const handleSubmit = async () => {
    if (!user || !newText.trim()) return;
    const result = await dispatch(addComment({ eventId, userId: user.id, text: newText.trim() })).unwrap();
    setNewText('');
    if (user.id !== eventCreatorId) {
      dispatch(addNotification({
        id: uuidv4(),
        eventId,
        type: 'comment',
        message: `${user.displayName || displayName(user.id)} commented on your event`,
        read: false,
        createdAt: new Date().toISOString(),
        fromUserId: user.id,
        commentId: result.id,
      }));
    }
  };

  const handleReply = async (parentId: string) => {
    if (!user || !replyText.trim()) return;
    const parent = comments.find((c) => c.id === parentId);
    const result = await dispatch(replyToComment({ eventId, userId: user.id, parentId, text: replyText.trim() })).unwrap();
    setReplyTo(null);
    setReplyText('');
    if (parent && user.id !== parent.userId) {
      dispatch(addNotification({
        id: uuidv4(),
        eventId,
        type: 'reply',
        message: `${user.displayName || displayName(user.id)} replied to your comment`,
        read: false,
        createdAt: new Date().toISOString(),
        fromUserId: user.id,
        commentId: result.id,
      }));
    }
  };

  const toggleCollapse = (id: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleHiddenReplies = (id: string) => {
    setHiddenReplies((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const renderComment = (c: Comment, depth = 0, parentId?: string) => {
    const votes = netVotes(c);
    const my = myVote(c);
    const replies = getReplies(c.id);
    const threadCount = countThread(c.id);
    const isCollapsed = collapsed.has(c.id);
    const isHoveredLine = hoveredDepth !== null && depth === hoveredDepth && depth > 0;

    return (
      <div key={c.id} className="comment">
        {depth > 0 && (
        <div
          className={`comment-indent ${isHoveredLine ? 'hvr' : ''}`}
          onClick={() => toggleHiddenReplies(parentId!)}
          onMouseEnter={() => setHoveredDepth(depth)}
          onMouseLeave={() => setHoveredDepth(null)}
          >
          <div className={`indent-line ${isHoveredLine ? 'hvr' : ''}`} />
        </div>
        )}
        <div className="comment-body">
          <div className="comment-header">
            {threadCount > 0 && (
              <button className="thread-toggle" onClick={() => toggleCollapse(c.id)} aria-label={isCollapsed ? 'Expand thread' : 'Collapse thread'}>
                {isCollapsed ? '▸' : '▾'}
              </button>
            )}
            <Link to={`/profile?userId=${c.userId}`} className="comment-author">
              {displayName(c.userId)}
            </Link>
            <span className="comment-time">{timeAgo(c.createdAt)}{c.edited && ' (Edited)'}</span>
          </div>
          {!isCollapsed ? (
            <>
              {editingId === c.id ? (
                <div className="comment-edit-form">
                  <textarea
                    className="comment-input"
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    rows={2}
                    aria-label="Edit comment" />
                  <div className="comment-form-actions">
                    <button className="btn btn-sm btn-primary" onClick={() => handleSaveEdit(c.id)} disabled={!editText.trim()} aria-label="Save edit">Save</button>
                    <button className="btn btn-sm btn-ghost" onClick={() => { setEditingId(null); setEditText(''); }} aria-label="Cancel edit">Cancel</button>
                  </div>
                </div>
              ) : (
                <div className="comment-text">{c.text}</div>
              )}
              <div className="comment-actions">
                <div className="comment-votes">
                  <button
                    className={`vote-btn ${my === 'up' ? 'voted' : ''}`}
                    onClick={() => handleVote(c.id, 'up')}
                    title="Upvote"
                  >▲</button>
                  <span className={`vote-score ${votes > 0 ? 'pos' : votes < 0 ? 'neg' : ''}`}>{votes}</span>
                  {totalVotes(c) > 0 && <span className="vote-total" title={`${totalVotes(c)} total votes`}>{totalVotes(c)}</span>}
                  <button
                    className={`vote-btn ${my === 'down' ? 'voted' : ''}`}
                    onClick={() => handleVote(c.id, 'down')}
                    title="Downvote"
                  >▼</button>
                </div>
                {user && (
                  <>
                    {user.id === c.userId && editingId !== c.id && (
                      <button className="comment-edit-btn" onClick={() => handleEdit(c)} aria-label="Edit comment">Edit</button>
                    )}
                    <button className="comment-reply-btn" onClick={() => setReplyTo(replyTo === c.id ? null : c.id)} aria-label="Reply to comment">
                      {threadCount > 0 ? `${threadCount} repl${threadCount !== 1 ? 'ies' : 'y'}` : 'Reply'}
                    </button>
                  </>
                )}
              </div>
              {replyTo === c.id && (
                <div className="comment-reply-form">
                  <textarea
                    className="comment-input"
                    placeholder="Write a reply..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    rows={2}
                    aria-label="Write a reply" />
                  <div className="comment-form-actions">
                    <button className="btn btn-sm btn-primary" onClick={() => handleReply(c.id)} disabled={!replyText.trim()} aria-label="Post reply">Reply</button>
                    <button className="btn btn-sm btn-ghost" onClick={() => { setReplyTo(null); setReplyText(''); }} aria-label="Cancel reply">Cancel</button>
                  </div>
                </div>
              )}
              {threadCount > 0 && hiddenReplies.has(c.id) ? (
                <div className="comment-collapsed" onClick={() => toggleHiddenReplies(c.id)}>
                  <span className="comment-collapsed-text">{threadCount} repl{threadCount !== 1 ? 'ies' : 'y'} hidden</span>
                </div>
              ) : (
                replies.map((r) => renderComment(r, depth + 1, c.id))
              )}
            </>
          ) : (
            <div className="comment-collapsed" onClick={() => toggleCollapse(c.id)}>
              <span className="comment-collapsed-text">{threadCount} repl{threadCount !== 1 ? 'ies' : 'y'} hidden</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="comments-section">
      <h2>Comments ({comments.length})</h2>

      {user ? (
        <div className="comment-form">
          <textarea
            className="comment-input"
            placeholder="Share your thoughts..."
            aria-label="Write a comment"
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            rows={3}
          />
          <div className="comment-form-actions">
            <button className="btn btn-sm btn-primary" onClick={handleSubmit} disabled={!newText.trim()} aria-label="Post comment">Post Comment</button>
          </div>
        </div>
      ) : (
        <p className="muted"><Link to="/auth">Sign in</Link> to comment.</p>
      )}

      <div className="comments-list">
        {topLevel.length === 0 ? (
          <p className="muted">No comments yet. Be the first!</p>
        ) : (
          topLevel.map((c) => renderComment(c))
        )}
      </div>
    </div>
  );
};

export default CommentSection;