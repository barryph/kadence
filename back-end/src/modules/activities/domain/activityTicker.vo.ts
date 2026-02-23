import ServerError from 'src/shared/ServerError';

class TickerTooLongError extends ServerError {
  constructor() {
    super('TICKER_TOO_LONG', 'Ticker must be 5 characters or less', 422);
  }
}

// TODO: We can do away with _value and just use this.value without the additional getter
export default class ActivityTicker {
  _value: string;

  private constructor(ticker: string) {
    this._value = ticker;
  }

  get value(): string {
    return this._value;
  }

  private static isValid(ticker: string) {
    return ticker.length <= 5;
  }

  public static create(ticker: string): ActivityTicker {
    if (!this.isValid(ticker)) {
      throw new TickerTooLongError();
    }
    return new ActivityTicker(ticker);
  }
}
