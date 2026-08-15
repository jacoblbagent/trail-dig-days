import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppSelector } from '../../app/hooks';

const TIME_LABELS: Record<string, string> = { all: 'All', upcoming: 'Upcoming', past: 'Past' };
const STATUS_LABELS: Record<string, string> = {
  all: 'All', planned: 'Planned', confirmed: 'Confirmed', cancelled: 'Cancelled', completed: 'Completed',
};

const MyEventsPage: React.FC = () => {
  const { user } = useAppSelector((s) => s.auth);
  const navigate = useNavigate();
  const events = useAppSelector((s) => s.events.items);

  const [tab, setTab] = useState<'created' | 'signedUp'>('created');
  const [timeFilter, setTimeFilter] = useState<'all' | 'upcoming' | 'past'>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  if (!user) {
    return (
      <div className="page-message">
        <p>Sign in to see your events.</p>
        <Link to="/auth" className="btn btn-primary" style={{ marginTop: '12px', display: 'inline-flex' }}>Sign In</Link>
      </div>
    );
  }

  const now = new Date();

  const myEvents = events.filter((e) => e.creatorId === user.id);
  const signedUp = events.filter((e) => e.registeredVolunteers.includes(user.id) && e.creatorId !== user.id);

  const applyFilters = (list: typeof myEvents) => {
    let filtered = list;

    // Time filter
    if (timeFilter === 'upcoming') {
      filtered = filtered.filter((e) => new Date(e.date) >= now);
    } else if (timeFilter === 'past') {
      filtered = filtered.filter((e) => new Date(e.date) < now);
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((e) => e.status === statusFilter);
    }

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      filtered = filtered.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          e.trailName.toLowerCase().includes(q) ||
          e.locationName.toLowerCase().includes(q) ||
          e.trailSystem.toLowerCase().includes(q)
      );
    }

    return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  const filteredMyEvents = useMemo(() => applyFilters(myEvents), [myEvents, timeFilter, statusFilter, searchQuery]);
  const filteredSignedUp = useMemo(() => applyFilters(signedUp), [signedUp, timeFilter, statusFilter, searchQuery]);

  const activeList = tab === 'created' ? filteredMyEvents : filteredSignedUp;
  const hasEvents = myEvents.length > 0 || signedUp.length > 0;

  const FilterChipGroup: React.FC<{
    label: string;
    options: Record<string, string>;
    value: string;
    onChange: (v: string) => void;
  }> = ({ label, options, value, onChange }) => (
    <div className="filter-chip-group">
      <span className="filter-group-label">{label}</span>
      <div className="filter-chips">
        {Object.entries(options).map(([key, lbl]) => (
          <button
            key={key}
            className={`filter-chip ${value === key ? 'active' : ''}`}
            onClick={() => onChange(key)}
          >
            {lbl}
          </button>
        ))}
      </div>
    </div>
  );

  const renderCard = (e: typeof myEvents[0]) => (
    <div
      key={e.id}
      className="event-list-card"
      onClick={() => navigate(`/events/${e.id}`)}
      style={{ cursor: 'pointer' }}
    >
      <div className="list-card-header">
        <h3>{e.title}</h3>
        <span className={`status-dot status-${e.status}`} title={e.status} />
      </div>
      <p className="list-card-trail">{e.trailName}{e.trailSystem ? ` · ${e.trailSystem}` : ''}</p>
      <div className="list-card-row">
        <span className="list-card-date">{new Date(e.date).toLocaleDateString()}</span>
        <span className="list-card-location">{e.locationName}</span>
        <span className="list-card-spots">{e.registeredVolunteers.length}/{e.maxVolunteers}</span>
      </div>
    </div>
  );

  return (
    <div className="create-event-page">
      <div className="page-header">
        <h1>My Events</h1>
        <p>Dig days you created or signed up for</p>
      </div>

      {/* Tab Toggle */}
      <div className="my-events-tabs">
        <button
          className={`tab-btn ${tab === 'created' ? 'active' : ''}`}
          onClick={() => setTab('created')}
        >
          Created by You{myEvents.length > 0 && <span className="tab-count">{myEvents.length}</span>}
        </button>
        <button
          className={`tab-btn ${tab === 'signedUp' ? 'active' : ''}`}
          onClick={() => setTab('signedUp')}
        >
          Signed Up{signedUp.length > 0 && <span className="tab-count">{signedUp.length}</span>}
        </button>
      </div>

      {/* Search */}
      <div className="my-events-search">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, color: 'var(--stone-400)' }}>
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="text"
          className="search-input"
          placeholder="Search by title, trail, or location..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {searchQuery && (
          <button className="search-clear" onClick={() => setSearchQuery('')} title="Clear search">
            ✕
          </button>
        )}
      </div>

      {/* Filter rows */}
      <div className="my-events-filters">
        <FilterChipGroup label="Time" options={TIME_LABELS} value={timeFilter} onChange={(v) => setTimeFilter(v as typeof timeFilter)} />
        <FilterChipGroup label="Status" options={STATUS_LABELS} value={statusFilter} onChange={setStatusFilter} />
      </div>

      {/* Results */}
      {!hasEvents ? (
        <p className="muted" style={{ padding: '40px 0' }}>No events yet. Create one to get started!</p>
      ) : activeList.length === 0 ? (
        <p className="muted" style={{ padding: '40px 0' }}>No events match your filters. Try adjusting them.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '16px' }}>
          {activeList.map(renderCard)}
        </div>
      )}
    </div>
  );
};

export default MyEventsPage;