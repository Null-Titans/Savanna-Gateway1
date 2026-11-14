import { AppError } from './AppError.js';

export class RateLimitError extends AppError {
  constructor(message = 'Too many requests, please slow down', code = 'RATE_LIMITED') {
    super(message, 429, code);
  }
}
