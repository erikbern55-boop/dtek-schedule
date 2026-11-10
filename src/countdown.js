// Planned switch countdown for the existing Svitlopuls card.
// These are DTEK schedule boundaries, NOT observations from physical sensors.
// The image is periodically redrawn; it is not a live ticking Telegram widget.
const dateFormatter = new Intl.DateTimeFormat("sv-SE", {timeZone:"Europe/Kyiv"})
const clockFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone:"Europe/Kyiv",hour:"2-digit",minute:"2-digit",hourCycle:"h23",
})

function minute(clock) {
  const match=/^(\d{2}):(\d{2})$/.exec(clock)
  if(!match)throw Error("Invalid clock "+clock)
  return Number(match[1])*60+Number(match[2])
}
const pad=n=>String(n).padStart(2,"0")

export function nextPowerEvent(schedule,date,now=new Date()) {
  const today=dateFormatter.format(now)
  if(date<today) return {kind:"past",title:"Попередній графік",detail:"Дата вже минула"}
  const changes=[]
  for(let i=1;i<schedule.length;i++){
    if(schedule[i-1].power===schedule[i].power)continue
    changes.push({clock:schedule[i].begin,power:schedule[i].power,
      at:minute(schedule[i].begin)})
  }
  if(date>today){
    const first=changes[0]
    return first
      ? {kind:"future",title:"Перша зміна графіка",detail:"Завтра о "+first.clock,
         time:first.clock,power:first.power}
      : {kind:"future",title:"Зміни завтра не заплановані",
         detail:"За графіком на добу"}
  }
  const nowMinute=minute(clockFormatter.format(now))
  const current=schedule.find(p=>minute(p.begin)<=nowMinute&&nowMinute<minute(p.end))
  if(!current)return{kind:"unknown",title:"Графік уточнюється",detail:"Немає поточного періоду"}
  const next=changes.find(c=>c.at>nowMinute)
  if(!next){
    // Midnight is a day boundary, not a verified switch. Never claim
    // that electricity turns on/off without the following day's schedule.
    const remaining=1440-nowMinute
    return {
      kind:"countdown",
      title:"До завершення добового графіка",
      detail:"Наступну зміну перевіряй у графіку на завтра",
      currentPower:current.power,
      time:"24:00",
      minutesRemaining:remaining,
      remaining:pad(Math.floor(remaining/60))+":"+pad(remaining%60),
    }
  }
  const remaining=next.at-nowMinute
  return{
    kind:"countdown",
    title:next.power?"До планового ввімкнення":"До планового вимкнення",
    detail:(next.power?"Очікуване ввімкнення":"Очікуване вимкнення")+": "+next.clock,
    currentPower:current.power,
    power:next.power, time:next.clock,
    minutesRemaining:remaining,
    remaining:pad(Math.floor(remaining/60))+":"+pad(remaining%60),
  }
}
