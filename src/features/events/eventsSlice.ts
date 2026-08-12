import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { v4 as uuidv4 } from 'uuid';
import type { DigEvent, EventsState, ProvidedItem, RecommendedItem, RecurrenceType, NotificationItem } from '../../types';

const seedNotifications = (): NotificationItem[] => [
  { id: 'notif-1', eventId: 'seed-event-043', type: 'event', message: 'New dig day: Galbraith Mountain Dig Day', read: false, createdAt: '2026-08-07T10:00:00' },
  { id: 'notif-2', eventId: 'seed-event-045', type: 'event', message: 'Demo Forest Flow Trail needs volunteers', read: false, createdAt: '2026-08-06T14:30:00' },
  { id: 'notif-3', eventId: 'seed-event-046', type: 'event', message: 'Porcupine Rim Trail work session posted', read: false, createdAt: '2026-08-05T09:15:00' },
  { id: 'notif-4', eventId: 'seed-event-049', type: 'event', message: 'Copper Harbor trail repair this weekend', read: true, createdAt: '2026-08-03T16:00:00' },
  { id: 'notif-5', eventId: 'seed-event-054', type: 'event', message: 'Buffalo Creek Homestead work day rescheduled', read: true, createdAt: '2026-08-01T11:45:00' },
  { id: 'notif-6', eventId: 'seed-event-056', type: 'event', message: 'Oak Mountain trail maintenance signup open', read: false, createdAt: '2026-08-08T08:00:00' },
  // Comment & reply notifications
  { id: 'notif-cmt-1', eventId: 'seed-event-001', type: 'comment', message: 'Galbraith Crew commented on Church Street Trail Build', read: false, createdAt: '2026-08-09T14:30:00', fromUserId: 'other-creator-1', commentId: 'seed-cmt-001' },
  { id: 'notif-cmt-2', eventId: 'seed-event-001', type: 'reply', message: 'Trail Builder replied to your comment on Church Street Trail Build', read: false, createdAt: '2026-08-09T15:00:00', fromUserId: 'demo-user-1', commentId: 'seed-cmt-002' },
  { id: 'notif-cmt-3', eventId: 'seed-event-001', type: 'reply', message: 'Galbraith Crew replied to your comment on Church Street Trail Build', read: false, createdAt: '2026-08-09T16:15:00', fromUserId: 'other-creator-1', commentId: 'seed-cmt-003' },
  { id: 'notif-cmt-4', eventId: 'seed-event-003', type: 'comment', message: 'Galbraith Crew commented on Pisgah Trail Day — Bennett Gap', read: false, createdAt: '2026-08-07T06:00:00', fromUserId: 'other-creator-1', commentId: 'seed-cmt-011' },
  { id: 'notif-cmt-5', eventId: 'seed-event-003', type: 'reply', message: 'Trail Builder replied to your comment on Pisgah Trail Day — Bennett Gap', read: true, createdAt: '2026-08-07T07:00:00', fromUserId: 'demo-user-1', commentId: 'seed-cmt-012' },
  { id: 'notif-cmt-6', eventId: 'seed-event-003', type: 'reply', message: 'Galbraith Crew replied to your comment on Pisgah Trail Day — Bennett Gap', read: false, createdAt: '2026-08-07T08:00:00', fromUserId: 'other-creator-1', commentId: 'seed-cmt-013' },
  { id: 'notif-cmt-7', eventId: 'seed-event-001', type: 'comment', message: 'UMWELD Training Staff commented on Church Street Trail Build', read: false, createdAt: '2026-08-10T11:00:00', fromUserId: 'other-creator-2', commentId: 'seed-cmt-006' },
];

const STORAGE_KEY = 'trail-dig-events';

