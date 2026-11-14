// Test-branch-only: next event derived from validated schedule, never stale nextAt.
export function nextV3Event(data, now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Kyiv', year: 'numeric', month: '2-digit',
    day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
  }).formatToParts(now);
  const p = Object.fromEntries(parts.filter(x => x.type !== 'literal').map(x => [x.type,x.value]));
  const today = `${p.year}-${p.month}-${p.day}`;
  if (!data || data.date !== today || !Array.isArray(data.periods)) return null;
  const minute = Number(p.hour) * 60 + Number(p.minute);
  const parse = t => { if (!/^(?:[01]\\d|2[0-3]):[0-5]\\d$|^24:00$/.test(t)) throw Error('Invalid time'); const [h,m] = t.split(':').map(Number); return h*60+m; };
  const periods = data.periods.map(x => ({...x, a:parse(x.start), b:parse(x.end)}));
  if (periods.some((x,i) => x.a >= x.b || typeof x.on !== 'boolean' || (i && x.a !== periods[i-1].b))) return null;
  const current = periods.find(x => x.a <= minute && minute < x.b);
  if (!current) return null;
  const remaining = current.b - minute;
  return {status:current.on?'Світло є':'Світла немає',
    label:current.b === 1440?'До кінця добового графіка':current.on?'До планового вимкнення':'До планового увімкнення',
    minutes:remaining};
}
