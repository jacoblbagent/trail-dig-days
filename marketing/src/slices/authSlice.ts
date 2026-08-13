import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

interface StoredUser {
  id: string;
  email: string;
  displayName: string;
  userType: 'volunteer' | 'organization';
  createdAt: string;
}

interface AuthState {
  user: StoredUser | null;
  loading: boolean;
  error: string | null;
}

const saved = localStorage.getItem('trail-dig-auth');
const initialUser: StoredUser | null = saved ? JSON.parse(saved) : null;

const initialState: AuthState = {
  user: initialUser,
  loading: false,
  error: null,
};

export const register = createAsyncThunk<
  StoredUser,
  { email: string; password: string; displayName: string; userType: 'volunteer' | 'organization' }
>('auth/register', async (payload) => {
  const existing = JSON.parse(localStorage.getItem('trail-dig-users') || '[]');
  if (existing.find((u: any) => u.email === payload.email)) {
    throw new Error('An account with this email already exists.');
  }
  const id = 'user-' + crypto.randomUUID();
  const now = new Date().toISOString();
  const user = { id, ...payload, createdAt: now };
  existing.push({ ...user, password: payload.password });
  localStorage.setItem('trail-dig-users', JSON.stringify(existing));
  const publicUser: StoredUser = { id, email: payload.email, displayName: payload.displayName, userType: payload.userType, createdAt: now };
  localStorage.setItem('trail-dig-auth', JSON.stringify(publicUser));
  return publicUser;
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError(state) {
      state.error = null;
    },
    logout(state) {
      localStorage.removeItem('trail-dig-auth');
      state.user = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(register.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.error = null;
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Registration failed';
      });
  },
});

export const { clearError, logout } = authSlice.actions;
export default authSlice.reducer;