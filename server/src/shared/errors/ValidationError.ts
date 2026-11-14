import { AppError, type ErrorDetail } from './AppError.js';

export class ValidationError extends AppError {
  constructor(
    message = 'Validation failed',
    details: ErrorDetail[] = [],
    code = 'VALIDATION_ERROR'
  ) {
    super(message, 400, code, details);
  }
}
