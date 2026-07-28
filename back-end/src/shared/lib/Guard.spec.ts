import { Guard } from './Guard';

describe('Guard', () => {
  it('passes when value is not null or undefined', () => {
    const result = Guard.againstNullOrUndefined('value', 'field');
    expect(result.succeeded).toBe(true);
  });

  it('fails when value is null', () => {
    const result = Guard.againstNullOrUndefined(null, 'field');
    expect(result.succeeded).toBe(false);
    expect(result.message).toBe('field is null or undefined');
  });

  it('fails when value is undefined', () => {
    const result = Guard.againstNullOrUndefined(undefined, 'field');
    expect(result.succeeded).toBe(false);
  });

  it('uses custom message when provided', () => {
    const result = Guard.againstNullOrUndefined(null, 'field', 'Custom error');
    expect(result.message).toBe('Custom error');
  });

  it('validates bulk arguments and stops at first failure', () => {
    const result = Guard.againstNullOrUndefinedBulk([
      { argument: 'ok', argumentName: 'first' },
      { argument: null, argumentName: 'second' },
      { argument: 'also ok', argumentName: 'third' },
    ]);

    expect(result.succeeded).toBe(false);
    expect(result.message).toBe('second is null or undefined');
  });
});
