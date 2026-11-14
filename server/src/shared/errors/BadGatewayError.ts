import { AppError } from './AppError.js';

export class BadGatewayError extends AppError {
  constructor(message = 'Upstream service unavailable or returned an error', code = 'UPSTREAM_ERROR') {
    super(message, 502, code);
  }
}
