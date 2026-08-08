import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { v4 as uuidv4 } from 'uuid';
import type { DigEvent, EventsState, ProvidedItem, RecommendedItem } from '../../types';

const STORAGE_KEY = 'trail-dig-events';

const loadEvents = (): DigEvent[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const saveEvents = (events: DigEvent[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
};

const initialState: EventsState = {
  items: loadEvents(),
  myEvents: [],
  loading: false,
  searchRadius: 50,
  searchCenter: null,
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
    clearSearchCenter(state) {
      state.searchCenter = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createEvent.pending, (state) => { state.loading = true; })
      .addCase(createEvent.fulfilled, (state, action) => {
        state.loading = false;
        state.items.push(action.payload);
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

export const { setSearchRadius, setSearchCenter, clearSearchCenter } = eventsSlice.actions;
export default eventsSlice.reducer;