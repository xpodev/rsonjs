export class RSONError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RSONError";
  }
}

export class RSONParseError extends RSONError {
  constructor(message: string) {
    super(message);
    this.name = "RSONParseError";
  }
}

