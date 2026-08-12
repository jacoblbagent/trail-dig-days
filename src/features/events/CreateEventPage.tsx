import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import MapExtras from '../map/MapExtras';
import L from 'leaflet';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { createEvent } from './eventsSlice';
import { addToast } from '../toast/toastSlice';
import TrailAutocomplete from '../../components/TrailAutocomplete';
import type { ProvidedItem, RecommendedItem } from '../../types';

// Fix Leaflet icon issue
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({ iconUrl, iconRetinaUrl, shadowUrl });

const DIFFICULTY_OPTIONS = ['easy', 'moderate', 'challenging', 'expert'] as const;

interface CategoryGroup { label: string; items: string[]; }

const PROVIDED_CATEGORIES: CategoryGroup[] = [
  { label: 'Tools', items: ['Shovels', 'Spades', 'McLeods', 'Pick Mattocks', 'Rakes', 'Hoes', 'Wheelbarrows'] },
  { label: 'Safety', items: ['Gloves', 'Hard Hats', 'Safety Glasses', 'Ear Plugs', 'First Aid Kit'] },
  { label: 'Comfort', items: ['Sunscreen', 'Bug Spray', 'Snacks', 'Lunch', 'Coffee'] },
  { label: 'Water', items: ['Water'] },
];
const RECOMMENDED_CATEGORIES: CategoryGroup[] = [
  { label: 'Clothing', items: ['Sturdy Work Boots', 'Long Pants', 'Long Sleeve Shirt', 'Work Gloves', 'Sun Hat', 'Rain Jacket', 'Change of Clothes'] },
  { label: 'Safety', items: ['Hard Hat', 'Safety Glasses', 'Knee Pads'] },
  { label: 'Hydration / Food', items: ['Water Bottle', 'Snacks'] },
  { label: 'Comfort', items: ['Bug Spray', 'Sunscreen', 'Towel'] },
  { label: 'Other', items: ['Notepad', 'Camera'] },
];

