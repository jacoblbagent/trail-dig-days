import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { createEvent } from './eventsSlice';
import type { ProvidedItem, RecommendedItem } from '../../types';

// Fix Leaflet icon issue
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({ iconUrl, iconRetinaUrl, shadowUrl });

const DIFFICULTY_OPTIONS = ['easy', 'moderate', 'challenging', 'expert'] as const;

const PROVIDED_SUGGESTIONS = [
  'Water', 'Shovels', 'Spades', 'McLeods', 'Pick Mattocks',
  'Rakes', 'Hoes', 'Wheelbarrows', 'Gloves', 'Hard Hats',
  'Safety Glasses', 'Ear Plugs', 'First Aid Kit', 'Suncreen',
  'Bug Spray', 'Snacks', 'Lunch', 'Coffee',
];

const RECOMMENDED_SUGGESTIONS = [
  'Sturdy Work Boots', 'Long Pants', 'Long Sleeve Shirt',
  'Work Gloves', 'Safety Glasses', 'Hard Hat', 'Water Bottle',
  'Snacks', 'Sun Hat', 'Rain Jacket', 'Knee Pads',
  'Bug Spray', 'Sunscreen', 'Change of Clothes',
  'Towel', 'Camera', 'Notepad',
];

// Geocoding result from Nominatim
interface GeoResult {
  displayName: string;
  lat: number;
  lng: number;
}

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

