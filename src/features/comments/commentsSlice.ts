import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { v4 as uuidv4 } from 'uuid';
import type { Comment, CommentsState } from '../../types';
import { sanitizeMultiline } from '../../utils/sanitize';

const STORAGE_KEY = 'trail-dig-comments';

const loadComments = (): Comment[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch { return []; }
};

const saveComments = (comments: Comment[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(comments));
};

const initialState: CommentsState = {
  items: loadComments(),
  loading: false,
};

export const addComment = createAsyncThunk<Comment, { eventId: string; userId: string; text: string }>(
  'comments/add',
  async ({ eventId, userId, text }) => {
    await new Promise((r) => setTimeout(r, 100));
    const comment: Comment = {
      id: uuidv4(),
      eventId,
      userId,
      parentId: null,
      text: sanitizeMultiline(text),
      createdAt: new Date().toISOString(),
      votes: {},
    };
    const comments = loadComments();
    comments.push(comment);
    saveComments(comments);
    return comment;
  }
);

export const replyToComment = createAsyncThunk<Comment, { eventId: string; userId: string; parentId: string; text: string }>(
  'comments/reply',
  async ({ eventId, userId, parentId, text }) => {
    await new Promise((r) => setTimeout(r, 100));
    const reply: Comment = {
      id: uuidv4(),
      eventId,
      userId,
      parentId,
      text: sanitizeMultiline(text),
      createdAt: new Date().toISOString(),
      votes: {},
    };
    const comments = loadComments();
    comments.push(reply);
    saveComments(comments);
    return reply;
  }
);

export const voteOnComment = createAsyncThunk<{ commentId: string; userId: string; direction: 'up' | 'down' | null }, { commentId: string; userId: string; direction: 'up' | 'down' | null }>(
  'comments/vote',
  async ({ commentId, userId, direction }) => {
    await new Promise((r) => setTimeout(r, 100));
    const comments = loadComments();
    const comment = comments.find((c) => c.id === commentId);
    if (!comment) throw new Error('Comment not found');
    if (direction === null) {
      delete comment.votes[userId];
    } else {
      comment.votes[userId] = direction;
    }
    saveComments(comments);
    return { commentId, userId, direction };
  }
);

export const editComment = createAsyncThunk<Comment, { commentId: string; text: string }>(
  'comments/edit',
  async ({ commentId, text }) => {
    await new Promise((r) => setTimeout(r, 100));
    const comments = loadComments();
    const comment = comments.find((c) => c.id === commentId);
    if (!comment) throw new Error('Comment not found');
    comment.text = text;
    comment.edited = true;
    saveComments(comments);
    return comment;
  }
);

const commentsSlice = createSlice({
  name: 'comments',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(addComment.pending, (state) => { state.loading = true; })
      .addCase(addComment.fulfilled, (state, action) => {
        state.loading = false;
        state.items.push(action.payload);
      })
      .addCase(addComment.rejected, (state) => { state.loading = false; })
      .addCase(replyToComment.pending, (state) => { state.loading = true; })
      .addCase(replyToComment.fulfilled, (state, action) => {
        state.loading = false;
        state.items.push(action.payload);
      })
      .addCase(replyToComment.rejected, (state) => { state.loading = false; })
      .addCase(voteOnComment.fulfilled, (state, action) => {
        const { commentId, userId, direction } = action.payload;
        const comment = state.items.find((c) => c.id === commentId);
        if (comment) {
          if (direction === null) {
            delete comment.votes[userId];
          } else {
            comment.votes[userId] = direction;
          }
        }
      })
      .addCase(editComment.fulfilled, (state, action) => {
        const idx = state.items.findIndex((c) => c.id === action.payload.id);
        if (idx !== -1) state.items[idx] = action.payload;
      });
  },
});

export default commentsSlice.reducer;