const MOCK_DATASETS = [
  {
    title: "Upper Ridge Reroute Work Party" as const,
    description: "We'll be rebuilding 200ft of eroded singletrack with new bench cut and drainage features. Steep hillside work — expect technical bench cutting and rock armoring. Bring your A-game!",
    trailName: "Upper Ridge Trail",
    trailSystem: "Phil's World",
    locationName: "Phil's World Trailhead",
    lat: "38.4524", lng: "-108.3715",
    dateOffset: 21, startTime: "08:00", endTime: "15:00",
    difficulty: 'challenging' as const, maxVolunteers: 15,
    parkingNotes: "Park at the main trailhead lot. Overflow parking along County Road 12. Please carpool if possible — lot fills up fast on weekends.",
    weatherNotes: "High in the 80s with afternoon thunderstorm chance. Bring rain gear and plenty of water. Work stops if lightning is within 10 miles.",
    contactName: "Sarah Chen", contactEmail: "sarah@trailbuilders.org", contactPhone: "(970) 555-0142",
    imageUrl: "https://images.unsplash.com/photo-1551632811-561732d1e306?w=800",
    requirements: "Must be 18+",
    providedItems: [
      { name: 'Water', quantity: 'Plenty', description: 'Cooler of water at trailhead' },
      { name: 'McLeods', quantity: 'Plenty', description: 'Extra McLeods available' },
      { name: 'Pick Mattocks', quantity: 'Few', description: 'Limited — bring yours if you can' },
      { name: 'Gloves', quantity: 'Few', description: 'Spare pairs available' },
      { name: 'First Aid Kit', quantity: 'Plenty', description: 'Fully stocked at trailhead' },
      { name: 'Snacks', quantity: 'Plenty', description: 'Granola bars and fruit provided' },
    ],
    recommendedItems: [
      { name: 'Sturdy Work Boots', essential: true, notes: 'No trail runners or sandals allowed' },
      { name: 'Long Pants', essential: true, notes: 'Protection from poison ivy and rocks' },
      { name: 'Work Gloves', essential: true, notes: '' },
      { name: 'Water Bottle', essential: false, notes: 'Fill up at trailhead' },
      { name: 'Sun Hat', essential: false, notes: '' },
      { name: 'Rain Jacket', essential: false, notes: 'Afternoon storms expected' },
    ],
  },
  {
    title: "Creekside Trail Maintenance Day",
    description: "Light maintenance day on the Creekside Loop — clearing encroaching brush, cleaning water bars, and replacing a few worn trail markers. Family-friendly pace.",
    trailName: "Creekside Loop",
    trailSystem: "Bear Creek Preserve",
    locationName: "Bear Creek Preserve Parking Area",
    lat: "39.5878", lng: "-106.0931",
    dateOffset: 14, startTime: "09:00", endTime: "13:00",
    difficulty: 'easy' as const, maxVolunteers: 30,
    parkingNotes: "Gravel lot just past the preserve entrance. Volunteers park for free — mention the trail day at the kiosk.",
    weatherNotes: "Morning work window, finish by early afternoon. Light rain cancels. Check social media by 7am for updates.",
    contactName: "Marcus Johnson", contactEmail: "marcus@bearcreek.org", contactPhone: "(970) 555-0387",
    imageUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800",
    requirements: "No experience necessary\nClosed-toe shoes required\nMinors welcome with guardian",
    providedItems: [
      { name: 'Water', quantity: 'Plenty', description: '' },
      { name: 'Shovels', quantity: 'Plenty', description: '' },
      { name: 'Spades', quantity: 'Few', description: '' },
      { name: 'Rakes', quantity: 'Plenty', description: '' },
      { name: 'Gloves', quantity: 'Plenty', description: 'Youth sizes available' },
      { name: 'Snacks', quantity: 'Plenty', description: 'Light refreshments after' },
    ],
    recommendedItems: [
      { name: 'Sturdy Work Boots', essential: true, notes: '' },
      { name: 'Long Pants', essential: true, notes: 'Chaparral can be scratchy' },
      { name: 'Water Bottle', essential: false, notes: '' },
      { name: 'Sun Hat', essential: false, notes: '' },
      { name: 'Bug Spray', essential: false, notes: 'Ticks have been reported' },
    ],
  },
  {
    title: "Big Rock Bridge Build",
    description: "Major construction day! We're replacing a failing log bridge on the Big Rock Trail with a new timber structure. Heavy lifting involved — we need strong backs. All tools and materials provided.",
    trailName: "Big Rock Trail",
    trailSystem: "Poudre Canyon",
    locationName: "Big Rock Trailhead — Poudre Canyon Rd",
    lat: "40.6681", lng: "-105.3712",
    dateOffset: 7, startTime: "07:30", endTime: "16:30",
    difficulty: 'expert' as const, maxVolunteers: 10,
    parkingNotes: "Limited parking at the trailhead (6 cars). Overflow at the Poudre Park lot 0.5 miles east — we'll run a shuttle every 15 minutes.",
    weatherNotes: "Full day on the trail. Pack lunch and 3+ liters of water. Mountain weather is unpredictable — layers required.",
    contactName: "Jake Torres", contactEmail: "jake@trailcrew.coop", contactPhone: "(970) 555-0291",
    imageUrl: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800",
    requirements: "Must be 18+\nPrior trail building experience preferred\nHeavy lifting (50+ lbs) required\nMust sign liability waiver\nChainsaw certification a plus",
    providedItems: [
      { name: 'Water', quantity: 'Plenty', description: '5-gal cooler on site' },
      { name: 'Shovels', quantity: 'Plenty', description: '' },
      { name: 'McLeods', quantity: 'Plenty', description: '' },
      { name: 'Pick Mattocks', quantity: 'Plenty', description: '' },
      { name: 'Hard Hats', quantity: 'Plenty', description: 'Required on site' },
      { name: 'First Aid Kit', quantity: 'Plenty', description: '' },
      { name: 'Lunch', quantity: 'Plenty', description: 'BBQ lunch provided' },
      { name: 'Coffee', quantity: 'Plenty', description: 'Hot coffee from 7am' },
    ],
    recommendedItems: [
      { name: 'Sturdy Work Boots', essential: true, notes: 'Steel toe strongly recommended' },
      { name: 'Long Pants', essential: true, notes: '' },
      { name: 'Long Sleeve Shirt', essential: true, notes: '' },
      { name: 'Work Gloves', essential: true, notes: 'Bring extra pairs — they wear out fast' },
      { name: 'Hard Hat', essential: true, notes: '' },
      { name: 'Knee Pads', essential: false, notes: 'Lots of kneeling work' },
      { name: 'Rain Jacket', essential: false, notes: '' },
    ],
  },
  {
    title: "Morning Trailhead Cleanup & Signage",
    description: "A quick morning of sprucing up the Smith Rock trailhead area. New welcome kiosk, trash pickup, and trailhead garden planting. Great for first-timers!",
    trailName: "Smith Rock Approach",
    trailSystem: "Smith Rock State Park",
    locationName: "Smith Rock Day Use Parking",
    lat: "44.3654", lng: "-121.1413",
    dateOffset: 28, startTime: "08:30", endTime: "12:00",
    difficulty: 'easy' as const, maxVolunteers: 25,
    parkingNotes: "Park in the day-use lot. No fee for volunteers — just let the gate attendant know you're with the trail crew.",
    weatherNotes: "Should be a beautiful morning! Sunscreen recommended. We'll provide a shaded rest area.",
    contactName: "Emily Park", contactEmail: "emily@smithrock.org", contactPhone: "(541) 555-0168",
    imageUrl: "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=800",
    requirements: "All ages welcome\nUnder 16 with adult\nClosed-toe shoes required",
    providedItems: [
      { name: 'Water', quantity: 'Plenty', description: '' },
      { name: 'Gloves', quantity: 'Plenty', description: '' },
      { name: 'Snacks', quantity: 'Plenty', description: 'Pastries and coffee' },
    ],
    recommendedItems: [
      { name: 'Sturdy Work Boots', essential: false, notes: '' },
      { name: 'Long Pants', essential: false, notes: '' },
      { name: 'Sun Hat', essential: false, notes: '' },
      { name: 'Bug Spray', essential: false, notes: '' },
    ],
  },
];

