// Stable Kyiv calendar-day index: identical across runners and time zones.
function dayIndex(date) {
  const ms = Date.parse(date + "T00:00:00Z")
  return Number.isFinite(ms) ? Math.floor(ms / 86400000) : 0
}

// Practical seasonal horticulture tips, not lunar predictions.
// Weather-derived warnings take priority; never recommend routine watering
// during freezing or significant precipitation.
export function gardenTip(date, weather) {
  const daily = [
    "Перевірте прогноз на найближчу ніч перед роботами надворі.",
    "Огляньте рослини та відкладіть роботи, якщо ґрунт надто мокрий.",
    "Зверніть увагу на стан молодих дерев і кущів.",
    "Перевірте, чи добре закріплені укриття та садовий інвентар.",
    "Приберіть пошкоджені рослинні рештки, не травмуючи здорові пагони.",
    "Плануйте роботи відповідно до температури й вологості ґрунту.",
    "Огляньте теплицю, провітрювання та стан покривних матеріалів.",
  ]
  const addDaily = tip => tip + " " + daily[((dayIndex(date) % daily.length) + daily.length) % daily.length]
  const month = Number(date.split("-")[1])
  const cold = weather?.min !== null && Number.isFinite(weather?.min) && weather.min <= 0
  const wet = Number.isFinite(weather?.rain) && weather.rain >= 65
  const windy = Number.isFinite(weather?.gust) && weather.gust >= 15
  if (cold && (month >= 3 && month <= 5 || month >= 9 && month <= 11)) {
    return addDaily("Прикрийте чутливі рослини агроволокном. Перевірте теплицю та захистіть молоді саджанці від нічного холоду.")
  }
  if (windy) return addDaily("Закріпіть покривні матеріали й легкі конструкції. Перевірте гілки дерев і кріплення теплиці.")
  if (month <= 2) return addDaily("Огляньте укриття багаторічників і захист молодих дерев. Не ходіть по промерзлому або надмірно мокрому ґрунту.")
  if (month === 3) return addDaily("Підготуйте інструмент і перевірте насіння. Працюйте із землею лише після її відтавання та підсихання.")
  if (month === 4) return addDaily("Перевірте розсаду й готовність ґрунту до посіву. Слідкуйте за прогнозом нічних похолодань.")
  if (month === 5) return addDaily("Загартовуйте розсаду перед висадкою. Захищайте молоді посадки від різких змін температури.")
  if (month === 6) return addDaily(wet
    ? "Після дощів огляньте рослини на грибкові хвороби й забезпечте провітрювання теплиці."
    : "Огляньте грядки та мульчу. Поливайте під корінь лише за потреби, перевіривши вологість ґрунту.")
  if (month === 7 || month === 8) return addDaily(wet
    ? "Після рясних опадів перевірте дренаж і провітріть теплицю. Не поливайте вже мокрі грядки."
    : "Збирайте врожай і перевіряйте вологість ґрунту. За спеки поливайте вранці або ввечері.")
  if (month === 9) return addDaily("Збирайте стиглий урожай, готуйте місце для озимих культур і плануйте осінню посадку дерев.")
  if (month === 10) return addDaily("Приберіть уражене листя, замульчуйте пристовбурні кола і підготуйте інвентар до холодів.")
  if (month === 11) return addDaily("Перевірте укриття троянд і молодих дерев. Злийте воду з вуличних шлангів перед морозами.")
  return addDaily("Огляньте укриття кущів і теплицю після снігу чи вітру. Бережіть дерева від пошкодження гілок.")
}
