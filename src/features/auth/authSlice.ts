import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { v4 as uuidv4 } from 'uuid';
import type { User, AuthState } from '../../types';

const STORAGE_KEY = 'trail-dig-auth';

interface LoginPayload {
  email: string;
  password: string;
}

interface RegisterPayload {
  email: string;
  password: string;
  displayName: string;
}

const loadUser = (): User | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const initialState: AuthState = {
  user: loadUser(),
  isAuthenticated: !!loadUser(),
  loading: false,
};

export const register = createAsyncThunk<User, RegisterPayload>(
  'auth/register',
  async (payload) => {
    await new Promise((r) => setTimeout(r, 500));
    const existing = JSON.parse(localStorage.getItem('trail-dig-users') || '[]');
    if (existing.find((u: any) => u.email === payload.email)) {
      throw new Error('Email already registered');
    }
    const user: User = {
      id: uuidv4(),
      email: payload.email,
      displayName: payload.displayName,
      createdAt: new Date().toISOString(),
    };
    existing.push({ ...user, password: payload.password });
    localStorage.setItem('trail-dig-users', JSON.stringify(existing));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    return user;
  }
);

export const login = createAsyncThunk<User, LoginPayload>(
  'auth/login',
  async (payload) => {
    await new Promise((r) => setTimeout(r, 500));
    const existing = JSON.parse(localStorage.getItem('trail-dig-users') || '[]');
    const match = existing.find(
      (u: any) => u.email === payload.email && u.password === payload.password
    );
    if (!match) throw new Error('Invalid email or password');
    const { password, ...user } = match;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    return user as User;
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout(state) {
      state.user = null;
      state.isAuthenticated = false;
      localStorage.removeItem(STORAGE_KEY);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(register.pending, (state) => { state.loading = true; })
      .addCase(register.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(register.rejected, (state) => { state.loading = false; })
      .addCase(login.pending, (state) => { state.loading = true; })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(login.rejected, (state) => { state.loading = false; });
  },
});

export const { logout } = authSlice.actions;
export default authSlice.reducer;