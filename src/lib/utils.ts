import { format, isValid } from 'date-fns';
import { ja } from 'date-fns/locale';

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function formatDate(date: Date | string, formatStr: string = 'yyyy/MM/dd'): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  if (!isValid(dateObj)) return '';
  return format(dateObj, formatStr, { locale: ja });
}

export function formatTime(time: string): string {
  if (!time) return '';
  const [hours, minutes] = time.split(':');
  return `${hours}:${minutes}`;
}

export function generateInviteCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export function parseQuickMessage(template: string, values: Record<string, string>): string {
  let result = template;
  Object.entries(values).forEach(([key, value]) => {
    result = result.replace(`{${key}}`, value);
  });
  return result;
}
