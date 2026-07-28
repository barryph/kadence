import ActivityTicker from './activityTicker.vo';

describe('ActivityTicker', () => {
  it('creates a ticker when 5 characters or fewer', () => {
    const ticker = ActivityTicker.create('SQUT');
    expect(ticker.value).toBe('SQUT');
  });

  it('rejects tickers longer than 5 characters', () => {
    expect(() => ActivityTicker.create('TOOLONG')).toThrow(
      'Ticker must be 5 characters or less',
    );
  });
});
