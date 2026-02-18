export default class ServerError extends Error {
  code: string;
  httpStatus: number;

  constructor(code: string, message: string, httpStatus: number = 500) {
    super(message);
    this.code = code;
    this.httpStatus = httpStatus;

    Error.captureStackTrace(this, this.constructor);
  }
}
