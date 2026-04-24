export class DuplicateActivityEventError extends Error {
  constructor() {
    super('Activity event already exists for this date');
  }
}
