// Adapter for the currently emitted svitlopuls-live.json schema.
// Pure function; no change to production scheduler or approved artwork.
export function normalizeV3LiveData(raw) {
  if (raw && Array.isArray(raw.periods)) return raw;
  if (!raw || !Array.isArray(raw.power?.periods)) {
    throw new Error('JSON не містить періодів');
  }
  const periods = raw.power.periods.map((p) => {
    const start = p.begin;
    const end = p.end;
    const on = p.power;
    const time = /^([01]\d|2[0-3]):[0-5]\d$/;
    if (!time.test(start) || !(time.test(end) || end === '24:00') || typeof on !== 'boolean') {
      throw new Error('Некоректний період');
    }
    return {start, end, on};
  });
  return {
    date: raw.scheduleDate ?? '',
    periods,
    nextAt: raw.power.nextAt ?? '',
    updated: raw.updatedAt ?? '',
    weather: raw.weather ?? {},
    garden: raw.garden ?? {},
    moon: raw.moon ?? {},
    astro: raw.astro ?? {},
  };
}
