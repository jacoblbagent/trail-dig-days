import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { createEvent } from './eventsSlice';
import type { ProvidedItem, RecommendedItem } from '../../types';

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

// ProvidedItem and RecommendedItem helpers used inline

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

  useEffect(() => {
    if (!user) navigate('/auth');
  }, [user, navigate]);

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
        <h1>📋 Create a Dig Day</h1>
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
          <div className="form-row">
            <div className="form-group flex-1">
              <label>Latitude *</label>
              <input type="number" step="any" value={lat} onChange={(e) => setLat(e.target.value)} placeholder="37.7749" required />
            </div>
            <div className="form-group flex-1">
              <label>Longitude *</label>
              <input type="number" step="any" value={lng} onChange={(e) => setLng(e.target.value)} placeholder="-122.4194" required />
            </div>
          </div>
          <div className="form-group">
            <label>Parking Notes</label>
            <textarea value={parkingNotes} onChange={(e) => setParkingNotes(e.target.value)} rows={2} placeholder="Where to park, carpool info, shuttle details..." />
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
          <h2>🛠️ Provided by Crew</h2>
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
            pi.description !== '' ||
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
          <h2>🎒 Recommended to Bring</h2>
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
                    {active?.essential ? '⭐ ' : ''}{item}
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
          <button type="submit" className="btn btn-primary btn-lg">🚀 Post Dig Day</button>
          <button type="button" className="btn btn-ghost" onClick={() => navigate('/dig-days')}>Cancel</button>
        </div>
      </form>
    </div>
  );
};

export default CreateEventPage;