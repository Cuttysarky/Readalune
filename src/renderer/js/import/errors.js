/** An import problem whose message is safe and helpful to show to the user. */
export class ImportError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ImportError';
  }
}
