import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { ProfileState, UserProfile, CustomField } from '../../types';

const STORAGE_KEY = 'trail-dig-profiles';

const loadProfiles = (): Record<string, UserProfile> => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const saveProfiles = (profiles: Record<string, UserProfile>) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
};

const defaultProfile = (userId: string, displayName: string): UserProfile => ({
  userId,
  displayName,
  bio: '',
  avatarUrl: '',
  location: '',
  coordinates: [40.7128, -74.006],
  trailCrew: '',
  trailCrewUrl: '',
  skills: [],
  certifications: [],
  favoriteTrails: [],
  digStats: { totalDigs: 0, totalHours: 0, totalMiles: 0 },
  socialLinks: { instagram: '', strava: '', facebook: '', website: '' },
  gearList: [],
  availability: [],
  customFields: [],
  theme: {
    accentColor: '#2d6a4f',
    headerImage: '',
    showStats: true,
    showGear: true,
    showSocial: true,
    layout: 'standard',
  },
});

const initialState: ProfileState = {
  profiles: loadProfiles(),
  loading: false,
};

export const createProfile = createAsyncThunk<
  UserProfile,
  { userId: string; displayName: string }
>('profile/create', async ({ userId, displayName }) => {
  await new Promise((r) => setTimeout(r, 100));
  const profiles = loadProfiles();
  if (profiles[userId]) return profiles[userId];
  const profile = defaultProfile(userId, displayName);
  profiles[userId] = profile;
  saveProfiles(profiles);
  return profile;
});

export const updateProfile = createAsyncThunk<
  UserProfile,
  { userId: string; updates: Partial<UserProfile> }
>('profile/update', async ({ userId, updates }) => {
  await new Promise((r) => setTimeout(r, 100));
  const profiles = loadProfiles();
  profiles[userId] = { ...profiles[userId], ...updates };
  saveProfiles(profiles);
  return profiles[userId];
});

export const addCustomField = createAsyncThunk<
  UserProfile,
  { userId: string; field: CustomField }
>('profile/addCustomField', async ({ userId, field }) => {
  await new Promise((r) => setTimeout(r, 100));
  const profiles = loadProfiles();
  profiles[userId].customFields.push(field);
  saveProfiles(profiles);
  return profiles[userId];
});

export const removeCustomField = createAsyncThunk<
  UserProfile,
  { userId: string; fieldId: string }
>('profile/removeCustomField', async ({ userId, fieldId }) => {
  await new Promise((r) => setTimeout(r, 100));
  const profiles = loadProfiles();
  profiles[userId].customFields = profiles[userId].customFields.filter(
    (f) => f.id !== fieldId
  );
  saveProfiles(profiles);
  return profiles[userId];
});

const profileSlice = createSlice({
  name: 'profile',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(createProfile.pending, (state) => { state.loading = true; })
      .addCase(createProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.profiles[action.payload.userId] = action.payload;
      })
      .addCase(createProfile.rejected, (state) => { state.loading = false; })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.profiles[action.payload.userId] = action.payload;
      })
      .addCase(addCustomField.fulfilled, (state, action) => {
        state.profiles[action.payload.userId] = action.payload;
      })
      .addCase(removeCustomField.fulfilled, (state, action) => {
        state.profiles[action.payload.userId] = action.payload;
      });
  },
});

export default profileSlice.reducer;