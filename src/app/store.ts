import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice';
import profileReducer from '../features/profile/profileSlice';
import eventsReducer from '../features/events/eventsSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    profile: profileReducer,
    events: eventsReducer,
  },
});

export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;