import { v4 as uuidv4 } from 'uuid';
import type { UserProfile, DigEvent } from '../types';

const AUTH_KEY = 'trail-dig-auth';
const EVENTS_KEY = 'trail-dig-events';
const PROFILES_KEY = 'trail-dig-profiles';
const SEEDED_KEY = 'trail-dig-seeded';

// Matthews, NC  /  Brevard, NC
const MATTHEWS: [number, number] = [35.1168, -80.7237];

const DEMO_USER = {
  id: 'demo-user-1',
  email: 'demo@trailbuilder.com',
  displayName: 'Trail Builder',
  createdAt: new Date('2026-04-09').toISOString(),
};

const demoProfile: UserProfile = {
  userId: DEMO_USER.id,
  displayName: DEMO_USER.displayName,
  bio: 'Dirt worker and trail enthusiast. Building sustainable singletrack one bench cut at a time.',
  avatarUrl: '',
  location: 'Matthews, NC, United States',
  coordinates: MATTHEWS,
  trailCrew: 'Tarheel Trail Blazers',
  trailCrewUrl: 'https://tarheeltrailblazers.com',
  skills: ['Trail Design', 'Bench Cutting', 'Rock Work', 'Erosion Control', 'Crew Leadership'],
  certifications: ['First Aid / CPR', 'Trail Crew Leader', 'Sawyer Level 1'],
  favoriteTrails: [],
  digStats: { totalDigs: 8, totalHours: 64, totalMiles: 0 },
  socialLinks: { instagram: 'https://instagram.com/trailbuilder', strava: 'https://strava.com/athletes/trailbuilder', facebook: '', website: 'https://trailbuilder.com' },
  gearList: ['McLeod', 'Pick Mattock', 'Shovel', 'Pulaski', 'Rock Bar'],
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
};

const now = new Date();
const day = (offset: number) => {
  const d = new Date(now);
  d.setDate(d.getDate() + offset);
  return d.toISOString().split('T')[0];
};

