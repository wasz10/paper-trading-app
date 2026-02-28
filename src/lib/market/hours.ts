export function isMarketOpen(): boolean {
  const now = new Date()
  const et = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }))
  const day = et.getDay()
  const hours = et.getHours()
  const minutes = et.getMinutes()
  const timeInMinutes = hours * 60 + minutes

  if (day === 0 || day === 6) return false
  return timeInMinutes >= 570 && timeInMinutes < 960 // 9:30 AM - 4:00 PM
}

export function getMarketStatus(): { isOpen: boolean; message: string } {
  const open = isMarketOpen()
  if (open) {
    return { isOpen: true, message: 'Market is open' }
  }

  const now = new Date()
  const et = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }))
  const day = et.getDay()

  if (day === 6) {
    return { isOpen: false, message: 'Market closed · Opens Mon 9:30 AM ET' }
  }
  if (day === 0) {
    return { isOpen: false, message: 'Market closed · Opens Mon 9:30 AM ET' }
  }

  const hours = et.getHours()
  const timeInMinutes = hours * 60 + et.getMinutes()

  if (timeInMinutes < 570) {
    return { isOpen: false, message: 'Market closed · Opens today 9:30 AM ET' }
  }

  return { isOpen: false, message: 'Market closed · Opens tomorrow 9:30 AM ET' }
}
