import type { ThrowSide } from "./types";

export const PAPER_BALL_ANIMATION_MS = 1000;
export const PAPER_BALL_SIZE_PX = 12;
export const PAPER_BALL_RADIUS_PX = PAPER_BALL_SIZE_PX / 2;

const GRAVITY_PX_PER_SECOND = 1480;
const WALL_BOUNCE_DAMPING = 0.76;
const FLOOR_BOUNCE_DAMPING = 0.5;
const FLOOR_SLIDE_DAMPING = 0.94;
const MIN_FLOOR_BOUNCE_SPEED = 34;
const MAX_STEP_SECONDS = 1 / 120;
const SIDE_ENTRY_OFFSET_PX = 28;
const START_HEIGHT_RATIO = 0.32;
const START_HORIZONTAL_SPEED_PX_PER_SECOND = 255;
const START_VERTICAL_SPEED_PX_PER_SECOND = -40;

export interface PaperBallBounds {
  width: number;
  height: number;
}

export interface PaperBallMotionState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
}

export function createPaperBallMotionState(side: ThrowSide, bounds: PaperBallBounds): PaperBallMotionState {
  const groundY = getGroundY(bounds);
  const startY = Math.max(PAPER_BALL_RADIUS_PX, groundY * START_HEIGHT_RATIO);
  const sideOffset = SIDE_ENTRY_OFFSET_PX + PAPER_BALL_RADIUS_PX;

  return {
    x: side === "left" ? -sideOffset : bounds.width + sideOffset,
    y: startY,
    vx: side === "left" ? START_HORIZONTAL_SPEED_PX_PER_SECOND : -START_HORIZONTAL_SPEED_PX_PER_SECOND,
    vy: START_VERTICAL_SPEED_PX_PER_SECOND,
    rotation: side === "left" ? -24 : 24,
  };
}

export function advancePaperBallMotion(
  initialState: PaperBallMotionState,
  bounds: PaperBallBounds,
  deltaSeconds: number,
): PaperBallMotionState {
  if (deltaSeconds <= 0) {
    return initialState;
  }

  let nextState = initialState;
  let remainingSeconds = deltaSeconds;

  while (remainingSeconds > 0) {
    const stepSeconds = Math.min(remainingSeconds, MAX_STEP_SECONDS);
    nextState = stepPaperBallMotion(nextState, bounds, stepSeconds);
    remainingSeconds -= stepSeconds;
  }

  return nextState;
}

function stepPaperBallMotion(
  state: PaperBallMotionState,
  bounds: PaperBallBounds,
  deltaSeconds: number,
): PaperBallMotionState {
  const leftWallX = -PAPER_BALL_RADIUS_PX;
  const rightWallX = bounds.width + PAPER_BALL_RADIUS_PX;
  const groundY = getGroundY(bounds);
  let vx = state.vx;
  let vy = state.vy + GRAVITY_PX_PER_SECOND * deltaSeconds;
  let x = state.x + vx * deltaSeconds;
  let y = state.y + vy * deltaSeconds;
  let rotation = state.rotation + vx * deltaSeconds * 0.28;

  if (state.x < leftWallX && x >= leftWallX && vx > 0) {
    x = leftWallX;
    vx = Math.abs(vx) * WALL_BOUNCE_DAMPING;
    vx *= -1;
    rotation *= -0.8;
  } else if (state.x > rightWallX && x <= rightWallX && vx < 0) {
    x = rightWallX;
    vx = Math.abs(vx) * WALL_BOUNCE_DAMPING;
    rotation *= -0.8;
  }

  if (y >= groundY && vy > 0) {
    y = groundY;
    vy = -Math.max(Math.abs(vy) * FLOOR_BOUNCE_DAMPING, MIN_FLOOR_BOUNCE_SPEED);
    vx *= FLOOR_SLIDE_DAMPING;
  }

  return {
    x,
    y,
    vx,
    vy,
    rotation,
  };
}

function getGroundY(bounds: PaperBallBounds) {
  return Math.max(PAPER_BALL_RADIUS_PX, bounds.height - PAPER_BALL_RADIUS_PX);
}
