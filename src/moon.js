// Approximate lunar calendar for Europe/Kyiv, without third-party API calls.
// New-moon epochs: Jean Meeus, Astronomical Algorithms, chapter 49.
// The "lunar day" below counts elapsed 24h intervals since the astronomical
// new moon at 12:00 Kyiv local time; moonrise-based calendars differ.
const RAD = Math.PI/180
const sin = x => Math.sin(x*RAD)
const cos = x => Math.cos(x*RAD)
const JULIAN_UNIX = 2440587.5
const jd = time => time.getTime()/86400000+JULIAN_UNIX
const utc = days => new Date((days-JULIAN_UNIX)*86400000)
const norm = deg => ((deg%360)+360)%360

// New Moon true phase, JDE (Terrestrial Time). Error is a few minutes,
// negligible for a one-day lunar calendar. Periodic correction terms taken
// from standard Meeus algorithm, not from a hand-maintained phase table.
export function newMoonJde(k) {
  const t=k/1236.85, t2=t*t, t3=t2*t, t4=t3*t
  const E=1-.002516*t-.0000074*t2
  const M=2.5534+29.10535670*k-.0000014*t2-.00000011*t3
  const m=201.5643+385.81693528*k+.0107582*t2+.00001238*t3-.000000058*t4
  const f=160.7108+390.67050284*k-.0016118*t2-.00000227*t3+.000000011*t4
  const o=124.7746-1.56375588*k+.0020672*t2+.00000215*t3
  let correction=-.40720*sin(m)+.17241*E*sin(M)+.01608*sin(2*m)+.01039*sin(2*f)
    +.00739*E*sin(m-M)-.00514*E*sin(m+M)+.00208*E*E*sin(2*M)
    -.00111*sin(m-2*f)-.00057*sin(m+2*f)+.00056*E*sin(2*m+M)
    -.00042*sin(3*m)+.00042*E*sin(M+2*f)+.00038*E*sin(M-2*f)
    -.00024*E*sin(2*m-M)-.00017*sin(o)-.00007*sin(m+2*M)
    +.00004*sin(2*m-2*f)+.00004*sin(3*M)+.00003*sin(m+M-2*f)
    +.00003*sin(2*m+2*f)-.00003*sin(m+M+2*f)
    +.00003*sin(m-M+2*f)-.00002*sin(m-M-2*f)
    -.00002*sin(3*m+M)+.00002*sin(4*m)
  const a=[299.77+.107408*k-.009173*t2,251.88+.016321*k,
    251.83+26.651886*k,349.42+36.412478*k,
    84.66+18.206239*k,141.74+53.303771*k,207.14+2.453732*k,
    154.84+7.306860*k,34.52+27.261239*k,207.19+.121824*k,
    291.34+1.844379*k,161.72+24.198154*k,239.56+25.513099*k,
    331.55+3.592518*k]
  const v=[.000325,.000165,.000164,.000126,.000110,.000062,.000060,
    .000056,.000047,.000042,.000040,.000037,.000035,.000023]
  correction+=a.reduce((s,deg,i)=>s+v[i]*sin(deg),0)
  return 2451550.09766+29.530588861*k+.00015437*t2-.00000015*t3+
    .00000000073*t4+correction
}

export function nearestPastNewMoon(time) {
  if (!(time instanceof Date)||!Number.isFinite(time.getTime())) {
    throw new Error("A valid astronomical date is required")
  }
  const day=jd(time)
  let k=Math.floor((day-2451550.09766)/29.530588861)
  while(newMoonJde(k)>day)k--
  while(newMoonJde(k+1)<=day)k++
  return { k, jd:newMoonJde(k), nextJd:newMoonJde(k+1) }
}

