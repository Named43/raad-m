import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function formatArabicTime(value: number, unit: 'w' | 'd' | 'h' | 'm' | 's'): string {
  if (!value) return '';
  
  let singular, dual, plural3_10, plural11_99;
  
  switch (unit) {
    case 'w':
      singular = 'أسبوع'; dual = 'أسبوعين'; plural3_10 = 'أسابيع'; plural11_99 = 'أسبوعاً';
      break;
    case 'd':
      singular = 'يوم'; dual = 'يومين'; plural3_10 = 'أيام'; plural11_99 = 'يوماً';
      break;
    case 'h':
      singular = 'ساعة'; dual = 'ساعتين'; plural3_10 = 'ساعات'; plural11_99 = 'ساعة';
      break;
    case 'm':
      singular = 'دقيقة'; dual = 'دقيقتين'; plural3_10 = 'دقائق'; plural11_99 = 'دقيقة';
      break;
    case 's':
      singular = 'ثانية'; dual = 'ثانيتين'; plural3_10 = 'ثواني'; plural11_99 = 'ثانية';
      break;
  }

  if (value === 1) return singular;
  if (value === 2) return dual;
  if (value >= 3 && value <= 10) return `${value} ${plural3_10}`;
  return `${value} ${plural11_99}`;
}

export function parseMikrotikUptimeToSeconds(uptime: string): number {
  if (!uptime) return 0;
  
  const regex = /(?:(\d+)w)?(?:(\d+)d)?(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?/;
  const match = uptime.match(regex);
  
  if (!match) return 0;
  
  let seconds = 0;
  if (match[1]) seconds += parseInt(match[1]) * 7 * 24 * 60 * 60; // weeks
  if (match[2]) seconds += parseInt(match[2]) * 24 * 60 * 60; // days
  if (match[3]) seconds += parseInt(match[3]) * 60 * 60; // hours
  if (match[4]) seconds += parseInt(match[4]) * 60; // minutes
  if (match[5]) seconds += parseInt(match[5]); // seconds
  
  return seconds;
}

export function formatSecondsToArabicUptime(totalSeconds: number): string {
  if (totalSeconds === 0) return '0 ثانية';

  const w = Math.floor(totalSeconds / (7 * 24 * 60 * 60));
  let rem = totalSeconds % (7 * 24 * 60 * 60);
  
  const d = Math.floor(rem / (24 * 60 * 60));
  rem = rem % (24 * 60 * 60);
  
  const h = Math.floor(rem / (60 * 60));
  rem = rem % (60 * 60);
  
  const m = Math.floor(rem / 60);
  const s = rem % 60;

  const parts = [];
  if (w > 0) parts.push(formatArabicTime(w, 'w'));
  if (d > 0) parts.push(formatArabicTime(d, 'd'));
  if (h > 0) parts.push(formatArabicTime(h, 'h'));
  if (m > 0) parts.push(formatArabicTime(m, 'm'));
  if (s > 0) parts.push(formatArabicTime(s, 's'));
  
  return parts.length > 0 ? parts.join(' و ') : '0 ثانية';
}