/** Queries OpenStreetMap Overpass API for named trails near coordinates */
const TrailSearch: React.FC<{
  coords: [number, number] | null;
  onSelect: (trailName: string, trailSystem: string) => void;
}> = ({ coords, onSelect }) => {
  const [results, setResults] = useState<{ name: string; system: string; id: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [show, setShow] = useState(false);
  const mounted = useRef(true);

  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);

  const search = async () => {
    if (!coords) return;
    setLoading(true);
    setError('');
    setResults([]);
    setShow(true);
    try {
      const query = `
        [out:json][timeout:10];
        (
          way(around:1000,${coords[0]},${coords[1]})[highway~"path|track|footway"][name];
          way(around:1000,${coords[0]},${coords[1]})[highway=cycleway][name];
          relation(around:1000,${coords[0]},${coords[1]})[route~"hiking|mtb|bicycle"][name];
        );
        out center qt 30;
      `;
      const res = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        body: query,
        headers: { 'Content-Type': 'text/plain' },
      });
      if (!res.ok) throw new Error(`Overpass returned ${res.status}`);
      const data = await res.json();
      if (!mounted.current) return;

      const seen = new Set<string>();
      const parsed: { name: string; system: string; id: string }[] = [];

      for (const el of data.elements || []) {
        const name = el.tags?.name;
        if (!name || seen.has(name)) continue;
        seen.add(name);
        parsed.push({
          name,
          system: el.tags?.operator || el.tags?.network || el.tags?.area || '',
          id: `${el.type}/${el.id}`,
        });
      }
      setResults(parsed.slice(0, 10));
      if (parsed.length === 0) setError('No named trails found near this location.');
    } catch (err: any) {
      if (mounted.current) setError(err.message || 'Search failed');
    } finally {
      if (mounted.current) setLoading(false);
    }
  };

  return (
    <div className="trail-search">
      <button
        type="button"
        className="btn btn-sm btn-ghost"
        onClick={search}
        disabled={!coords || loading}
      >
        {loading ? 'Searching…' : 'Find Trails Here'}
      </button>
      {error && <p className="trail-search-error">{error}</p>}
      {results.length > 0 && show && (
        <ul className="trail-results">
          {results.map((t) => (
            <li key={t.id} onClick={() => { onSelect(t.name, t.system); setShow(false); }}>
              <span className="trail-name">{t.name}</span>
              {t.system && <span className="trail-system">{t.system}</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
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
  const [requirements, setRequirements] = useState('');
  const [error, setError] = useState('');

  const [providedItems, setProvidedItems] = useState<ProvidedItem[]>([]);
  const [recommendedItems, setRecommendedItems] = useState<RecommendedItem[]>([]);

  // Location picker state
  const [mapCenter, setMapCenter] = useState<[number, number]>([39.7392, -104.9903]); // Denver default
  const [markerPos, setMarkerPos] = useState<[number, number] | null>(null);
  const [geoQuery, setGeoQuery] = useState('');
  const [geoResults, setGeoResults] = useState<GeoResult[]>([]);
  const [geoLoading, setGeoLoading] = useState(false);
  const geoTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!user) navigate('/auth');
  }, [user, navigate]);

  // Sync lat/lng inputs → map when user types
  const handleLatChange = (val: string) => {
    setLat(val);
    const n = parseFloat(val);
    if (!isNaN(n)) {
      setMarkerPos([n, parseFloat(lng) || mapCenter[1]]);
      setMapCenter([n, parseFloat(lng) || mapCenter[1]]);
    }
  };
  const handleLngChange = (val: string) => {
    setLng(val);
    const n = parseFloat(val);
    if (!isNaN(n)) {
      setMarkerPos([parseFloat(lat) || mapCenter[0], n]);
      setMapCenter([parseFloat(lat) || mapCenter[0], n]);
    }
  };

  // Sync map marker → lat/lng inputs
  const handleMapMove = useCallback((newLat: number, newLng: number) => {
    setLat(newLat.toFixed(6));
    setLng(newLng.toFixed(6));
    setMarkerPos([newLat, newLng]);
  }, []);

  // Geocoding search with debounce
  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) { setGeoResults([]); return; }
    setGeoLoading(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=5`,
        { headers: { 'Accept-Language': 'en' } }
      );
      const data = await res.json();
      setGeoResults(
        data.map((r: any) => ({
          displayName: r.display_name,
          lat: parseFloat(r.lat),
          lng: parseFloat(r.lon),
        }))
      );
    } catch {
      setGeoResults([]);
    } finally {
      setGeoLoading(false);
    }
  }, []);

  const handleGeoQueryChange = (val: string) => {
    setGeoQuery(val);
    if (geoTimeout.current) clearTimeout(geoTimeout.current);
    geoTimeout.current = setTimeout(() => doSearch(val), 400);
  };

  const selectGeoResult = (r: GeoResult) => {
    setLocationName(r.displayName.split(',')[0].trim());
    setLat(r.lat.toFixed(6));
    setLng(r.lng.toFixed(6));
    setMarkerPos([r.lat, r.lng]);
    setMapCenter([r.lat, r.lng]);
    setGeoResults([]);
    setGeoQuery(r.displayName.split(',')[0].trim());
  };

  const toggleProvided = (name: string) => {
    setProvidedItems((prev) => {
      if (prev.find((p) => p.name === name)) {
        return prev.filter((p) => p.name !== name);
      }
      return [...prev, { name, quantity: 5, description: '' }];
    });
  };

  const updateProvided = (name: string, field: keyof ProvidedItem, value: any) => {
    setProvidedItems((prev) =>
      prev.map((p) => (p.name === name ? { ...p, [field]: value } : p))
    );
  };

  const toggleRecommended = (name: string) => {
    setRecommendedItems((prev) => {
      if (prev.find((p) => p.name === name)) {
        return prev.filter((p) => p.name !== name);
      }
      return [...prev, { name, essential: false, notes: '' }];
    });
  };

  const updateRecommended = (name: string, field: keyof RecommendedItem, value: any) => {
    setRecommendedItems((prev) =>
      prev.map((p) => (p.name === name ? { ...p, [field]: value } : p))
    );
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
        })
      ).unwrap();
      navigate('/dig-days');
    } catch (err: any) {
      setError(err.message || 'Failed to create event');
    }
  };

  return (
    <div className="create-event-page">
      <div className="page-header">
        <h1> Create a Dig Day</h1>
        <p>Organize a trail building day and rally the crew</p>
      </div>

      <form onSubmit={handleSubmit} className="event-form">
        <div className="form-section">
          <h2>Event Details</h2>
          <div className="form-group">
            <label>Event Title *</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Upper Ridge Reroute Dig Day" required />
          </div>
          <div className="form-group">
            <label>Description *</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} placeholder="Describe the work to be done, the goals for the day, and what volunteers can expect." required />
          </div>
          <div className="form-row">
            <div className="form-group flex-1">
              <label>Trail Name *</label>
              <input type="text" value={trailName} onChange={(e) => setTrailName(e.target.value)} placeholder="e.g. Upper Ridge Trail" required />
            </div>
            <div className="form-group flex-1">
              <label>Trail System</label>
              <input type="text" value={trailSystem} onChange={(e) => setTrailSystem(e.target.value)} placeholder="e.g. Phil's World" />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h2>Date & Time</h2>
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
        </div>

        <div className="form-section">
          <h2>Location</h2>
          <div className="form-group">
            <label>Location Name *</label>
            <input type="text" value={locationName} onChange={(e) => setLocationName(e.target.value)} placeholder="e.g. Phil's World Trailhead Parking Lot" required />
          </div>

          {/* Search / Geocoder */}
          <div className="geo-search">
            <label>Search for a place on the map</label>
            <div className="geo-search-input-wrap">
              <input
                type="text"
                value={geoQuery}
                onChange={(e) => handleGeoQueryChange(e.target.value)}
                placeholder="Search trailhead, town, or address…"
              />
              {geoLoading && <span className="geo-spinner" />}
            </div>
            {geoResults.length > 0 && (
              <ul className="geo-results">
                {geoResults.map((r, i) => (
                  <li key={i} onClick={() => selectGeoResult(r)}>
                    <span className="geo-result-name">{r.displayName.split(',')[0]}</span>
                    <span className="geo-result-detail">{r.displayName.split(',').slice(1).join(',').trim()}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Coord inputs */}
          <div className="form-row">
            <div className="form-group flex-1">
              <label>Latitude *</label>
              <input type="number" step="any" value={lat} onChange={(e) => handleLatChange(e.target.value)} placeholder="37.7749" required />
            </div>
            <div className="form-group flex-1">
              <label>Longitude *</label>
              <input type="number" step="any" value={lng} onChange={(e) => handleLngChange(e.target.value)} placeholder="-122.4194" required />
            </div>
          </div>

          {/* Location picker map */}
          <div className="location-picker-map">
            <MapContainer
              center={mapCenter}
              zoom={10}
              style={{ width: '100%', height: '100%' }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <LocationMarker position={markerPos} onMove={handleMapMove} />
              <FlyToCenter center={markerPos} />
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

          {/* Search nearby trails via Overpass API */}
          <TrailSearch
            coords={markerPos}
            onSelect={(name, system) => { setTrailName(name); if (system) setTrailSystem(system); }}
          />

          <div className="form-group">
            <label>Parking Notes</label>
            <textarea value={parkingNotes} onChange={(e) => setParkingNotes(e.target.value)} rows={2} placeholder="Where to park, carpool info, shuttle details…" />
          </div>
          <div className="form-group">
            <label>Weather Notes</label>
            <textarea value={weatherNotes} onChange={(e) => setWeatherNotes(e.target.value)} rows={2} placeholder="What happens if it rains, heat safety, etc." />
          </div>
        </div>

        <div className="form-section">
          <h2>Difficulty & Capacity</h2>
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
        </div>

        <div className="form-section">
          <h2> Provided by Crew</h2>
          <p className="section-desc">Select what the dig day organizers provide — tap to toggle</p>
          <div className="tag-grid">
            {PROVIDED_SUGGESTIONS.map((item) => {
              const active = providedItems.find((p) => p.name === item);
              return (
                <div key={item} className={`tag-wrapper ${active ? 'active' : ''}`}>
                  <button
                    type="button"
                    className={`tag ${active ? 'active' : ''}`}
                    onClick={() => toggleProvided(item)}
                  >
                    {item}
                  </button>
                  {active && (
                    <input
                      type="number"
                      min={1}
                      value={active.quantity}
                      onChange={(e) => updateProvided(item, 'quantity', parseInt(e.target.value) || 1)}
                      className="tag-qty"
                      title="Quantity available"
                    />
                  )}
                </div>
              );
            })}
          </div>
          {providedItems.map((pi) => (
            <div key={pi.name} className="provided-note">
              <input
                type="text"
                placeholder={`Notes for ${pi.name} (optional)`}
                value={pi.description}
                onChange={(e) => updateProvided(pi.name, 'description', e.target.value)}
              />
            </div>
          ))}
        </div>

        <div className="form-section">
          <h2> Recommended to Bring</h2>
          <p className="section-desc">What volunteers are expected or recommended to bring themselves</p>
          <div className="tag-grid">
            {RECOMMENDED_SUGGESTIONS.map((item) => {
              const active = recommendedItems.find((p) => p.name === item);
              return (
                <div key={item} className={`tag-wrapper ${active ? 'active' : ''}`}>
                  <button
                    type="button"
                    className={`tag ${active ? 'active' : ''}`}
                    onClick={() => toggleRecommended(item)}
                  >
                    {active?.essential ? ' ' : ''}{item}
                  </button>
                  {active && (
                    <label className="tag-checkbox">
                      <input
                        type="checkbox"
                        checked={active.essential}
                        onChange={(e) => updateRecommended(item, 'essential', e.target.checked)}
                      />
                      Essential
                    </label>
                  )}
                </div>
              );
            })}
          </div>
          {recommendedItems.map((ri) => (
            <div key={ri.name} className="provided-note">
              <input
                type="text"
                placeholder={`Notes for ${ri.name} (optional)`}
                value={ri.notes}
                onChange={(e) => updateRecommended(ri.name, 'notes', e.target.value)}
              />
            </div>
          ))}
        </div>

        <div className="form-section">
          <h2>Requirements</h2>
          <div className="form-group">
            <label>Requirements (one per line)</label>
            <textarea
              value={requirements}
              onChange={(e) => setRequirements(e.target.value)}
              rows={4}
              placeholder="Must be 18+&#10;Trail building experience preferred&#10;Closed-toe shoes required&#10;Must sign waiver"
            />
          </div>
        </div>

        <div className="form-section">
          <h2>Contact Info</h2>
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
        </div>

        <div className="form-section">
          <h2>Media</h2>
          <div className="form-group">
            <label>Event Image URL</label>
            <input type="url" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://example.com/trail-photo.jpg" />
          </div>
        </div>

        {error && <div className="form-error">{error}</div>}

        <div className="form-actions">
          <button type="submit" className="btn btn-primary btn-lg">Post Dig Day</button>
          <button type="button" className="btn btn-ghost" onClick={() => navigate('/dig-days')}>Cancel</button>
        </div>
      </form>
    </div>
  );
};

export default CreateEventPage;