import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { v4 as uuidv4 } from 'uuid';
import type { User, AuthState } from '../../types';

const STORAGE_KEY = 'trail-dig-auth';
const USERS_KEY = 'trail-dig-users';

interface LoginPayload {
  email: string;
  password: string;
}

interface RegisterPayload {
  email: string;
  password: string;
  displayName: string;
  userType: 'volunteer' | 'organization';
}

interface StoredUser extends User {
  password: string;
  verified?: boolean;
  verificationToken?: string;
  resetToken?: string;
  resetTokenExpiry?: string;
}

const loadUser = (): User | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const loadUsers = (): StoredUser[] => {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
  } catch {
    return [];
  }
};

const saveUsers = (users: StoredUser[]) => {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
};

const initialState: AuthState & { pendingVerification: { email: string; verificationToken: string } | null } = {
  user: loadUser(),
  isAuthenticated: !!loadUser(),
  loading: false,
  pendingVerification: null,
};

export const register = createAsyncThunk<
  { user: User; needsVerification: boolean; verificationToken?: string },
  RegisterPayload
>('auth/register', async (payload) => {
  await new Promise((r) => setTimeout(r, 500));
  const users = loadUsers();
  if (users.find((u) => u.email === payload.email)) {
    throw new Error('Email already registered');
  }

  const isDemo = payload.email.startsWith('demo@');
  const verificationToken = isDemo ? '' : uuidv4();

  const stored: StoredUser = {
    id: uuidv4(),
    email: payload.email,
    password: payload.password,
    displayName: payload.displayName,
    createdAt: new Date().toISOString(),
    userType: payload.userType,
    verified: isDemo,
    verificationToken: isDemo ? undefined : verificationToken,
  };
  users.push(stored);
  saveUsers(users);

  const { password, ...user } = stored;

  if (isDemo) {
    // Auto-login for demo users
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    return { user: user as User, needsVerification: false };
  }

  return { user: user as User, needsVerification: true, verificationToken };
});

export const verifyEmail = createAsyncThunk<string, { token: string }>(
  'auth/verifyEmail',
  async ({ token }) => {
    await new Promise((r) => setTimeout(r, 300));
    const users = loadUsers();
    const match = users.find((u) => u.verificationToken === token);
    if (!match) throw new Error('Invalid or expired verification link');
    if (match.verified) throw new Error('Email already verified');
    match.verified = true;
    match.verificationToken = undefined;
    saveUsers(users);
    return match.email;
  }
);

export const requestPasswordReset = createAsyncThunk<
  { email: string; resetToken: string },
  { email: string }
>('auth/requestReset', async ({ email }) => {
  await new Promise((r) => setTimeout(r, 300));
  const users = loadUsers();
  const user = users.find((u) => u.email === email);
  if (!user) throw new Error('No account found with that email');
  const resetToken = uuidv4().slice(0, 12);
  user.resetToken = resetToken;
  user.resetTokenExpiry = new Date(Date.now() + 3600000).toISOString(); // 1 hour
  saveUsers(users);
  return { email, resetToken };
});

export const resetPassword = createAsyncThunk<
  void,
  { token: string; newPassword: string }
>('auth/resetPassword', async ({ token, newPassword }) => {
  await new Promise((r) => setTimeout(r, 300));
  const users = loadUsers();
  const match = users.find(
    (u) => u.resetToken === token && u.resetTokenExpiry && new Date(u.resetTokenExpiry) > new Date()
  );
  if (!match) throw new Error('Invalid or expired reset token');
  match.password = newPassword;
  match.resetToken = undefined;
  match.resetTokenExpiry = undefined;
  saveUsers(users);
});

export const login = createAsyncThunk<User, LoginPayload>(
  'auth/login',
  async (payload) => {
    await new Promise((r) => setTimeout(r, 500));
    const users = loadUsers();
    const match = users.find(
      (u) => u.email === payload.email && u.password === payload.password
    );
    if (!match) throw new Error('Invalid email or password');
    if (!match.verified && !payload.email.startsWith('demo@')) {
      throw new Error('Please verify your email before signing in');
    }
    const { password, verificationToken, resetToken, resetTokenExpiry, ...user } = match;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    return user as User;
  }
);

export const deleteAccount = createAsyncThunk<void, string>(
  'auth/deleteAccount',
  async (userId) => {
    await new Promise((r) => setTimeout(r, 400));
    
    // Unregister from all events
    const EVENTS_KEY = 'trail-dig-events';
    try {
      const events = JSON.parse(localStorage.getItem(EVENTS_KEY) || '[]');
      let changed = false;
      for (const e of events) {
        if (e.registeredVolunteers?.includes(userId)) {
          e.registeredVolunteers = e.registeredVolunteers.filter((id: string) => id !== userId);
          changed = true;
        }
        if (e.waitlist?.includes(userId)) {
          e.waitlist = e.waitlist.filter((id: string) => id !== userId);
          changed = true;
        }
      }
      if (changed) localStorage.setItem(EVENTS_KEY, JSON.stringify(events));
    } catch {}

    // Remove from trail-dig-users
    const users = loadUsers();
    saveUsers(users.filter((u) => u.id !== userId));

    // Remove profile
    try {
      const profiles = JSON.parse(localStorage.getItem('trail-dig-profiles') || '{}');
      delete profiles[userId];
      localStorage.setItem('trail-dig-profiles', JSON.stringify(profiles));
    } catch {}

    // Clear auth session
    localStorage.removeItem(STORAGE_KEY);
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout(state) {
      state.user = null;
      state.isAuthenticated = false;
      state.pendingVerification = null;
      localStorage.removeItem(STORAGE_KEY);
    },
    clearPendingVerification(state) {
      state.pendingVerification = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(register.pending, (state) => { state.loading = true; })
      .addCase(register.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.needsVerification) {
          state.pendingVerification = {
            email: action.payload.user.email,
            verificationToken: action.payload.verificationToken!,
          };
        } else {
          state.user = action.payload.user;
          state.isAuthenticated = true;
        }
      })
      .addCase(register.rejected, (state) => { state.loading = false; })
      .addCase(login.pending, (state) => { state.loading = true; })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(login.rejected, (state) => { state.loading = false; })
      .addCase(deleteAccount.fulfilled, (state) => {
        state.user = null;
        state.isAuthenticated = false;
        state.pendingVerification = null;
      });
  },
});

export const { logout, clearPendingVerification } = authSlice.actions;
export const selectPendingVerification = (state: { auth: ReturnType<typeof authSlice.reducer> }) =>
  state.auth.pendingVerification;
export default authSlice.reducer;