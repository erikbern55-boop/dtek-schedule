// Short, original entertainment-only text based on the astronomical
// (tropical) position of the Moon calculated in moon.js.
// No astrology site is scraped; no unsupported claims of predicting events.
const zodiacSymbols = Object.freeze({
  "Овен":"♈", "Телець":"♉", "Близнюки":"♊", "Рак":"♋",
  "Лев":"♌", "Діва":"♍", "Терези":"♎", "Скорпіон":"♏",
  "Стрілець":"♐", "Козоріг":"♑", "Водолій":"♒", "Риби":"♓",
})

const locatives=Object.freeze({
 "Овен":"Овні", "Телець":"Тельці", "Близнюки":"Близнюках", "Рак":"Раку",
 "Лев":"Леві", "Діва":"Діві", "Терези":"Терезах", "Скорпіон":"Скорпіоні",
 "Стрілець":"Стрільці", "Козоріг":"Козорозі", "Водолій":"Водолії", "Риби":"Рибах",
})

const messages = Object.freeze({
  "Овен":"Знайдіть час для ініціативи та невеликої корисної справи. Перш ніж діяти, оберіть один головний пріоритет.",
  "Телець":"Створіть навколо себе більше затишку та спокою. Приємні домашні дрібниці можуть додати гарного настрою.",
  "Близнюки":"Чудовий привід для цікавої розмови чи нової ідеї. Спробуйте поділитися думками з близькими.",
  "Рак":"Приділіть увагу дому, родині та відпочинку. Нехай сьогодні знайдеться хвилина для теплих слів.",
  "Лев":"Додайте трохи творчості до звичних справ. Щира похвала й добрий жест прикрасять ваш день.",
  "Діва":"Символічний день для наведення порядку та завершення дрібних завдань. Не вимагайте від себе ідеальності.",
  "Терези":"Шукайте гармонію у спілкуванні та побуті. Дайте собі час спокійно зважити різні варіанти.",
  "Скорпіон":"Спробуйте зосередитися на важливому, навести лад і завершити розпочате. Уникайте поспішних висновків.",
  "Стрілець":"Знайдіть привід дізнатися щось нове. Прогулянка або цікава книжка можуть надихнути.",
  "Козоріг":"Складіть простий план на день і відзначте маленький результат. Пам’ятайте і про відпочинок.",
  "Водолій":"Подивіться на звичну справу по-новому. Незвична ідея або дружня розмова додадуть натхнення.",
  "Риби":"Подаруйте собі трохи тиші, музики чи творчості. Нехай дрібні радощі створюють настрій.",
})

export function astroForMoon(moon) {
  const sign=moon?.zodiac
  if (!Object.hasOwn(messages,sign)) {
    return {sign:"—",inSign:"невідомому знаку",symbol:"✦",message:"Знайдіть хвилину для відпочинку й натхнення."}
  }
  return {
    sign,
    symbol:zodiacSymbols[sign],
    inSign:locatives[sign],
    message:messages[sign],
  }
}

// Use a mathematically shaped crescent instead of an operating-system emoji:
// a 1% crescent must NOT be drawn as a full white moon.
export function moonDiscSvg(moon) {
  const f=Math.max(0,Math.min(1,Number(moon?.illumination ?? 0)/100))
  const waxing=moon?.phase?.startsWith("Зростаю")||moon?.phase==="Перша чверть"
  const cx=70,cy=70,r=54,steps=56
  const terminator = []
  const limb=[]
  for(let i=0;i<=steps;i++) {
    const y=-r+2*r*i/steps
    const x=Math.sqrt(Math.max(0,r*r-y*y))
    terminator.push([cx+(waxing?(1-2*f):(2*f-1))*x,cy+y])
  }
  for(let i=steps;i>=0;i--) {
    const y=-r+2*r*i/steps
    const x=Math.sqrt(Math.max(0,r*r-y*y))
    limb.push([cx+(waxing?x:-x),cy+y])
  }
  const path=[...terminator,...limb].map(([x,y],i)=>
    (i===0?"M":"L")+x.toFixed(2)+","+y.toFixed(2)).join(" ")+" Z"
  return '<svg class="wx-moon-disc" viewBox="0 0 140 140" xmlns="http://www.w3.org/2000/svg" '+
    'role="img" aria-label="Освітленість Місяця '+Math.round(f*100)+' відсотків">'+
    '<circle cx="70" cy="70" r="54" fill="#132032" stroke="#8ac4d8" stroke-width="2"/>'+
    '<path d="'+path+'" fill="#f2f7f2"/>'+
    '<circle cx="70" cy="70" r="54" fill="none" stroke="#9fbdc7" stroke-width="1.5"/>'+
    '</svg>'
}
