import { AppError } from './AppError.js';

export class ForbiddenError extends AppError {
  constructor(message = 'Access forbidden: insufficient permissions', code = 'FORBIDDEN') {
    super(message, 403, code);
  }
}
