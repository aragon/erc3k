import { format } from 'date-fns';

export const toMs = (seconds: number) => seconds * 1000;

const KNOWN_FORMATS = {
  standard: 'MMM dd yyyy HH:mm', // This is our standard used for showing dates.
};

/**
 * @param date number or string in seconds (not milliseconds)
 * @param formatType KNOWN_FORMATS
 */
export function formatDate(date: number | string, formatType?: string) {
  try {
    if (typeof date === 'string') {
      date = parseInt(date, 10);
    }
    date = date * 1000;
    formatType = formatType || KNOWN_FORMATS.standard;
    return format(date, formatType, {});
  } catch (e) {
    return date;
  }
}
