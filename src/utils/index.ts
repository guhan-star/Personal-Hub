import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, parseISO, isValid } from 'date-fns';

/**
 * Combine Tailwind classes safely
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format currency in Indian Rupees (INR, ₹)
 * Handles both whole and decimal numbers properly.
 */
export function formatINR(amount: number | string | null | undefined, includeSymbol: boolean = true): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : (amount ?? 0);
  if (isNaN(num)) return includeSymbol ? '₹0.00' : '0.00';

  const formatter = new Intl.NumberFormat('en-IN', {
    style: includeSymbol ? 'currency' : 'decimal',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return formatter.format(num);
}

/**
 * Compact Indian Currency format (e.g. ₹1.2L, ₹50k)
 */
export function formatINRCompact(amount: number): string {
  const abs = Math.abs(amount);
  const sign = amount < 0 ? '-' : '';
  if (abs >= 10000000) {
    return `${sign}₹${(abs / 10000000).toFixed(2)} Cr`;
  }
  if (abs >= 100000) {
    return `${sign}₹${(abs / 100000).toFixed(2)} L`;
  }
  if (abs >= 1000) {
    return `${sign}₹${(abs / 1000).toFixed(1)}k`;
  }
  return formatINR(amount);
}

/**
 * Precision arithmetic helper: convert Rupee float to integer Paise to prevent IEEE-754 issues
 */
export function toPaise(rupees: number): number {
  return Math.round(rupees * 100);
}

/**
 * Precision arithmetic helper: convert integer Paise back to Rupee float
 */
export function fromPaise(paise: number): number {
  return paise / 100;
}

/**
 * Format dates safely
 */
export function formatDate(dateInput: string | Date | null | undefined, formatStr = 'dd MMM yyyy'): string {
  if (!dateInput) return '';
  try {
    const date = typeof dateInput === 'string' ? parseISO(dateInput) : dateInput;
    if (!isValid(date)) return String(dateInput);
    return format(date, formatStr);
  } catch {
    return String(dateInput);
  }
}

/**
 * Format relative time (e.g. "Today", "Yesterday", "In 3 days")
 */
export function formatRelativeDate(dateStr: string): string {
  if (!dateStr) return '';
  const date = parseISO(dateStr);
  if (!isValid(date)) return dateStr;

  const today = new Date();
  const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  const diffTime = dateOnly.getTime() - todayOnly.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays === -1) return 'Yesterday';
  if (diffDays > 1 && diffDays <= 7) return `In ${diffDays} days`;
  if (diffDays < -1 && diffDays >= -7) return `${Math.abs(diffDays)} days ago`;

  return format(date, 'dd MMM yyyy');
}

/**
 * Generate a cryptographically secure or pseudo-random UUID v4
 */
export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Rule-based category suggestion service for BrainVault items
 */
export function suggestCategory(url: string, title?: string): { folder: string; tags: string[] } {
  const combined = `${url || ''} ${title || ''}`.toLowerCase();

  if (combined.includes('github') || combined.includes('stackoverflow') || combined.includes('dev.to') || combined.includes('code') || combined.includes('python') || combined.includes('react') || combined.includes('typescript')) {
    return { folder: 'Technology', tags: ['Programming', 'Dev'] };
  }
  if (combined.includes('zerodha') || combined.includes('groww') || combined.includes('moneycontrol') || combined.includes('invest') || combined.includes('tax') || combined.includes('finance') || combined.includes('stock')) {
    return { folder: 'Finance', tags: ['Investing', 'Money'] };
  }
  if (combined.includes('youtube.com') || combined.includes('youtu.be') || combined.includes('coursera') || combined.includes('udemy') || combined.includes('tutorial') || combined.includes('course') || combined.includes('learn')) {
    return { folder: 'Education', tags: ['Learning', 'Video'] };
  }
  if (combined.includes('amazon') || combined.includes('flipkart') || combined.includes('myntra') || combined.includes('product') || combined.includes('buy') || combined.includes('price')) {
    return { folder: 'Shopping', tags: ['Wishlist', 'Product'] };
  }
  if (combined.includes('instagram.com') || combined.includes('recipe') || combined.includes('travel') || combined.includes('workout') || combined.includes('fitness')) {
    return { folder: 'Personal', tags: ['Lifestyle'] };
  }

  return { folder: 'Uncategorized', tags: [] };
}

/**
 * Export data to CSV format and trigger browser download
 */
export function exportToCSV(filename: string, rows: Record<string, any>[]) {
  if (!rows || !rows.length) return;

  const headers = Object.keys(rows[0]);
  const csvContent = [
    headers.join(','),
    ...rows.map(row => 
      headers.map(header => {
        let val = row[header];
        if (val === null || val === undefined) val = '';
        const stringVal = String(val).replace(/"/g, '""');
        return `"${stringVal}"`;
      }).join(',')
    )
  ].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export data to formatted JSON and trigger browser download
 */
export function exportToJSON(filename: string, data: any) {
  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
