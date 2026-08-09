import type { DigEvent } from '../types';

export function expandRecurring(events: DigEvent[]): DigEvent[] {
  const expanded: DigEvent[] = [];

  for (const event of events) {
    if (!event.recurrence || event.recurrence === 'none' || !event.recurrenceEnd) {
      expanded.push(event);
      continue;
    }

    expanded.push(event); // keep the template itself

    const start = new Date(event.date);
    const end = new Date(event.recurrenceEnd);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) continue;

    const instances: DigEvent[] = [];
    const current = new Date(start);

    while (current <= end) {
      current.setDate(current.getDate() + 1); // step by day

      if (current > end) break;

      const matches = (
        event.recurrence === 'weekly' ? current.getDay() === start.getDay() :
        event.recurrence === 'biweekly' ? isBiweeklyMatch(start, current) :
        event.recurrence === 'monthly' ? current.getDate() === start.getDate() :
        false
      );

      if (!matches) continue;

      const instanceDate = current.toISOString().slice(0, 10);
      const instanceId = `${event.id}_${instanceDate}`;
      instances.push({
        ...event,
        id: instanceId,
        date: instanceDate,
        recurrenceGroupId: event.recurrenceGroupId,
        recurrence: 'none',
        recurrenceEnd: '',
      });
    }

    expanded.push(...instances);
  }

  return expanded;
}

/**
 * Returns one event per recurring series: the closest-to-now instance.
 * Non-recurring events pass through unchanged. For recurring events,
 * the template's `date` is kept (it is the first/next occurrence),
 * and the returned event preserves the `recurrence` field so the UI
 * can display a "Recurring" badge.
 */
export function collapseRecurring(events: DigEvent[]): DigEvent[] {
  const result: DigEvent[] = [];
  const seen = new Set<string>();

  for (const event of events) {
    const key = event.recurrenceGroupId || event.id;
    if (seen.has(key)) continue;
    seen.add(key);

    if (event.recurrence && event.recurrence !== 'none' && event.recurrenceEnd) {
      // Expand to find all instances, then pick the closest-to-now
      const now = new Date();
      const instances = expandRecurring([event]);
      let closest = instances[0];
      let closestDiff = Infinity;
      for (const inst of instances) {
        const diff = Math.abs(new Date(inst.date).getTime() - now.getTime());
        if (diff < closestDiff) {
          closest = inst;
          closestDiff = diff;
        }
      }
      // Restore the recurrence field so the badge shows
      closest = { ...closest, recurrence: event.recurrence, recurrenceEnd: event.recurrenceEnd || '' };
      result.push(closest);
    } else {
      result.push(event);
    }
  }

  return result;
}

function isBiweeklyMatch(start: Date, current: Date): boolean {
  const diffMs = current.getTime() - start.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
  return diffDays % 14 === 0;
}