const getInitialTheme = (): 'light' | 'dark' => {
  const stored = localStorage.getItem('trail-dig-theme');
  const theme = (stored === 'dark' || stored === 'light') ? stored : (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  document.documentElement.setAttribute('data-theme', theme);
  return theme;
};

const loadEvents = (): DigEvent[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const events: DigEvent[] = JSON.parse(raw);
    return events.map((e) => ({
      ...e,
      recurrence: e.recurrence ?? 'none',
      recurrenceEnd: e.recurrenceEnd ?? '',
      recurrenceGroupId: e.recurrenceGroupId ?? '',
    }));
  } catch {
    return [];
  }
};

const saveEvents = (events: DigEvent[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
};

const loadLocation = (): [number, number] | null => {
  try {
    const raw = localStorage.getItem('trail-dig-location');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length === 2) return parsed as [number, number];
    return null;
  } catch { return null; }
};

const initialState: EventsState = {
  items: loadEvents(),
  myEvents: [],
  loading: false,
  searchRadius: 10,
  searchCenter: loadLocation(),
  mapZoom: 10,
  theme: getInitialTheme(),
  hoveredMarkerId: null,
  notificationsEnabled: false,
  notificationRadius: 25,
  notifications: seedNotifications(),
  referrerPath: '/',
  selectedDay: null as string | null,
  showRecurring: false,
  followedOrgs: [],
};

// Re-read events from localStorage after seed runs (ES module hoisting means
// items above may be empty even after ensureSeedData() called it first)
const reloadEvents = (): DigEvent[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch { return []; }
};

interface CreateEventPayload {
  creatorId: string;
  title: string;
  description: string;
  trailName: string;
  trailSystem: string;
  coordinates: [number, number];
  locationName: string;
  date: string;
  startTime: string;
  endTime: string;
  difficulty: 'easy' | 'moderate' | 'challenging' | 'expert';
  maxVolunteers: number;
  providedItems: ProvidedItem[];
  recommendedItems: RecommendedItem[];
  requirements: string[];
  parkingNotes: string;
  weatherNotes: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  imageUrl: string;
  isPrivate: boolean;
  recurrence: RecurrenceType;
  recurrenceEnd: string;
}

export const createEvent = createAsyncThunk<DigEvent, CreateEventPayload>(
  'events/create',
  async (payload) => {
    await new Promise((r) => setTimeout(r, 200));
    const now = new Date().toISOString();
    const event: DigEvent = {
      id: uuidv4(),
      ...payload,
      status: 'planned',
      registeredVolunteers: [],
      recurrenceGroupId: payload.recurrence !== 'none' ? uuidv4() : '',
      createdAt: now,
      updatedAt: now,
    };
    const events = loadEvents();
    events.push(event);
    saveEvents(events);
    return event;
  }
);

export const updateEvent = createAsyncThunk<
  DigEvent,
  { id: string; updates: Partial<DigEvent> }
>('events/update', async ({ id, updates }) => {
  await new Promise((r) => setTimeout(r, 200));
  const events = loadEvents();
  const idx = events.findIndex((e) => e.id === id);
  if (idx === -1) throw new Error('Event not found');
  events[idx] = { ...events[idx], ...updates, updatedAt: new Date().toISOString() };
  saveEvents(events);
  return events[idx];
});

export const deleteEvent = createAsyncThunk<string, string>(
  'events/delete',
  async (id) => {
    await new Promise((r) => setTimeout(r, 200));
    const events = loadEvents();
    saveEvents(events.filter((e) => e.id !== id));
    return id;
  }
);

export const registerForEvent = createAsyncThunk<
  DigEvent,
  { eventId: string; userId: string }
>('events/register', async ({ eventId, userId }) => {
  await new Promise((r) => setTimeout(r, 200));
  const events = loadEvents();
  const event = events.find((e) => e.id === eventId);
  if (!event) throw new Error('Event not found');
  if (new Date(event.date) < new Date(new Date().toDateString())) throw new Error('Event has already passed');
  if (event.registeredVolunteers.includes(userId)) {
    event.registeredVolunteers = event.registeredVolunteers.filter((id) => id !== userId);
  } else {
    if (event.registeredVolunteers.length >= event.maxVolunteers) {
      throw new Error('Event is full');
    }
    event.registeredVolunteers.push(userId);
  }
  event.updatedAt = new Date().toISOString();
  saveEvents(events);
  return event;
});

