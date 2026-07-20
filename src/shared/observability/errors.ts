export class AccessDeniedError extends Error {
  readonly status = 403;

  constructor(message = "Access denied.") {
    super(message);
    this.name = "AccessDeniedError";
  }
}

export class ResourceNotFoundError extends Error {
  readonly status = 404;

  constructor(message = "Resource not found.") {
    super(message);
    this.name = "ResourceNotFoundError";
  }
}

export function isAccessDeniedError(error: unknown): error is AccessDeniedError {
  return error instanceof AccessDeniedError;
}

export function isResourceNotFoundError(error: unknown): error is ResourceNotFoundError {
  return error instanceof ResourceNotFoundError;
}
