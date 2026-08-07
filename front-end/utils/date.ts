export function formatDateISO(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Returns the date in YYYY-MM-DD format,
 * The date is local, aka matches the current devices date.
 */
export function YYYYMMDD(date = new Date()): string {
  // en-CA returns in the format 'YYYY-MM-DD', en-NZ does not
  return new Intl.DateTimeFormat('en-CA').format(date);
}

/**
 * Returns the current local month as YYYY-MM.
 */
export function getCurrentMonth(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}
