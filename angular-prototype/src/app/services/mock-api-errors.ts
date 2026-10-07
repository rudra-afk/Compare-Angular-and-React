export class ApiError extends Error {
  constructor(message = 'Something went wrong talking to the server. Please try again.') {
    super(message);
    this.name = 'ApiError';
  }
}
