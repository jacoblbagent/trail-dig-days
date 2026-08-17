import React, { useState, useRef, useEffect } from 'react';
import { searchTrails, uniqueSystems } from '../app/trailData';

interface TrailAutocompleteProps {
  trailName: string;
  trailSystem: string;
  onTrailNameChange: (val: string) => void;
  onTrailSystemChange: (val: string) => void;
}

const TrailAutocomplete: React.FC<TrailAutocompleteProps> = ({
  trailName, trailSystem, onTrailNameChange, onTrailSystemChange,
}) => {
  const [results, setResults] = useState<ReturnType<typeof searchTrails>>([]);
  const [show, setShow] = useState(false);
  const [focused, setFocused] = useState<'name' | 'system' | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setShow(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleNameChange = (val: string) => {
    onTrailNameChange(val);
    if (val.length >= 2) {
      const r = searchTrails(val);
      setResults(r);
      setShow(r.length > 0);
    } else {
      setShow(false);
    }
  };

  const select = (name: string, system: string) => {
    onTrailNameChange(name);
    onTrailSystemChange(system);
    setShow(false);
  };

  const systems = uniqueSystems();

  return (
    <div className="trail-autocomplete" ref={ref}>
      <div className="form-row">
        <div className="floating-group" style={{ flex: 1 }}>
          <input
            type="text"
            value={trailName}
            onChange={(e) => handleNameChange(e.target.value)}
            onFocus={() => setFocused('name')}
            placeholder=" "
            required
          />
          <label>Trail Name *</label>
        </div>
        <div className="floating-group" style={{ flex: 1 }}>
          <input
            type="text"
            value={trailSystem}
            onChange={(e) => onTrailSystemChange(e.target.value)}
            onFocus={() => setFocused('system')}
            placeholder=" "
            list="system-list"
          />
          <label>Trail System</label>
          <datalist id="system-list">
            {systems.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
        </div>
      </div>

      {show && focused === 'name' && results.length > 0 && (
        <ul className="trail-autocomplete-results">
          {results.map((t) => (
            <li key={`${t.name}-${t.system}`} onClick={() => select(t.name, t.system)}>
              <span className="trail-result-name">{t.name}</span>
              <span className="trail-result-system">{t.system}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default TrailAutocomplete;