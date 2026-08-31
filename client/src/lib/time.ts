import { format } from 'date-fns';
import { toZonedTime, format as formatZoned } from 'date-fns-tz';

export const IST_TIMEZONE = 'Asia/Kolkata';

/**
 * Returns current Date mapped in IST timezone
 */
export function getNowIST(): Date {
  return toZonedTime(new Date(), IST_TIMEZONE);
}

/**
 * Returns today's date in IST formatted as YYYY-MM-DD (for HTML date input)
 */
export function getTodayISTDateString(): string {
  const zoned = getNowIST();
  return formatZoned(zoned, 'yyyy-MM-dd', { timeZone: IST_TIMEZONE });
}

/**
 * Returns current time in IST formatted as HH:mm or hh:mm a
 */
export function getCurrentISTTimeString(): string {
  const zoned = getNowIST();
  return formatZoned(zoned, 'hh:mm a', { timeZone: IST_TIMEZONE });
}

/**
 * Format live clock header display:
 * "Monday, 31 August 2026 • 04:12:30 PM IST"
 */
export function formatLiveISTClock(date: Date = new Date()): string {
  const zoned = toZonedTime(date, IST_TIMEZONE);
  return `${formatZoned(zoned, 'EEEE, dd MMMM yyyy • hh:mm:ss a', { timeZone: IST_TIMEZONE })} IST`;
}

/**
 * Format any timestamp into standard IST string:
 * "31 Aug 2026, 04:05 PM IST"
 */
export function formatISTDateTime(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return '-';
  try {
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    if (isNaN(date.getTime())) return String(dateInput);
    const zoned = toZonedTime(date, IST_TIMEZONE);
    return `${formatZoned(zoned, 'dd MMM yyyy, hh:mm a', { timeZone: IST_TIMEZONE })} IST`;
  } catch {
    return String(dateInput);
  }
}

/**
 * Format date only in IST: "31 Aug 2026"
 */
export function formatISTDate(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return '-';
  try {
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    if (isNaN(date.getTime())) return String(dateInput);
    const zoned = toZonedTime(date, IST_TIMEZONE);
    return formatZoned(zoned, 'dd MMM yyyy', { timeZone: IST_TIMEZONE });
  } catch {
    return String(dateInput);
  }
}

/**
 * Formats a currency amount with Indian Number formatting (Lakhs, Crores)
 * e.g. 12850 -> ₹12,850
 */
export function formatCurrency(amount: number | null | undefined, symbol: string = '₹'): string {
  if (amount === null || amount === undefined || isNaN(amount)) return `${symbol}0`;
  const formattedNumber = new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 2,
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
  }).format(amount);
  return `${symbol}${formattedNumber}`;
}
