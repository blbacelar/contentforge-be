export class BaseError extends Error {
  constructor(message: string, public code: number) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class HTTPError extends BaseError {
  constructor(message: string, public statusCode: number) {
    super(message, statusCode);
  }
}

export class NotFoundError extends HTTPError {
  constructor(resource: string) {
    super(`${resource} not found`, 404);
  }
}

export class AuthError extends HTTPError {
  constructor() {
    super("Unauthorized access", 401);
  }
} 