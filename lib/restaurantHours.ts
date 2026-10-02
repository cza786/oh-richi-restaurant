export function isWithinOpeningHours(
  openingTime: string | null,
  closingTime: string | null,
  now = new Date(),
  timeZone = process.env.RESTAURANT_TIME_ZONE || 'Asia/Karachi',
): boolean {
  if (!openingTime || !closingTime) return true;
  const timePattern = /^(\d{2}):(\d{2})$/;
  const openingMatch = openingTime.match(timePattern);
  const closingMatch = closingTime.match(timePattern);
  if (!openingMatch || !closingMatch) return true;

  const openingMinutes = Number(openingMatch[1]) * 60 + Number(openingMatch[2]);
  const closingMinutes = Number(closingMatch[1]) * 60 + Number(closingMatch[2]);
  if (openingMinutes === closingMinutes) return true;

  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(now);
  const currentMinutes = Number(parts.find((part) => part.type === 'hour')?.value || 0) * 60
    + Number(parts.find((part) => part.type === 'minute')?.value || 0);

  if (openingMinutes < closingMinutes) {
    return currentMinutes >= openingMinutes && currentMinutes < closingMinutes;
  }
  return currentMinutes >= openingMinutes || currentMinutes < closingMinutes;
}

