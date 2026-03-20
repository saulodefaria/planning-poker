export type ErrorCode =
  | "ROOM_NOT_FOUND"
  | "ROOM_FULL"
  | "INVALID_NAME"
  | "INVALID_VOTE"
  | "PARTICIPANT_NOT_FOUND"
  | "INVALID_STATE"
  | "TICKET_EXISTS"
  | "TICKET_NOT_FOUND"
  | "INVALID_TICKET_URL";

export class AppError extends Error {
  constructor(
    public readonly code: ErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "AppError";
  }
}