// Geocoding result from Nominatim
/** Inner component: handles map clicks, fires callback */
const LocationMarker: React.FC<{
  position: [number, number] | null;
  onMove: (lat: number, lng: number) => void;
}> = ({ position, onMove }) => {
  useMapEvents({
    click(e) {
      onMove(e.latlng.lat, e.latlng.lng);
    },
  });
  return position ? <Marker position={position} draggable eventHandlers={{
    dragend: (e) => {
      const p = e.target.getLatLng();
      onMove(p.lat, p.lng);
    },
  }} /> : null;
};

/** Centers the map when location changes programmatically */
const FlyToCenter: React.FC<{ center: [number, number] | null }> = ({ center }) => {
  const map = useMap();
  const prev = useRef<string | null>(null);
  useEffect(() => {
    if (center) {
      const key = `${center[0].toFixed(4)},${center[1].toFixed(4)}`;
      if (key !== prev.current) {
        map.flyTo(center, Math.max(map.getZoom(), 13), { duration: 0.5 });
        prev.current = key;
      }
    }
  }, [center, map]);
  return null;
};

const CreateEventPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user } = useAppSelector((s) => s.auth);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [trailName, setTrailName] = useState('');
  const [trailSystem, setTrailSystem] = useState('');
  const [locationName, setLocationName] = useState('');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [difficulty, setDifficulty] = useState<'easy' | 'moderate' | 'challenging' | 'expert'>('moderate');
  const [maxVolunteers, setMaxVolunteers] = useState(20);
  const [parkingNotes, setParkingNotes] = useState('');
  const [weatherNotes, setWeatherNotes] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imagePreview, setImagePreview] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [requirements, setRequirements] = useState('');
  const [recurrence, setRecurrence] = useState<'none' | 'weekly' | 'biweekly' | 'monthly'>('none');
  const [recurrenceEnd, setRecurrenceEnd] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [error, setError] = useState('');

  const [providedItems, setProvidedItems] = useState<ProvidedItem[]>([]);
  const [recommendedItems, setRecommendedItems] = useState<RecommendedItem[]>([]);
  const [showProvidedCat, setShowProvidedCat] = useState(false);
  const [showRecommendedCat, setShowRecommendedCat] = useState(false);
  const [showParking, setShowParking] = useState(false);
  const [showWeather, setShowWeather] = useState(false);

  // Location picker state
  const [mapCenter, setMapCenter] = useState<[number, number]>([39.7392, -104.9903]); // Denver default
  const [markerPos, setMarkerPos] = useState<[number, number] | null>(null);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      dispatch(addToast({ message: 'Please sign in to create events', type: 'info' }));
      return;
    }
    if (user.userType !== 'organization') {
      navigate('/');
      dispatch(addToast({ message: 'Only organizations can create events', type: 'error' }));
      return;
    }
    // Randomize mock data on page load
    const mock = MOCK_DATASETS[Math.floor(Math.random() * MOCK_DATASETS.length)];
    const d = new Date();
    d.setDate(d.getDate() + mock.dateOffset);
    const dateStr = d.toISOString().split('T')[0];
    setTitle(mock.title);
    setDescription(mock.description);
    setTrailName(mock.trailName);
    setTrailSystem(mock.trailSystem);
    setLocationName(mock.locationName);
    setLat(mock.lat);
    setLng(mock.lng);
    setDate(dateStr);
    setStartTime(mock.startTime);
    setEndTime(mock.endTime);
    setDifficulty(mock.difficulty);
    setMaxVolunteers(mock.maxVolunteers);
    setParkingNotes(mock.parkingNotes);
    setWeatherNotes(mock.weatherNotes);
    setContactName(mock.contactName);
    setContactEmail(mock.contactEmail);
    setContactPhone(mock.contactPhone);
    setImageUrl(mock.imageUrl);
    setRequirements(mock.requirements);
    setProvidedItems(mock.providedItems as ProvidedItem[]);
    setRecommendedItems(mock.recommendedItems as RecommendedItem[]);
    const coords: [number, number] = [parseFloat(mock.lat), parseFloat(mock.lng)];
    setMarkerPos(coords);
    setMapCenter(coords);
  }, [user, navigate]);

  // Sync lat/lng inputs → map when user types
  // Sync map marker → lat/lng inputs
  const handleMapMove = useCallback((newLat: number, newLng: number) => {
    setLat(newLat.toFixed(6));
    setLng(newLng.toFixed(6));
    setMarkerPos([newLat, newLng]);
  }, []);

  const updateProvided = (name: string, field: keyof ProvidedItem, value: any) => {
    setProvidedItems((prev) =>
      prev.map((p) => (p.name === name ? { ...p, [field]: value } : p))
    );
  };

  const updateRecommended = (name: string, field: keyof RecommendedItem, value: any) => {
    setRecommendedItems((prev) =>
      prev.map((p) => (p.name === name ? { ...p, [field]: value } : p))
    );
  };

  const toggleProvided = (name: string) => {
    setProvidedItems((prev) =>
      prev.find((p) => p.name === name)
        ? prev.filter((p) => p.name !== name)
        : [...prev, { name, quantity: 'Plenty', description: '' }]
    );
  };

  const toggleRecommended = (name: string) => {
    setRecommendedItems((prev) =>
      prev.find((p) => p.name === name)
        ? prev.filter((p) => p.name !== name)
        : [...prev, { name, essential: false, notes: '' }]
    );
  };

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => {
      const url = reader.result as string;
      setImagePreview(url);
      setImageUrl(url);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => setDragOver(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!user) return;

    const coords: [number, number] = [
      parseFloat(lat) || 0,
      parseFloat(lng) || 0,
    ];

    try {
      await dispatch(
        createEvent({
          creatorId: user.id,
          title,
          description,
          trailName,
          trailSystem,
          coordinates: coords,
          locationName,
          date,
          startTime,
          endTime,
          difficulty,
          maxVolunteers,
          providedItems,
          recommendedItems,
          requirements: requirements.split('\n').filter(Boolean),
          parkingNotes,
          weatherNotes,
          contactName,
          contactEmail,
          contactPhone,
          imageUrl,
          isPrivate,
          recurrence,
          recurrenceEnd,
        })
      ).unwrap();
      navigate('/');
      dispatch(addToast({ message: 'Dig day created!', type: 'success' }));
    } catch (err: any) {
      setError(err.message || 'Failed to create event');
      dispatch(addToast({ message: err.message || 'Failed to create event', type: 'error' }));
    }
  };

  return (
    <div className="create-event-page">
      <div className="page-header">
        <div className="page-header-left">
          <button className="page-back-btn" onClick={() => navigate(-1)}><span className="nav-arrow">←</span> Back</button>
          <h1> Create a Dig Day</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="event-form">
        <div className="form-section">
          <div className="form-group">
            <label>Event Title *</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Upper Ridge Reroute Dig Day" required />
          </div>
          <div className="form-group">
            <label>Description *</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} placeholder="Describe the work to be done, the goals for the day, and what volunteers can expect." required />
          </div>
          <div className="form-row">
            <TrailAutocomplete
              trailName={trailName}
              trailSystem={trailSystem}
              onTrailNameChange={setTrailName}
              onTrailSystemChange={setTrailSystem}
            />
          </div>
          <div className="form-row">
            <div className="form-group flex-1">
              <label>Date *</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
            </div>
            <div className="form-group flex-1">
              <label>Start Time *</label>
              <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} required />
            </div>
            <div className="form-group flex-1">
              <label>End Time *</label>
              <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} required />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group flex-1">
              <label>Repeats</label>
              <select value={recurrence} onChange={(e) => setRecurrence(e.target.value as typeof recurrence)}>
                <option value="none">Does not repeat</option>
                <option value="weekly">Weekly</option>
                <option value="biweekly">Every 2 weeks</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
            {recurrence !== 'none' && (
              <div className="form-group flex-1">
                <label>Repeat until *</label>
                <input type="date" value={recurrenceEnd} onChange={(e) => setRecurrenceEnd(e.target.value)} />
              </div>
            )}
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Physical Difficulty</label>
              <select value={difficulty} onChange={(e) => setDifficulty(e.target.value as any)}>
                {DIFFICULTY_OPTIONS.map((d) => (
                  <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Max Volunteers</label>
              <input type="number" min={1} max={200} value={maxVolunteers} onChange={(e) => setMaxVolunteers(parseInt(e.target.value) || 1)} />
            </div>
          </div>
          <div className="form-group">
            <label>Requirements (one per line)</label>
            <textarea
              value={requirements}
              onChange={(e) => setRequirements(e.target.value)}
              rows={4}
              placeholder="Must be 18+&#10;Trail building experience preferred&#10;Closed-toe shoes required&#10;Must sign waiver"
            />
          </div>
          <div className="form-row three">
            <div className="form-group flex-1">
              <label>Contact Name *</label>
              <input type="text" value={contactName} onChange={(e) => setContactName(e.target.value)} placeholder="Your name" required />
            </div>
            <div className="form-group flex-1">
              <label>Contact Email *</label>
              <input type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} placeholder="you@example.com" required />
            </div>
            <div className="form-group flex-1">
              <label>Contact Phone</label>
              <input type="tel" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} placeholder="(555) 123-4567" />
            </div>
          </div>
          <div className="form-group">
            <label>Event Image</label>
            <div
              className={`image-drop-zone ${dragOver ? 'drag-over' : ''} ${imagePreview ? 'has-image' : ''}`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
            >
              {imagePreview ? (
                <img src={imagePreview} alt="" className="image-drop-preview" />
              ) : (
                <div className="image-drop-placeholder">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="4" ry="4" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <path d="M21 15l-5-5L5 21" />
                  </svg>
                  <span>Drop image or click to upload</span>
                </div>
              )}
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} style={{ display: 'none' }} />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h2>Location</h2>
          <div className="form-group">
            <label>Address / Trailhead</label>
            <input type="text" value={locationName} onChange={(e) => setLocationName(e.target.value)} placeholder="e.g. Phil's World Trailhead, 123 Main St" required />
          </div>

          {/* Location picker map */}
          <div className="location-picker-map">
            <MapContainer
              center={mapCenter}
              zoom={10}
              style={{ width: '100%', height: '100%' }}
              maxBounds={[[24, -125], [50, -66]]}
              maxBoundsViscosity={1}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <LocationMarker position={markerPos} onMove={handleMapMove} />
              <FlyToCenter center={markerPos} />
              <MapExtras />
            </MapContainer>
            {!markerPos && (
              <div className="map-click-hint">
                Click the map or enter coordinates
              </div>
            )}
            {markerPos && (
              <div className="map-coords-display">
                 {markerPos[0].toFixed(4)}, {markerPos[1].toFixed(4)}
              </div>
            )}
          </div>

          <div className="loc-toggle-row">
            <button type="button" className={`loc-toggle-btn ${showParking ? 'active' : ''}`} onClick={() => setShowParking(!showParking)}>
              {showParking ? '− Hide' : '+ Add'} Parking Notes
            </button>
            <button type="button" className={`loc-toggle-btn ${showWeather ? 'active' : ''}`} onClick={() => setShowWeather(!showWeather)}>
              {showWeather ? '− Hide' : '+ Add'} Weather Notes
            </button>
          </div>
          {showParking && (
            <div className="form-group">
              <label>Parking Notes</label>
              <textarea value={parkingNotes} onChange={(e) => setParkingNotes(e.target.value)} rows={2} placeholder="Where to park, carpool info, shuttle details…" />
            </div>
          )}
          {showWeather && (
            <div className="form-group">
              <label>Weather Notes</label>
              <textarea value={weatherNotes} onChange={(e) => setWeatherNotes(e.target.value)} rows={2} placeholder="What happens if it rains, heat safety, etc." />
            </div>
          )}
        </div>

        <div className="form-section">
          <h2>Provided:</h2>
          <p className="section-desc">Select what the dig day organizers provide</p>
          <button
            type="button"
            className="cat-modal-toggle"
            onClick={() => setShowProvidedCat(true)}
          >
            {providedItems.length > 0 ? `${providedItems.length} items selected` : 'Add items…'}
          </button>
          {showProvidedCat && (
            <div className="cat-modal-overlay" onClick={() => setShowProvidedCat(false)}>
              <div className="cat-modal" onClick={(e) => e.stopPropagation()}>
                <div className="cat-modal-header">
                  <span>Provided:</span>
                  <button type="button" className="cat-modal-close" onClick={() => setShowProvidedCat(false)}>×</button>
                </div>
                <div className="cat-checklist">
                  {PROVIDED_CATEGORIES.map((cat) => (
                    <div key={cat.label} className="cat-group">
                      <div className="cat-group-label">{cat.label}</div>
                      <div className="cat-group-items">
                        {cat.items.map((item) => {
                          const checked = !!providedItems.find((p) => p.name === item);
                          return (
                            <label key={item} className={`cat-item ${checked ? 'checked' : ''}`}>
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => toggleProvided(item)}
                              />
                              <span>{item}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
                {providedItems.length > 0 && (
                  <div className="cat-modal-footer">
                    <button type="button" className="cat-clear" onClick={() => setProvidedItems([])}>Clear all</button>
                  </div>
                )}
              </div>
            </div>
          )}
          {providedItems.map((pi) => (
            <div key={pi.name} className="provided-note">
              <input
                type="text"
                placeholder={`Notes for ${pi.name} (optional)`}
                value={pi.description}
                onChange={(e) => updateProvided(pi.name, 'description', e.target.value)}
              />
              <div className="tag-qty-selector">
                <button
                  type="button"
                  className={`tag-qty-btn ${pi.quantity === 'Few' ? 'active' : ''}`}
                  onClick={() => updateProvided(pi.name, 'quantity', 'Few')}
                >Few</button>
                <button
                  type="button"
                  className={`tag-qty-btn ${pi.quantity === 'Plenty' ? 'active' : ''}`}
                  onClick={() => updateProvided(pi.name, 'quantity', 'Plenty')}
                >Plenty</button>
              </div>
            </div>
          ))}
        </div>

        <div className="form-section">
          <h2>Bring:</h2>
          <p className="section-desc">What volunteers are expected or recommended to bring themselves</p>
          <button
            type="button"
            className="cat-modal-toggle"
            onClick={() => setShowRecommendedCat(true)}
          >
            {recommendedItems.length > 0 ? `${recommendedItems.length} items selected` : 'Add items…'}
          </button>
          {showRecommendedCat && (
            <div className="cat-modal-overlay" onClick={() => setShowRecommendedCat(false)}>
              <div className="cat-modal" onClick={(e) => e.stopPropagation()}>
                <div className="cat-modal-header">
                  <span>Bring:</span>
                  <button type="button" className="cat-modal-close" onClick={() => setShowRecommendedCat(false)}>×</button>
                </div>
                <div className="cat-checklist">
                  {RECOMMENDED_CATEGORIES.map((cat) => (
                    <div key={cat.label} className="cat-group">
                      <div className="cat-group-label">{cat.label}</div>
                      <div className="cat-group-items">
                        {cat.items.map((item) => {
                          const checked = !!recommendedItems.find((p) => p.name === item);
                          return (
                            <label key={item} className={`cat-item ${checked ? 'checked' : ''}`}>
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => toggleRecommended(item)}
                              />
                              <span>{item}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
                {recommendedItems.length > 0 && (
                  <div className="cat-modal-footer">
                    <button type="button" className="cat-clear" onClick={() => setRecommendedItems([])}>Clear all</button>
                  </div>
                )}
              </div>
            </div>
          )}
          {recommendedItems.map((ri) => (
            <div key={ri.name} className="provided-note">
              <input
                type="text"
                placeholder={`Notes for ${ri.name} (optional)`}
                value={ri.notes}
                onChange={(e) => updateRecommended(ri.name, 'notes', e.target.value)}
              />
              <label className="tag-checkbox">
                <input
                  type="checkbox"
                  checked={ri.essential}
                  onChange={(e) => updateRecommended(ri.name, 'essential', e.target.checked)}
                />
                Essential
              </label>
            </div>
          ))}
        </div>

        {error && <div className="form-error">{error}</div>}

        <div className="form-group">
          <label className="check-group">
            <input type="checkbox" checked={isPrivate} onChange={(e) => setIsPrivate(e.target.checked)} />
            Private dig day
          </label>
          <p className="muted" style={{ fontSize: '.8rem', margin: '4px 0 0 0' }}>Not shown on the map, but anyone with the link can still view it.</p>
        </div>

                <div className="form-actions">
          <button type="submit" className="btn btn-primary btn-lg">Post Dig Day</button>
          <button type="button" className="btn btn-ghost" onClick={() => navigate('/')}>Cancel</button>
        </div>
      </form>
    </div>
  );
};

export default CreateEventPage;