const eventsSlice = createSlice({
  name: 'events',
  initialState,
  reducers: {
    setSearchRadius(state, action: PayloadAction<number>) {
      state.searchRadius = action.payload;
    },
    setSearchCenter(state, action: PayloadAction<[number, number]>) {
      state.searchCenter = action.payload;
    },
    setMapViewport(state, action: PayloadAction<number>) {
      state.mapZoom = action.payload;
    },
    setTheme(state, action: PayloadAction<'light' | 'dark'>) {
      state.theme = action.payload;
      localStorage.setItem('trail-dig-theme', action.payload);
      document.documentElement.setAttribute('data-theme', action.payload);
    },
    clearSearchCenter(state) {
      state.searchCenter = null;
    },
    setHoveredMarkerId(state, action: PayloadAction<string | null>) {
      state.hoveredMarkerId = action.payload;
    },
    setNotificationsEnabled(state, action: PayloadAction<boolean>) {
      state.notificationsEnabled = action.payload;
    },
    setNotificationRadius(state, action: PayloadAction<number>) {
      state.notificationRadius = action.payload;
    },
    addNotification(state, action: PayloadAction<NotificationItem>) {
      state.notifications.unshift(action.payload);
    },
    markNotificationRead(state, action: PayloadAction<string>) {
      const n = state.notifications.find((n) => n.id === action.payload);
      if (n) n.read = true;
    },
    setReferrerPath(state, action: PayloadAction<string>) {
      state.referrerPath = action.payload;
    },
    setSelectedDay(state, action: PayloadAction<string | null>) {
      state.selectedDay = action.payload;
    },
    setShowRecurring(state, action: PayloadAction<boolean>) {
      state.showRecurring = action.payload;
    },
    loadEventsFromStorage(state) {
      state.items = reloadEvents();
    },
    followOrg(state, action: PayloadAction<string>) {
      if (!state.followedOrgs.includes(action.payload)) {
        state.followedOrgs.push(action.payload);
      }
    },
    unfollowOrg(state, action: PayloadAction<string>) {
      state.followedOrgs = state.followedOrgs.filter((o) => o !== action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createEvent.pending, (state) => { state.loading = true; })
      .addCase(createEvent.fulfilled, (state, action) => {
        state.loading = false;
        state.items.push(action.payload);
        if (state.notificationsEnabled) {
          state.notifications.unshift({
            id: uuidv4(),
            eventId: action.payload.id,
            type: 'event',
            message: `New dig day: ${action.payload.title}`,
            read: false,
            createdAt: new Date().toISOString(),
          });
        }
      })
      .addCase(createEvent.rejected, (state) => { state.loading = false; })
      .addCase(updateEvent.fulfilled, (state, action) => {
        const idx = state.items.findIndex((e) => e.id === action.payload.id);
        if (idx !== -1) state.items[idx] = action.payload;
      })
      .addCase(deleteEvent.fulfilled, (state, action) => {
        state.items = state.items.filter((e) => e.id !== action.payload);
      })
      .addCase(registerForEvent.fulfilled, (state, action) => {
        const idx = state.items.findIndex((e) => e.id === action.payload.id);
        if (idx !== -1) state.items[idx] = action.payload;
      });
  },
});

export const { setSearchRadius, setSearchCenter, setMapViewport, setTheme, clearSearchCenter, setHoveredMarkerId, setNotificationsEnabled, setNotificationRadius, addNotification, markNotificationRead, setReferrerPath, setSelectedDay, setShowRecurring, followOrg, unfollowOrg, loadEventsFromStorage } = eventsSlice.actions;
export default eventsSlice.reducer;