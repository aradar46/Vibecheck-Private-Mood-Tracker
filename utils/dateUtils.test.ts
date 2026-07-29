import { test, describe } from 'node:test';
import assert from 'node:assert';
import { parseTimeString, isSameDay } from './dateUtils.ts';

describe('parseTimeString', () => {
  test('parses valid HH:MM time', () => {
    const result = parseTimeString('12:34');
    assert.strictEqual(result.hours, 12);
    assert.strictEqual(result.minutes, 34);
  });

  test('parses single digit hours and minutes', () => {
    const result = parseTimeString('9:5');
    assert.strictEqual(result.hours, 9);
    assert.strictEqual(result.minutes, 5);
  });

  test('handles empty string', () => {
    const result = parseTimeString('');
    assert.strictEqual(result.hours, 0);
    assert.strictEqual(result.minutes, 0);
  });

  test('handles string without colon', () => {
    const result = parseTimeString('12');
    assert.strictEqual(result.hours, 12);
    assert.strictEqual(result.minutes, 0);
  });

  test('handles string with multiple colons', () => {
    const result = parseTimeString('12:34:56');
    assert.strictEqual(result.hours, 12);
    assert.strictEqual(result.minutes, 34);
  });

  test('handles non-numeric values', () => {
    const result = parseTimeString('ab:cd');
    assert.strictEqual(result.hours, 0);
    assert.strictEqual(result.minutes, 0);
  });

  test('handles mixed numeric and non-numeric values', () => {
    const result = parseTimeString('12:cd');
    assert.strictEqual(result.hours, 12);
    assert.strictEqual(result.minutes, 0);
  });

  test('handles null-like input (if it were forced)', () => {
    // @ts-ignore
    const result = parseTimeString(null);
    assert.strictEqual(result.hours, 0);
    assert.strictEqual(result.minutes, 0);
  });
});

describe('isSameDay', () => {
    test('returns true for same day and same time', () => {
        const date1 = new Date(2025, 4, 15, 10, 30);
        const date2 = new Date(2025, 4, 15, 10, 30);
        assert.strictEqual(isSameDay(date1, date2), true);
    });

    test('returns true for same day but different times', () => {
        const date1 = new Date(2025, 4, 15, 0, 0);
        const date2 = new Date(2025, 4, 15, 23, 59, 59, 999);
        assert.strictEqual(isSameDay(date1, date2), true);
    });

    test('returns false for different days in the same month and year', () => {
        const date1 = new Date(2025, 4, 15);
        const date2 = new Date(2025, 4, 16);
        assert.strictEqual(isSameDay(date1, date2), false);
    });

    test('returns false for same day and month but different years', () => {
        const date1 = new Date(2025, 4, 15);
        const date2 = new Date(2026, 4, 15);
        assert.strictEqual(isSameDay(date1, date2), false);
    });

    test('returns false for same day and year but different months', () => {
        const date1 = new Date(2025, 4, 15);
        const date2 = new Date(2025, 5, 15);
        assert.strictEqual(isSameDay(date1, date2), false);
    });

    test('handles end of year / start of year', () => {
        const date1 = new Date(2024, 11, 31);
        const date2 = new Date(2025, 0, 1);
        assert.strictEqual(isSameDay(date1, date2), false);
    });
});

