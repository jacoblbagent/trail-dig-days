import { createSlice, PayloadAction } from '@reduxjs/toolkit';

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

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    register(
      state,
      action: PayloadAction<{
        email: string;
        password: string;
        displayName: string;
        userType: 'volunteer' | 'organization';
      }>
    ) {
      const { email, password, displayName, userType } = action.payload;
      const existing = JSON.parse(localStorage.getItem('trail-dig-users') || '[]');
      if (existing.find((u: any) => u.email === email)) {
        state.error = 'An account with this email already exists.';
        return;
      }
      const id = 'user-' + crypto.randomUUID();
      const now = new Date().toISOString();
      const user: StoredUser & { password: string } = {
        id, email, displayName, userType, createdAt: now, password,
      };
      existing.push(user);
      localStorage.setItem('trail-dig-users', JSON.stringify(existing));
      const publicUser: StoredUser = { id, email, displayName, userType, createdAt: now };
      localStorage.setItem('trail-dig-auth', JSON.stringify(publicUser));
      state.user = publicUser;
      state.error = null;
    },
    clearError(state) {
      state.error = null;
    },
    logout(state) {
      localStorage.removeItem('trail-dig-auth');
      state.user = null;
    },
  },
});

export const { register, clearError, logout } = authSlice.actions;
export default authSlice.reducer;