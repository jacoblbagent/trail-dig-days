import React, { useState, useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '../app/hooks';
import { setSearchQuery } from '../features/events/eventsSlice';

const NavSearch: React.FC = () => {
  const dispatch = useAppDispatch();
  const searchQuery = useAppSelector((s) => s.events.searchQuery);
  const [expanded, setExpanded] = useState(false);
  const [pendingSearch, setPendingSearch] = useState(searchQuery);

  useEffect(() => { setPendingSearch(searchQuery); }, [searchQuery]);

  const applySearch = () => {
    dispatch(setSearchQuery(pendingSearch));
    setExpanded(false);
  };

  const clearSearch = () => {
    setPendingSearch('');
    dispatch(setSearchQuery(''));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') applySearch();
    if (e.key === 'Escape') { clearSearch(); setExpanded(false); }
  };

  const handleOpen = () => {
    setExpanded(true);
    setPendingSearch(searchQuery);
  };

  const handleBlur = (e: React.FocusEvent) => {
    // Don't collapse if focus moves within the search wrap or if there's text
    if (!e.currentTarget.contains(e.relatedTarget as Node) && !pendingSearch.trim()) {
      setExpanded(false);
    }
  };

  return (
    <div className={`nav-search-wrap${expanded ? ' expanded' : ''}`} onBlur={handleBlur}>
      {expanded ? (
        <>
          <input
            className="nav-search-input"
            type="text"
            placeholder="Search events..."
            aria-label="Search events"
            value={pendingSearch}
            onChange={(e) => setPendingSearch(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
          />
          {pendingSearch && (
            <button className="nav-search-clear" onClick={clearSearch} aria-label="Clear search">✕</button>
          )}
          <button className="nav-search-btn" onClick={applySearch} disabled={!pendingSearch.trim()} aria-label="Search">Search</button>
        </>
      ) : (
        <button className="nav-search-icon-btn" onClick={handleOpen} aria-label="Open search">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </button>
      )}
    </div>
  );
};

export default NavSearch;