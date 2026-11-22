// Keep today's live V3 page and tomorrow's Telegram card on the same published snapshot.
(async () => {
  const day = /(?:^|[?&])day=tomorrow(?:&|$)/.test(globalThis.location?.search || '') ? 'tomorrow' : 'today';
  const DTEK_SCHEDULE_URL = 'https://www.dtek-krem.com.ua/ua/shutdowns';
  const kyivDay = () => new Intl.DateTimeFormat('sv-SE', {timeZone:'Europe/Kyiv'}).format(new Date());

  const check = async () => {
    let fresh = false;
    if (day === 'today') {
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
    }

    // Production V3 is generated for today only. The Telegram button for
    // tomorrow must therefore display the very same published tomorrow PNG.
    const showTelegramSnapshot = day === 'tomorrow' || !fresh;
    let fallback = document.getElementById('telegram-synced-fallback');
    if (showTelegramSnapshot) {
      if (!fallback) {
        fallback = document.createElement('div');
        fallback.id = 'telegram-synced-fallback';
        fallback.style.cssText = 'position:fixed;inset:0;z-index:2147483647;background:#020e08;overflow:hidden;text-align:center';
        fallback.innerHTML = '<div style="height:34px;box-sizing:border-box;font:14px/34px Arial;color:#e3ffeb;white-space:nowrap">Опублікована картка Telegram · оновлюється разом із графіком</div><iframe title="Прокручувана картка Telegram" style="display:block;width:100%;height:calc(100vh - 34px);height:calc(100dvh - 34px);border:0;background:#020e08"></iframe>';
        document.body.appendChild(fallback);
      }
      const frame = fallback.querySelector('iframe');
      const frameDay = frame.dataset.day;
      if (frameDay !== day) {
        frame.dataset.day = day;
        frame.src = './' + day + '.html?fullscreen=' + Date.now();
      }
    } else if (fallback) {
      fallback.remove();
    }
  };
  await check();
  setInterval(check, 60000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) check(); });
})();