// Approximate Moon and Sun geometry, including lunar longitude and
// illuminated fraction. True orbital motion is not uniform in time.
function moonGeometry(time) {
  const d=jd(time)-2451545.0
  const L=norm(218.316+13.176396*d)
  const M=norm(134.963+13.064993*d)
  const F=norm(93.272+13.229350*d)
  const lon=norm(L+6.289*sin(M))
  const lat=5.128*sin(F)
  const dist=385001-20905*cos(M)
  const sunM=norm(357.5291+.98560028*d)
  const sunC=1.9148*sin(sunM)+.0200*sin(2*sunM)+.0003*sin(3*sunM)
  const sunLon=norm(sunM+sunC+102.9372+180)
  const sl=sunLon*RAD, ml=lon*RAD, b=lat*RAD, ob=23.4397*RAD
  const sunRa=Math.atan2(Math.sin(sl)*Math.cos(ob),Math.cos(sl))
  const sunDec=Math.asin(Math.sin(sl)*Math.sin(ob))
  const moonRa=Math.atan2(Math.sin(ml)*Math.cos(ob)-Math.tan(b)*Math.sin(ob),Math.cos(ml))
  const moonDec=Math.asin(Math.sin(b)*Math.cos(ob)+Math.cos(b)*Math.sin(ob)*Math.sin(ml))
  const dot=Math.sin(sunDec)*Math.sin(moonDec)+
    Math.cos(sunDec)*Math.cos(moonDec)*Math.cos(sunRa-moonRa)
  const phi=Math.acos(Math.max(-1,Math.min(1,dot)))
  const inc=Math.atan2(149598000*Math.sin(phi),dist-149598000*Math.cos(phi))
  return {longitude:lon,illumination:Math.max(0,Math.min(100,Math.round(50*(1+Math.cos(inc)))))}
}

function phaseLabel(fraction) {
  if (fraction < .035) return "Молодик"
  if (fraction < .215) return "Зростаючий серп"
  if (fraction < .285) return "Перша чверть"
  if (fraction < .465) return "Зростаючий Місяць"
  if (fraction < .535) return "Повня"
  if (fraction < .715) return "Спадний Місяць"
  if (fraction < .785) return "Остання чверть"
  return "Спадний серп"
}

const SIGNS=["Овен","Телець","Близнюки","Рак","Лев","Діва",
  "Терези","Скорпіон","Стрілець","Козоріг","Водолій","Риби"]

export function lunarForDate(date, sampleHour=12) {
  if(!/^\d{4}-\d{2}-\d{2}$/.test(date))throw Error("Expected ISO day")
  // Kyiv offset is UTC+2 in winter, UTC+3 in summer. Use Intl to find
  // the correct offset on each day, not a hardcoded season.
  const utcMidday=new Date(date+"T12:00:00Z")
  if(!Number.isFinite(utcMidday.getTime()))throw Error("Invalid ISO day")
  const parts=new Intl.DateTimeFormat("en-GB",{timeZone:"Europe/Kyiv",hour:"2-digit",
    hourCycle:"h23"}).format(utcMidday)
  const offset=Number(parts)-12
  const sample=new Date(Date.parse(date+"T00:00:00Z")+(sampleHour-offset)*3600000)
  const {jd:newJd,nextJd}=nearestPastNewMoon(sample)
  const age=jd(sample)-newJd
  const fraction=age/(nextJd-newJd)
  const geometry=moonGeometry(sample)
  return {
    date, sampleHour,
    lunarDay:Math.min(30,Math.floor(age)+1),
    ageDays:age, phase:phaseLabel(fraction),
    illumination:geometry.illumination,
    zodiac:SIGNS[Math.floor(geometry.longitude/30)],
    moonGlyph:fraction<.035||fraction>=.965?"🌑":
      fraction<.215?"🌒":fraction<.285?"🌓":fraction<.465?"🌔":
      fraction<.535?"🌕":fraction<.715?"🌖":fraction<.785?"🌗":"🌘",
    newMoonUtc:utc(newJd).toISOString(),
  }
}
