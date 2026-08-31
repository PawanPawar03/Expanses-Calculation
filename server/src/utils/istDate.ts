import { format, subDays, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { toZonedTime, format as formatZoned } from 'date-fns-tz';

export const IST_TIMEZONE = 'Asia/Kolkata';

/**
 * Returns current timestamp in UTC ISO format (for database storage)
 */
export function getUTCNow(): string {
  return new Date().toISOString();
}

/**
 * Returns a Date object representing the current moment converted to IST
 */
export function getNowInIST(): Date {
  return toZonedTime(new Date(), IST_TIMEZONE);
}

/**
 * Returns current date in IST formatted as YYYY-MM-DD
 */
export function getCurrentISTDateString(): string {
  const zoned = getNowInIST();
  return formatZoned(zoned, 'yyyy-MM-dd', { timeZone: IST_TIMEZONE });
}

/**
 * Returns current time in IST formatted as hh:mm a (e.g. 04:05 PM) or HH:mm
 */
export function getCurrentISTTimeString(): string {
  const zoned = getNowInIST();
  return formatZoned(zoned, 'hh:mm a', { timeZone: IST_TIMEZONE });
}

/**
 * Format any ISO UTC or Date string into standard Indian Standard Time display
 * e.g., "31 Aug 2026, 04:05 PM IST"
 */
export function formatISTDisplay(dateInput: string | Date | null | undefined): string {
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
 * Format date only in IST (e.g. "31 Aug 2026")
 */
export function formatISTDateOnly(dateStr: string | Date | null | undefined): string {
  if (!dateStr) return '-';
  try {
    const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
    const zoned = toZonedTime(date, IST_TIMEZONE);
    return formatZoned(zoned, 'dd MMM yyyy', { timeZone: IST_TIMEZONE });
  } catch {
    return String(dateStr);
  }
}

/**
 * Returns IST start and end date strings for common filter presets
 */
export function getISTDateRangePreset(preset: 'today' | 'yesterday' | 'last7days' | 'thisMonth' | 'lastMonth'): {
  startDate: string;
  endDate: string;
} {
  const now = getNowInIST();
  const todayStr = formatZoned(now, 'yyyy-MM-dd', { timeZone: IST_TIMEZONE });

  switch (preset) {
    case 'today':
      return { startDate: todayStr, endDate: todayStr };
    case 'yesterday': {
      const yest = subDays(now, 1);
      const yestStr = formatZoned(yest, 'yyyy-MM-dd', { timeZone: IST_TIMEZONE });
      return { startDate: yestStr, endDate: yestStr };
    }
    case 'last7days': {
      const past7 = subDays(now, 6);
      const past7Str = formatZoned(past7, 'yyyy-MM-dd', { timeZone: IST_TIMEZONE });
      return { startDate: past7Str, endDate: todayStr };
    }
    case 'thisMonth': {
      const monthStart = startOfMonth(now);
      const monthEnd = endOfMonth(now);
      return {
        startDate: formatZoned(monthStart, 'yyyy-MM-dd', { timeZone: IST_TIMEZONE }),
        endDate: formatZoned(monthEnd, 'yyyy-MM-dd', { timeZone: IST_TIMEZONE }),
      };
    }
    case 'lastMonth': {
      const prevMonth = subMonths(now, 1);
      const monthStart = startOfMonth(prevMonth);
      const monthEnd = endOfMonth(prevMonth);
      return {
        startDate: formatZoned(monthStart, 'yyyy-MM-dd', { timeZone: IST_TIMEZONE }),
        endDate: formatZoned(monthEnd, 'yyyy-MM-dd', { timeZone: IST_TIMEZONE }),
      };
    }
    default:
      return { startDate: todayStr, endDate: todayStr };
  }
}
