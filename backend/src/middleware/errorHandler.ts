import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    console.error(`AppError [${_req.method} ${_req.url}]:`, err.message);
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      error: err.message,
    });
  }

  if (err instanceof ZodError) {
    const message = err.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
    return res.status(400).json({
      success: false,
      message: `Баталгаажуулалтын алдаа: ${message}`,
      error: 'Validation Error',
      details: err.errors
    });
  }

  console.error(`Unexpected Error [${_req.method} ${_req.url}]:`, err);
  console.log('Request Headers:', _req.headers);

  try {
    const fs = require('fs');
    const logEntry = `[${new Date().toISOString()}] ${err.stack || err.message}\n`;
    fs.appendFileSync('logs/error.log', logEntry);
  } catch (logErr) {
    console.error('Failed to write to log file:', logErr);
  }

  return res.status(500).json({
    success: false,
    error: err.message || 'Серверийн алдаа гарлаа',
    details: err.stack,
  });
}
