/**
 * Input sanitization utilities.
 * Applied at the persistence boundary (thunks/reducers) so all user data is
 * sanitized before it enters localStorage, regardless of which component
 * submitted it. React's default escaping handles XSS on render; this is
 * defense-in-depth for storage and URL contexts.
 */

const MAX_TEXT = 2000;
const MAX_MULTILINE = 10000;
const MAX_URL = 1000;

/** Strip control characters (except tab, newline) and trim whitespace. */
export const stripControl = (s: string): string =>
  s.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '').trim();

/** Escape HTML entities so stored content can't be misinterpreted as markup. */
export const escapeHtml = (s: string): string =>
  s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');

/** Sanitize a short text field (trim, strip control, cap length, escape HTML). */
export const sanitizeText = (s: string): string =>
  escapeHtml(stripControl(s)).slice(0, MAX_TEXT);

/** Sanitize a multiline text field (allows newlines). */
export const sanitizeMultiline = (s: string): string => {
  const cleaned = s
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .trim();
  return escapeHtml(cleaned).slice(0, MAX_MULTILINE);
};

/** Sanitize a URL — strip dangerous schemes, cap length. */
export const sanitizeUrl = (url: string): string => {
  let s = url.trim().slice(0, MAX_URL);
  // Lowercase the scheme for comparison
  const lower = s.toLowerCase();
  // Only allow http, https, mailto — block javascript:, data:, etc.
  if (
    !lower.startsWith('http://') &&
    !lower.startsWith('https://') &&
    !lower.startsWith('mailto:') &&
    !lower.startsWith('/')
  ) {
    // If it has a scheme but not an allowed one, return empty
    if (lower.includes(':')) return '';
    // No scheme at all — treat as relative or plain text, safe
  }
  // Escape HTML entities in URLs too
  return escapeHtml(s);
};

/** Sanitize all string fields in an event payload. */
export const sanitizeEvent = <T>(payload: T): T => {
  const out = { ...payload } as Record<string, unknown>;
  for (const key of Object.keys(out)) {
    const val = (out as any)[key];
    if (typeof val === 'string') {
      if (key === 'description' || key === 'parkingNotes' || key === 'weatherNotes') {
        (out as any)[key] = sanitizeMultiline(val);
      } else if (key === 'imageUrl' || key === 'contactEmail' || key === 'contactPhone') {
        (out as any)[key] = sanitizeText(val);
      } else {
        (out as any)[key] = sanitizeText(val);
      }
    }
    // Handle string arrays (requirements, providedItems names, etc.)
    if (Array.isArray(val)) {
      (out as any)[key] = val.map((item: unknown) => {
        if (typeof item === 'string') return sanitizeText(item);
        if (item && typeof item === 'object') {
          return sanitizeObject(item as Record<string, unknown>);
        }
        return item;
      });
    }
  }
  return out as T;
};

/** Recursively sanitize string fields in an arbitrary object. */
const sanitizeObject = (obj: Record<string, unknown>): Record<string, unknown> => {
  const out: Record<string, unknown> = {};
  for (const key of Object.keys(obj)) {
    const val = obj[key];
    if (typeof val === 'string') {
      out[key] = sanitizeText(val);
    } else if (Array.isArray(val)) {
      out[key] = val.map((item: unknown) => {
        if (typeof item === 'string') return sanitizeText(item);
        if (item && typeof item === 'object') return sanitizeObject(item as Record<string, unknown>);
        return item;
      });
    } else if (val && typeof val === 'object') {
      out[key] = sanitizeObject(val as Record<string, unknown>);
    } else {
      out[key] = val;
    }
  }
  return out;
};

/** Sanitize a profile object — URLs get special handling. */
export const sanitizeProfile = <T>(profile: T): T => {
  const out = { ...profile } as Record<string, unknown>;
  for (const key of Object.keys(out)) {
    const val = (out as any)[key];
    if (typeof val === 'string') {
      if (key.toLowerCase().includes('url') || key.toLowerCase().includes('link')) {
        (out as any)[key] = sanitizeUrl(val);
      } else if (key === 'bio' || key === 'description') {
        (out as any)[key] = sanitizeMultiline(val);
      } else {
        (out as any)[key] = sanitizeText(val);
      }
    }
    if (val && typeof val === 'object' && !Array.isArray(val)) {
      (out as any)[key] = sanitizeObject(val as Record<string, unknown>);
    }
    if (Array.isArray(val)) {
      (out as any)[key] = val.map((item: unknown) => {
        if (typeof item === 'string') return sanitizeText(item);
        if (item && typeof item === 'object') return sanitizeObject(item as Record<string, unknown>);
        return item;
      });
    }
  }
  return out as T;
};