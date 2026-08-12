// ─── Core User & Auth Types ───
export interface User {
  id: string;
  email: string;
  displayName: string;
  createdAt: string;
  userType: 'volunteer' | 'organization';
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
}

// ─── User Profile (heavily customizable) ───
export interface UserProfile {
  userId: string;
  displayName: string;
  bio: string;
  avatarUrl: string;
  location: string;
  coordinates: [number, number]; // [lat, lng]
  trailCrew: string;
  trailCrewUrl: string;
  skills: string[];
  certifications: string[];
  favoriteTrails: string[];
  createdAt?: string;
  digStats: {
    totalDigs: number;
    totalHours: number;
    totalMiles: number;
  };
  socialLinks: {
    instagram: string;
    strava: string;
    facebook: string;
    website: string;
  };
  gearList: string[];
  availability: string[];
  customFields: CustomField[];
  theme: ProfileTheme;
}

export interface CustomField {
  id: string;
  label: string;
  value: string;
  type: 'text' | 'url' | 'multiline';
}

export interface ProfileTheme {
  accentColor: string;
  headerImage: string;
  coverPosition: number;
  showStats: boolean;
  showGear: boolean;
  showSocial: boolean;
  layout: 'standard' | 'compact' | 'hero';
}

// ─── Dig Day Events ───
export type DigStatus = 'planned' | 'confirmed' | 'cancelled' | 'completed';
export type Difficulty = 'easy' | 'moderate' | 'challenging' | 'expert';

export interface ProvidedItem {
  name: string;
  quantity: 'Few' | 'Plenty';
  description: string;
}

export interface RecommendedItem {
  name: string;
  essential: boolean; // false = recommended, true = required
  notes: string;
}

export type RecurrenceType = 'none' | 'weekly' | 'biweekly' | 'monthly';

// ─── Comments ───
export interface Comment {
  id: string;
  eventId: string;
  userId: string;
  parentId: string | null;
  text: string;
  createdAt: string;
  edited?: boolean;
  votes: Record<string, 'up' | 'down'>;
}

export interface CommentsState {
  items: Comment[];
  loading: boolean;
}

// ─── Notifications ───
export interface NotificationItem {
  id: string;
  eventId: string;
  type: 'event' | 'comment' | 'reply' | 'vote';
  message: string;
  read: boolean;
  createdAt: string;
  fromUserId?: string;
  commentId?: string;
}

export interface DigEvent {
  id: string;
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
  status: DigStatus;
  difficulty: Difficulty;
  maxVolunteers: number;
  registeredVolunteers: string[]; // userId[]
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
  recurrence?: RecurrenceType;
  recurrenceEnd?: string;
  recurrenceGroupId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EventsState {
  items: DigEvent[];
  myEvents: DigEvent[];
  loading: boolean;
  searchRadius: number; // miles
  searchCenter: [number, number] | null;
  mapZoom: number;
  theme: 'light' | 'dark';
  hoveredMarkerId: string | null;
  notificationsEnabled: boolean;
  notificationRadius: number;
  notifications: NotificationItem[];
  referrerPath: string;
  selectedDay: string | null;
  showRecurring: boolean;
  followedOrgs: string[];
}

// ─── Application Root State ───
export interface RootState {
  auth: AuthState;
  profile: ProfileState;
  events: EventsState;
  comments: CommentsState;
}

export interface ProfileState {
  profiles: Record<string, UserProfile>;
  loading: boolean;
}