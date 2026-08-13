import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import MapExtras from '../map/MapExtras';
import L from 'leaflet';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { updateEvent, deleteEvent } from './eventsSlice';
import { addToast } from '../toast/toastSlice';
import TrailAutocomplete from '../../components/TrailAutocomplete';
import type { ProvidedItem, RecommendedItem } from '../../types';

import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({ iconUrl, iconRetinaUrl, shadowUrl });

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

const LocationMarker: React.FC<{
  position: [number, number] | null;
  onMove: (lat: number, lng: number) => void;
}> = ({ position, onMove }) => {
  useMapEvents({
    click(e) { onMove(e.latlng.lat, e.latlng.lng); },
  });
  return position ? <Marker position={position} draggable eventHandlers={{
    dragend: (e) => { const p = e.target.getLatLng(); onMove(p.lat, p.lng); },
  }} /> : null;
};

const FlyToCenter: React.FC<{ center: [number, number] | null }> = ({ center }) => {
  const map = useMap();
  const prev = useRef<string | null>(null);
  useEffect(() => {
    if (center) {
      const key = `${center[0].toFixed(4)},${center[1].toFixed(4)}`;
      if (key !== prev.current) { map.flyTo(center, Math.max(map.getZoom(), 13), { duration: 0.5 }); prev.current = key; }
    }
  }, [center, map]);
  return null;
};

const EditEventPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user } = useAppSelector((s) => s.auth);
  const event = useAppSelector((s) => s.events.items.find((e) => e.id === id));

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

  const [mapCenter, setMapCenter] = useState<[number, number]>([39.7392, -104.9903]);
  const [markerPos, setMarkerPos] = useState<[number, number] | null>(null);

  useEffect(() => {
    if (!user) { navigate('/auth'); dispatch(addToast({ message: 'Please sign in to edit events', type: 'warning' })); return; }
    if (!event) return;
    if (event.creatorId !== user.id) { navigate('/'); return; }
    setTitle(event.title);
    setDescription(event.description);
    setTrailName(event.trailName);
    setTrailSystem(event.trailSystem);
    setLocationName(event.locationName);
    setLat(String(event.coordinates[0]));
    setLng(String(event.coordinates[1]));
    setDate(event.date);
    setStartTime(event.startTime);
    setEndTime(event.endTime);
    setDifficulty(event.difficulty);
    setMaxVolunteers(event.maxVolunteers);
    setParkingNotes(event.parkingNotes);
    setWeatherNotes(event.weatherNotes);
    setContactName(event.contactName);
    setContactEmail(event.contactEmail);
    setContactPhone(event.contactPhone);
    setImageUrl(event.imageUrl);
    if (event.imageUrl) setImagePreview(event.imageUrl);
    setRequirements(Array.isArray(event.requirements) ? event.requirements.join('\n') : '');
    setRecurrence(event.recurrence || 'none');
    setRecurrenceEnd(event.recurrenceEnd || '');
    setIsPrivate(event.isPrivate ?? false);
    setProvidedItems(event.providedItems);
    setRecommendedItems(event.recommendedItems);
    const coords: [number, number] = [event.coordinates[0], event.coordinates[1]];
    setMarkerPos(coords);
    setMapCenter(coords);
  }, [user, event, navigate]);

  if (!event) return <div className="loading">Event not found.</div>;
  if (user && event.creatorId !== user.id) return <div className="loading">You don't have permission to edit this event.</div>;

  const handleMapMove = useCallback((newLat: number, newLng: number) => {
    setLat(newLat.toFixed(6));
    setLng(newLng.toFixed(6));
    setMarkerPos([newLat, newLng]);
  }, []);

  const updateProvided = (name: string, field: keyof ProvidedItem, value: any) => {
    setProvidedItems((prev) => prev.map((p) => (p.name === name ? { ...p, [field]: value } : p)));
  };
  const removeProvided = (name: string) => {
    setProvidedItems((prev) => prev.filter((p) => p.name !== name));
  };
  const updateRecommended = (name: string, field: keyof RecommendedItem, value: any) => {
    setRecommendedItems((prev) => prev.map((p) => (p.name === name ? { ...p, [field]: value } : p)));
  };
  const removeRecommended = (name: string) => {
    setRecommendedItems((prev) => prev.filter((p) => p.name !== name));
  };
  const toggleProvided = (name: string) => {
    setProvidedItems((prev) =>
      prev.find((p) => p.name === name) ? prev.filter((p) => p.name !== name) : [...prev, { name, quantity: 'Plenty', description: '' }]
    );
  };
  const toggleRecommended = (name: string) => {
    setRecommendedItems((prev) =>
      prev.find((p) => p.name === name) ? prev.filter((p) => p.name !== name) : [...prev, { name, essential: false, notes: '' }]
    );
  };

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => { const url = reader.result as string; setImagePreview(url); setImageUrl(url); };
    reader.readAsDataURL(file);
  };
  const handleDrop = (e: React.DragEvent) => { e.preventDefault(); setDragOver(false); const file = e.dataTransfer.files[0]; if (file) handleFile(file); };
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setDragOver(true); };
  const handleDragLeave = () => setDragOver(false);
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => { const file = e.target.files?.[0]; if (file) handleFile(file); };

  const handleDelete = () => {
    if (window.confirm('Delete this dig day?')) {
      dispatch(deleteEvent(id!));
      dispatch(addToast({ message: 'Dig day deleted', type: 'info' }));
      navigate('/');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const coords: [number, number] = [parseFloat(lat) || 0, parseFloat(lng) || 0];
    try {
      await dispatch(updateEvent({
        id: id!,
        updates: {
          title, description, trailName, trailSystem, coordinates: coords, locationName,
          date, startTime, endTime, difficulty, maxVolunteers,
          providedItems, recommendedItems,
          requirements: requirements.split('\n').filter(Boolean),
          parkingNotes, weatherNotes, contactName, contactEmail, contactPhone,
          imageUrl, isPrivate, recurrence, recurrenceEnd,
        },
      })).unwrap();
      navigate(`/events/${id}`);
      dispatch(addToast({ message: 'Dig day updated!', type: 'success' }));
    } catch (err: any) {
      setError(err.message || 'Failed to update event');
      dispatch(addToast({ message: err.message || 'Failed to update event', type: 'warning' }));
    }
  };

  return (
    <div className="create-event-page">
      <div className="page-header">
                <div className="page-header-left">
                  <button className="page-back-btn" onClick={() => navigate(`/events/${id}`)}><span className="nav-arrow">←</span> Back</button>
                  <h1>Edit Dig Day</h1>
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
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} placeholder="Describe the work to be done..." required />
          </div>
          <div className="form-row">
            <TrailAutocomplete trailName={trailName} trailSystem={trailSystem} onTrailNameChange={setTrailName} onTrailSystemChange={setTrailSystem} />
          </div>
        </div>
        <div className="form-section">
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
          <div className="form-group">
            <label>Max Volunteers</label>
            <input type="number" min={1} max={200} value={maxVolunteers} onChange={(e) => setMaxVolunteers(parseInt(e.target.value) || 1)} />
          </div>
          <div className="form-group">
            <label>Requirements (one per line)</label>
            <textarea value={requirements} onChange={(e) => setRequirements(e.target.value)} rows={4} placeholder="Must be 18+&#10;Closed-toe shoes required" />
          </div>
        </div>
        <div className="form-section">
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
            <input type="text" value={locationName} onChange={(e) => setLocationName(e.target.value)} placeholder="e.g. Phil's World Trailhead" required />
          </div>
          <div className="location-picker-map">
            <MapContainer center={mapCenter} zoom={10} style={{ width: '100%', height: '100%' }} maxBounds={[[24, -125], [50, -66]]} maxBoundsViscosity={1}>
              <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <LocationMarker position={markerPos} onMove={handleMapMove} />
              <FlyToCenter center={markerPos} />
              <MapExtras />
            </MapContainer>
            {!markerPos && <div className="map-click-hint">Click the map or enter coordinates</div>}
            {markerPos && <div className="map-coords-display">{markerPos[0].toFixed(4)}, {markerPos[1].toFixed(4)}</div>}
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
              <textarea value={parkingNotes} onChange={(e) => setParkingNotes(e.target.value)} rows={2} placeholder="Where to park, carpool info..." />
            </div>
          )}
          {showWeather && (
            <div className="form-group">
              <label>Weather Notes</label>
              <textarea value={weatherNotes} onChange={(e) => setWeatherNotes(e.target.value)} rows={2} placeholder="What happens if it rains..." />
            </div>
          )}
        </div>

        <div className="form-section">
          <h2>Provided:</h2>
          <p className="section-desc">Select what the dig day organizers provide</p>
          <button type="button" className="cat-modal-toggle" onClick={() => setShowProvidedCat(true)}>
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
                              <input type="checkbox" checked={checked} onChange={() => toggleProvided(item)} />
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
              <input type="text" placeholder={`Notes for ${pi.name} (optional)`} value={pi.description} onChange={(e) => updateProvided(pi.name, 'description', e.target.value)} />
              <div className="tag-qty-selector">
                <button type="button" className={`tag-qty-btn ${pi.quantity === 'Few' ? 'active' : ''}`} onClick={() => updateProvided(pi.name, 'quantity', 'Few')}>Few</button>
                <button type="button" className={`tag-qty-btn ${pi.quantity === 'Plenty' ? 'active' : ''}`} onClick={() => updateProvided(pi.name, 'quantity', 'Plenty')}>Plenty</button>
              </div>
              <button type="button" className="provided-remove" onClick={() => removeProvided(pi.name)} title="Remove" aria-label="Remove">🗑</button>
            </div>
          ))}
        </div>

        <div className="form-section">
          <h2>Bring:</h2>
          <p className="section-desc">What volunteers are expected or recommended to bring themselves</p>
          <button type="button" className="cat-modal-toggle" onClick={() => setShowRecommendedCat(true)}>
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
                              <input type="checkbox" checked={checked} onChange={() => toggleRecommended(item)} />
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
              <input type="text" placeholder={`Notes for ${ri.name} (optional)`} value={ri.notes} onChange={(e) => updateRecommended(ri.name, 'notes', e.target.value)} />
              <label className="tag-checkbox">
                <input type="checkbox" checked={ri.essential} onChange={(e) => updateRecommended(ri.name, 'essential', e.target.checked)} />
                Essential
              </label>
              <button type="button" className="provided-remove" onClick={() => removeRecommended(ri.name)} title="Remove" aria-label="Remove">🗑</button>
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

        <div className="form-actions" style={{ justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button type="submit" className="btn btn-primary btn-lg">Save Changes</button>
            <button type="button" className="btn btn-ghost" onClick={() => navigate(`/events/${id}`)}>Cancel</button>
          </div>
          <button type="button" className="btn btn-danger" onClick={handleDelete}>Delete Event</button>
        </div>
      </form>
    </div>
  );
};

export default EditEventPage;