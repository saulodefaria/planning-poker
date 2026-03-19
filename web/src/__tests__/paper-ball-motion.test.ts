import { describe, expect, it } from "vitest";
import {
  advancePaperBallMotion,
  createPaperBallMotionState,
  PAPER_BALL_RADIUS_PX,
  type PaperBallMotionState,
} from "../paper-ball-motion";

const bounds = { width: 48, height: 68 };

describe("paper ball motion", () => {
  it("starts fully outside the card on the selected side", () => {
    const leftStart = createPaperBallMotionState("left", bounds);
    const rightStart = createPaperBallMotionState("right", bounds);

    expect(leftStart.x).toBeLessThan(-PAPER_BALL_RADIUS_PX);
    expect(leftStart.vx).toBeGreaterThan(0);
    expect(rightStart.x).toBeGreaterThan(bounds.width + PAPER_BALL_RADIUS_PX);
    expect(rightStart.vx).toBeLessThan(0);
  });

  it("bounces off the external wall of the card", () => {
    const state: PaperBallMotionState = {
      x: -PAPER_BALL_RADIUS_PX - 6,
      y: 22,
      vx: 255,
      vy: -10,
      rotation: 0,
    };

    const nextState = advancePaperBallMotion(state, bounds, 0.03);

    expect(nextState.x).toBeLessThanOrEqual(-PAPER_BALL_RADIUS_PX);
    expect(nextState.vx).toBeLessThan(0);
  });

  it("bounces off the external wall when coming from the right", () => {
    const state: PaperBallMotionState = {
      x: bounds.width + PAPER_BALL_RADIUS_PX + 6,
      y: 22,
      vx: -255,
      vy: -10,
      rotation: 0,
    };

    const nextState = advancePaperBallMotion(state, bounds, 0.03);

    expect(nextState.x).toBeGreaterThanOrEqual(bounds.width + PAPER_BALL_RADIUS_PX);
    expect(nextState.vx).toBeGreaterThan(0);
  });

  it("falls to the card bottom level and bounces there", () => {
    const groundY = bounds.height - PAPER_BALL_RADIUS_PX;
    let state: PaperBallMotionState = {
      x: -18,
      y: 26,
      vx: -140,
      vy: 380,
      rotation: 0,
    };

    let didBounceOnGround = false;

    for (let step = 0; step < 12; step += 1) {
      state = advancePaperBallMotion(state, bounds, 0.03);

      if (state.y <= groundY && state.vy < 0) {
        didBounceOnGround = true;
        break;
      }
    }

    expect(didBounceOnGround).toBe(true);
  });

  it("keeps moving in the same horizontal direction after a floor bounce", () => {
    const groundY = bounds.height - PAPER_BALL_RADIUS_PX;
    const state: PaperBallMotionState = {
      x: 18,
      y: groundY - 1,
      vx: -140,
      vy: 320,
      rotation: 0,
    };

    const nextState = advancePaperBallMotion(state, bounds, 0.08);

    expect(nextState.y).toBeLessThanOrEqual(groundY);
    expect(nextState.vx).toBeLessThan(0);
    expect(nextState.vy).toBeLessThan(0);
  });

  it("never falls below the card bottom even on large steps", () => {
    const groundY = bounds.height - PAPER_BALL_RADIUS_PX;
    const state: PaperBallMotionState = {
      x: -10,
      y: 10,
      vx: -180,
      vy: 620,
      rotation: 0,
    };

    const nextState = advancePaperBallMotion(state, bounds, 0.3);

    expect(nextState.y).toBeLessThanOrEqual(groundY);
  });
});
