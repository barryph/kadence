import { formatDateISO, getCurrentMonth, YYYYMMDD } from '../date';

describe('date utils', () => {
  describe('formatDateISO', () => {
    it('formats a date as YYYY-MM-DD', () => {
      const date = new Date(2026, 6, 28); // July 28, 2026
      expect(formatDateISO(date)).toBe('2026-07-28');
    });

    it('zero-pads single-digit months and days', () => {
      const date = new Date(2026, 0, 5); // January 5, 2026
      expect(formatDateISO(date)).toBe('2026-01-05');
    });
  });

  describe('YYYYMMDD', () => {
    it('returns today in YYYY-MM-DD format by default', () => {
      const today = new Date();
      const expected = new Intl.DateTimeFormat('en-CA').format(today);
      expect(YYYYMMDD()).toBe(expected);
    });

    it('formats a given date in YYYY-MM-DD format', () => {
      const date = new Date(2026, 6, 28);
      expect(YYYYMMDD(date)).toBe('2026-07-28');
    });
  });

  describe('getCurrentMonth', () => {
    it('returns today as YYYY-MM by default', () => {
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      expect(getCurrentMonth()).toBe(`${year}-${month}`);
    });

    it('formats a given date as YYYY-MM', () => {
      expect(getCurrentMonth(new Date(2026, 6, 28))).toBe('2026-07');
    });

    it('zero-pads single-digit months', () => {
      expect(getCurrentMonth(new Date(2026, 0, 5))).toBe('2026-01');
    });
  });
});
