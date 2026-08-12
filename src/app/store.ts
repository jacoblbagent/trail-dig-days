import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice';
import profileReducer from '../features/profile/profileSlice';
import eventsReducer from '../features/events/eventsSlice';
import commentsReducer from '../features/comments/commentsSlice';
import toastReducer from '../features/toast/toastSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    profile: profileReducer,
    events: eventsReducer,
    comments: commentsReducer,
    toast: toastReducer,
  },
});

export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;