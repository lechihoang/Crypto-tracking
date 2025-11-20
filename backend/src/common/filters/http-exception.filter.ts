import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { Request, Response } from "express";
import { Error as MongooseError } from "mongoose";

/**
 * Global exception filter that handles all types of errors in the application
 * Provides consistent error response format and comprehensive logging
 */
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const errorResponse = this.buildErrorResponse(exception, request);

    // Log the error with full context
    this.logError(exception, request, errorResponse);

    response.status(errorResponse.statusCode).json(errorResponse);
  }

  /**
   * Build a consistent error response object from any exception type
   */
  private buildErrorResponse(exception: unknown, request: Request) {
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = "Internal server error";
    let error = "Internal Server Error";

    // Handle NestJS HttpException (includes BadRequestException, NotFoundException, etc.)
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === "string") {
        message = exceptionResponse;
        error = exception.name;
      } else if (typeof exceptionResponse === "object") {
        const responseObj = exceptionResponse as any;
        // Handle validation errors which may have array of messages
        message = responseObj.message || message;
        error = responseObj.error || exception.name;
      }
    }
    // Handle MongoDB/Mongoose errors
    else if (this.isMongoError(exception)) {
      const mongoError = exception as any;
      status = this.getMongoErrorStatus(mongoError);
      message = this.getMongoErrorMessage(mongoError);
      error = "Database Error";
    }
    // Handle Axios errors (external API calls)
    else if (this.isAxiosError(exception)) {
      const axiosError = exception as any;
      status = axiosError.response?.status || HttpStatus.SERVICE_UNAVAILABLE;
      message =
        axiosError.response?.data?.message ||
        axiosError.message ||
        "External service error";
      error = "External Service Error";
    }
    // Handle standard Error objects
    else if (exception instanceof Error) {
      message = exception.message || "An unexpected error occurred";
      error = exception.name || "Error";

      // Don't expose internal error details in production
      if (process.env.NODE_ENV === "production") {
        message = "An unexpected error occurred";
      }
    }
    // Handle unknown error types
    else {
      message = "An unexpected error occurred";
      error = "Unknown Error";

      this.logger.error("Caught unknown error type", JSON.stringify(exception));
    }

    return {
      success: false,
      statusCode: status,
      error,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
    };
  }

  /**
   * Log error with appropriate level and full context
   */
  private logError(exception: unknown, request: Request, errorResponse: any) {
    const { statusCode, error, message } = errorResponse;

    // Build context object for logging
    const context = {
      timestamp: errorResponse.timestamp,
      path: request.url,
      method: request.method,
      statusCode,
      error,
      message,
      userId: (request as any).user?.id || "anonymous",
      ip: request.ip,
      userAgent: request.get("user-agent"),
      body: this.sanitizeRequestBody(request.body),
      query: request.query,
    };

    // Log with appropriate level based on status code
    if (statusCode >= 500) {
      // Server errors - log with stack trace
      this.logger.error(
        `${request.method} ${request.url} - ${statusCode} - ${this.formatMessage(message)}`,
        exception instanceof Error
          ? exception.stack
          : JSON.stringify(exception),
        JSON.stringify(context),
      );
    } else if (statusCode >= 400) {
      // Client errors - log as warning
      this.logger.warn(
        `${request.method} ${request.url} - ${statusCode} - ${this.formatMessage(message)}`,
        JSON.stringify(context),
      );
    } else {
      // Unexpected status codes
      this.logger.log(
        `${request.method} ${request.url} - ${statusCode} - ${this.formatMessage(message)}`,
        JSON.stringify(context),
      );
    }
  }

  /**
   * Check if error is a MongoDB/Mongoose error
   */
  private isMongoError(exception: unknown): boolean {
    return (
      exception instanceof MongooseError ||
      (exception as any)?.name === "MongoError" ||
      (exception as any)?.name === "MongoServerError" ||
      (exception as any)?.name === "ValidationError" ||
      (exception as any)?.name === "CastError" ||
      (exception as any)?.code !== undefined // MongoDB errors have error codes
    );
  }

  /**
   * Check if error is an Axios error
   */
  private isAxiosError(exception: unknown): boolean {
    return (
      (exception as any)?.isAxiosError === true ||
      (exception as any)?.config?.url !== undefined
    );
  }

  /**
   * Get appropriate HTTP status code for MongoDB/Mongoose errors
   */
  private getMongoErrorStatus(error: any): HttpStatus {
    // Duplicate key error
    if (error.code === 11000) {
      return HttpStatus.CONFLICT;
    }
    // Mongoose validation error
    if (error.name === "ValidationError") {
      return HttpStatus.BAD_REQUEST;
    }
    // Mongoose cast error (invalid ObjectId, etc.)
    if (error.name === "CastError") {
      return HttpStatus.BAD_REQUEST;
    }
    // MongoDB validation error
    if (error.code === 121) {
      return HttpStatus.BAD_REQUEST;
    }
    // Connection errors
    if (error.code === 6 || error.code === 89) {
      return HttpStatus.SERVICE_UNAVAILABLE;
    }
    // Default to internal server error
    return HttpStatus.INTERNAL_SERVER_ERROR;
  }

  /**
   * Get user-friendly message for MongoDB/Mongoose errors
   */
  private getMongoErrorMessage(error: any): string {
    // Duplicate key error
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern || {})[0] || "field";
      return `A record with this ${field} already exists`;
    }
    // Mongoose validation error
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors || {})
        .map((err: any) => err.message)
        .join(", ");
      return messages || "Validation failed";
    }
    // Mongoose cast error
    if (error.name === "CastError") {
      return `Invalid ${error.path}: ${error.value}`;
    }
    // MongoDB validation error
    if (error.code === 121) {
      return "Invalid data format";
    }
    // Connection errors
    if (error.code === 6 || error.code === 89) {
      return "Database connection error. Please try again later.";
    }
    // Default message
    return error.message || "Database operation failed";
  }

  /**
   * Sanitize request body to remove sensitive information from logs
   */
  private sanitizeRequestBody(body: any): any {
    if (!body || typeof body !== "object") {
      return body;
    }

    const sensitiveFields = [
      "password",
      "token",
      "apiKey",
      "secret",
      "authorization",
    ];
    const sanitized = { ...body };

    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = "***REDACTED***";
      }
    }

    return sanitized;
  }

  /**
   * Format message for logging (handle arrays)
   */
  private formatMessage(message: string | string[]): string {
    if (Array.isArray(message)) {
      return message.join(", ");
    }
    return message;
  }
}
