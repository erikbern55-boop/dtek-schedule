// Fail closed on stale V3 data: show the same published image as Telegram.
// This script is injected into the deployed V3 page, not into Telegram.
(async () => {
  const kyivDay = () => new Intl.DateTimeFormat('sv-SE', {timeZone:'Europe/Kyiv'}).format(new Date());
  const check = async () => {
    let fresh = false;
    try {
      const response = await fetch('./svitlopuls-live.json?t=' + Date.now(), {cache:'no-store'});
      if (!response.ok) throw new Error('live JSON HTTP ' + response.status);
      const data = await response.json();
      const canonicalResponse = await fetch('./today.json?t=' + Date.now(), {cache:'no-store'});
      if (!canonicalResponse.ok) throw new Error('canonical Telegram JSON HTTP ' + canonicalResponse.status);
      const canonical = await canonicalResponse.json();
      const normalized = periods => JSON.stringify(periods.map(p => [p.begin,p.end,Boolean(p.power)]));
      if (!Array.isArray(canonical.periods) || !Array.isArray(data.periods) ||
          canonical.date !== data.date ||
          normalized(canonical.periods) !== normalized(data.periods)) {
        throw new Error('V3 schedule differs from canonical Telegram schedule');
      }
      const canonicalStamp = Date.parse(canonical.generatedAt);
      if (canonical.date !== kyivDay() || !Number.isFinite(canonicalStamp) ||
          Date.now()-canonicalStamp > 12*60*1000) {
        throw new Error('canonical Telegram snapshot is stale');
      }
      const stamp = Date.parse(data.generatedAt);
      fresh = data.live === true && data.date === kyivDay() &&
        Number.isFinite(stamp) && Date.now() - stamp < 12 * 60 * 1000 &&
        Date.now() >= stamp - 60 * 1000;
    } catch (error) { console.warn('V3 freshness check:', error); }
    let fallback = document.getElementById('telegram-synced-fallback');
    if (!fresh) {
      if (!fallback) {
        fallback = document.createElement('div');
        fallback.id = 'telegram-synced-fallback';
        fallback.style.cssText = 'position:fixed;inset:0;z-index:2147483647;background:#020e08;overflow:auto;text-align:center';
        fallback.innerHTML = '<div style="font:14px Arial;color:#e3ffeb;padding:8px">Остання опублікована картка Telegram · перевір дату й час оновлення</div><img alt="Поточна картка Telegram" style="width:100%;max-width:1200px;height:auto" />';
        document.body.appendChild(fallback);
      }
      fallback.querySelector('img').src = './today.png?t=' + Date.now();
    } else if (fallback) {
      fallback.remove();
    }
  };
  await check();
  setInterval(check, 60000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) check(); });
})();
