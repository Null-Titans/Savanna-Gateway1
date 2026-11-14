import type { Response } from 'express';

export interface ApiResponse<T = unknown> {
  success: true;
  data: T;
  meta: Record<string, unknown>;
}

export function sendSuccess<T>(
  res: Response,
  data: T,
  meta: Record<string, unknown> = {},
  statusCode = 200
): Response {
  const payload: ApiResponse<T> = {
    success: true,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      ...meta,
    },
  };

  return res.status(statusCode).json(payload);
}
