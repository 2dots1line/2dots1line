import { Request, Response, NextFunction } from 'express';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Log the error for debugging
  console.error('API Error:', err);

  // Default error values
  let error = { ...err };
  error.message = err.message;

  // Set default status code if not provided
  if (!error.statusCode) {
    error.statusCode = 500;
  }

  // Send error response
  res.status(error.statusCode).json({
    success: false,
    error: {
      message: error.message,
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    }
  });
}; 