const seedEvents: DigEvent[] = [
  {
    id: uuidv4(),
    creatorId: DEMO_USER.id,
    title: 'Church Street Trail Build',
    description: 'Help us build a new section of flow trail at Church Street Park. We will be cutting bench, installing drain dips, and shaping rollers. Beginners welcome!',
    trailName: 'Church Street Park',
    trailSystem: 'Matthews Trail Network',
    coordinates: MATTHEWS,
    locationName: 'Matthews, NC',
    date: day(3),
    startTime: '8:00 AM',
    endTime: '1:00 PM',
    status: 'confirmed',
    difficulty: 'easy',
    maxVolunteers: 25,
    registeredVolunteers: [DEMO_USER.id],
    providedItems: [
      { name: 'McLeods', quantity: 10, description: '' },
      { name: 'Shovels', quantity: 10, description: '' },
      { name: 'Water', quantity: 48, description: '' },
      { name: 'Gloves', quantity: 30, description: '' },
    ],
    recommendedItems: [
      { name: 'Sturdy boots', essential: true, notes: '' },
      { name: 'Long pants', essential: true, notes: '' },
      { name: 'Sun protection', essential: false, notes: 'Hat and sunscreen' },
      { name: 'Snacks', essential: false, notes: '' },
    ],
    requirements: [],
    parkingNotes: 'Park at the church lot on Church Street. Trailhead is at the back of the lot.',
    weatherNotes: 'Will cancel if heavy rain. Check the FB event page morning of.',
    contactName: 'Trail Builder',
    contactEmail: 'demo@trailbuilder.com',
    contactPhone: '',
    imageUrl: '',
    createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    id: uuidv4(),
    creatorId: DEMO_USER.id,
    title: 'Rock Garden Rehab at Colonel Beatty',
    description: 'The rock garden at Colonel Beatty has gotten overgrown and loose. We need a crew to clear debris, reset key rocks, and re-establish the line.',
    trailName: 'Colonel Beatty Trail',
    trailSystem: 'Matthews Trail Network',
    coordinates: [35.1196, -80.7230],
    locationName: 'Matthews, NC',
    date: day(10),
    startTime: '8:30 AM',
    endTime: '12:30 PM',
    status: 'confirmed',
    difficulty: 'moderate',
    maxVolunteers: 15,
    registeredVolunteers: [],
    providedItems: [
      { name: 'Rock Bars', quantity: 6, description: '' },
      { name: 'Pick Mattocks', quantity: 6, description: '' },
      { name: 'Gloves', quantity: 20, description: '' },
    ],
    recommendedItems: [
      { name: 'Sturdy boots', essential: true, notes: 'Steel toe preferred' },
      { name: 'Work gloves', essential: true, notes: '' },
      { name: 'Eye protection', essential: true, notes: '' },
    ],
    requirements: ['Must be 16+', 'Signed waiver required'],
    parkingNotes: 'Park at the Colonel Beatty Park lot on the corner. We will meet at the picnic shelter.',
    weatherNotes: '',
    contactName: 'Trail Builder',
    contactEmail: 'demo@trailbuilder.com',
    contactPhone: '',
    imageUrl: '',
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: uuidv4(),
    creatorId: DEMO_USER.id,
    title: 'Pisgah Trail Day — Bennett Gap',
    description: 'Annual spring trail day on Bennett Gap. We will be doing tread work, clearing drains, and brushing back vegetation. This is a classic Pisgah trail and needs love every season.',
    trailName: 'Bennett Gap Trail',
    trailSystem: 'Pisgah National Forest',
    coordinates: [35.2803, -82.7704],
    locationName: 'Brevard, NC',
    date: day(17),
    startTime: '7:00 AM',
    endTime: '3:00 PM',
    status: 'planned',
    difficulty: 'challenging',
    maxVolunteers: 20,
    registeredVolunteers: [],
    providedItems: [
      { name: 'McLeods', quantity: 8, description: '' },
      { name: 'Hazel Hoes', quantity: 6, description: '' },
      { name: 'Hand Saws', quantity: 4, description: '' },
      { name: 'Water', quantity: 40, description: '' },
      { name: 'Lunch', quantity: 20, description: '' },
    ],
    recommendedItems: [
      { name: 'Sturdy boots', essential: true, notes: '' },
      { name: 'Long pants', essential: true, notes: '' },
      { name: 'Rain jacket', essential: false, notes: 'Mountain weather changes fast' },
      { name: 'Snacks', essential: false, notes: '' },
      { name: 'Chainsaw (if certified)', essential: false, notes: 'Let us know ahead' },
    ],
    requirements: ['Must be 18+', 'Signed waiver required'],
    parkingNotes: 'Meet at the Bennett Gap trailhead on FR 5001. High clearance vehicle recommended.',
    weatherNotes: 'Ride or shine — we work in light rain. Thunderstorms will cancel.',
    contactName: 'Trail Builder',
    contactEmail: 'demo@trailbuilder.com',
    contactPhone: '',
    imageUrl: '',
    createdAt: new Date(Date.now() - 86400000 * 6).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: uuidv4(),
    creatorId: DEMO_USER.id,
    title: 'Sycamore Cycles Shop Ride & Dig',
    description: 'Monthly shop ride followed by trail maintenance on the Dupont Forest trails. We ride 10 miles then spend 2 hours doing tread work. All skill levels welcome. Tools provided by Sycamore Cycles.',
    trailName: 'Dupont State Forest — Ridgeline Trail',
    trailSystem: 'Dupont State Forest',
    coordinates: [35.1983, -82.6208],
    locationName: 'Brevard, NC',
    date: day(24),
    startTime: '9:00 AM',
    endTime: '2:00 PM',
    status: 'planned',
    difficulty: 'easy',
    maxVolunteers: 30,
    registeredVolunteers: [DEMO_USER.id],
    providedItems: [
      { name: 'McLeods', quantity: 12, description: '' },
      { name: 'Shovels', quantity: 8, description: '' },
      { name: 'Rakes', quantity: 6, description: '' },
      { name: 'Water', quantity: 60, description: '' },
      { name: 'Snacks', quantity: 30, description: 'Granola bars and fruit' },
    ],
    recommendedItems: [
      { name: 'Mountain bike', essential: false, notes: 'For the ride portion' },
      { name: 'Helmet', essential: true, notes: 'Required for the ride' },
      { name: 'Sturdy boots', essential: true, notes: '' },
      { name: 'Spare tube', essential: false, notes: '' },
    ],
    requirements: [],
    parkingNotes: 'Park at the Sycamore Cycles lot on Broad St. We shuttle from there.',
    weatherNotes: 'Postponed to following week if heavy rain is forecast.',
    contactName: 'Trail Builder',
    contactEmail: 'demo@trailbuilder.com',
    contactPhone: '',
    imageUrl: '',
    createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: uuidv4(),
    creatorId: DEMO_USER.id,
    title: 'Past Dig — Four Mile Creek',
    description: 'We completed a new connector trail at Four Mile Creek Park. Great turnout!',
    trailName: 'Four Mile Creek Greenway',
    trailSystem: 'Matthews Trail Network',
    coordinates: [35.1073, -80.7302],
    locationName: 'Matthews, NC',
    date: day(-14),
    startTime: '8:00 AM',
    endTime: '12:00 PM',
    status: 'completed',
    difficulty: 'easy',
    maxVolunteers: 20,
    registeredVolunteers: [DEMO_USER.id],
    providedItems: [
      { name: 'Shovels', quantity: 10, description: '' },
      { name: 'McLeods', quantity: 8, description: '' },
    ],
    recommendedItems: [
      { name: 'Sturdy boots', essential: true, notes: '' },
    ],
    requirements: [],
    parkingNotes: 'Four Mile Creek Park lot.',
    weatherNotes: '',
    contactName: 'Trail Builder',
    contactEmail: 'demo@trailbuilder.com',
    contactPhone: '',
    imageUrl: '',
    createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 14).toISOString(),
  },
];

export const ensureSeedData = () => {
  if (localStorage.getItem(SEEDED_KEY)) return;

  // Seed auth user
  localStorage.setItem(AUTH_KEY, JSON.stringify(DEMO_USER));

  // Seed registered users (so login works)
  const users = [{ ...DEMO_USER, password: 'demo1234' }];
  localStorage.setItem('trail-dig-users', JSON.stringify(users));

  // Seed profile
  const profiles: Record<string, UserProfile> = {};
  profiles[DEMO_USER.id] = demoProfile;
  localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));

  // Seed events
  localStorage.setItem(EVENTS_KEY, JSON.stringify(seedEvents));

  localStorage.setItem(SEEDED_KEY, 'true');
};