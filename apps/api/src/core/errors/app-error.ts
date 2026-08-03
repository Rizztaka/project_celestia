/**
 * Base class for all application-level errors.
 *
 * Every domain error extends this class so the global error handler
 * can produce the correct HTTP status code and error code automatically,
 * without any business logic leaking into the controller or middleware.
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly errorCode: string;

  constructor(message: string, statusCode: number, errorCode: string) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.errorCode = errorCode;

    // Restore prototype chain — required when extending built-ins in TypeScript
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

// ============================================================
// HTTP 400 — Bad Request
// ============================================================

export class BadRequestError extends AppError {
  constructor(message = "The request was invalid.") {
    super(message, 400, "BAD_REQUEST");
  }
}

// ============================================================
// HTTP 401 — Unauthorized (not authenticated)
// ============================================================

export class UnauthorizedError extends AppError {
  constructor(message = "Authentication is required to access this resource.") {
    super(message, 401, "UNAUTHORIZED");
  }
}

// ============================================================
// HTTP 403 — Forbidden (authenticated but not permitted)
// ============================================================

export class ForbiddenError extends AppError {
  constructor(message = "You do not have permission to access this resource.") {
    super(message, 403, "FORBIDDEN");
  }
}

// ============================================================
// HTTP 404 — Not Found
// ============================================================

export class NotFoundError extends AppError {
  constructor(message = "The requested resource was not found.") {
    super(message, 404, "NOT_FOUND");
  }
}

// ============================================================
// HTTP 409 — Conflict (e.g. duplicate email, username already taken)
// ============================================================

export class ConflictError extends AppError {
  constructor(message = "A conflict occurred with the current state of the resource.") {
    super(message, 409, "CONFLICT");
  }
}

// ============================================================
// HTTP 422 — Unprocessable Entity (valid syntax, invalid semantics)
// ============================================================

export class UnprocessableError extends AppError {
  constructor(message = "The request data could not be processed.") {
    super(message, 422, "UNPROCESSABLE_ENTITY");
  }
}
