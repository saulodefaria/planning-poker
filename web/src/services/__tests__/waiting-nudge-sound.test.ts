import { afterEach, describe, expect, it, vi } from "vitest";
import { playWaitingNudgeSound } from "../waiting-nudge-sound";

describe("playWaitingNudgeSound", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("prefers the repo-backed waiting nudge asset", async () => {
    const play = vi.fn().mockResolvedValue(undefined);

    class MockAudio {
      currentTime = 1.5;
      preload = "";
      src: string;
      volume = 1;

      constructor(src: string) {
        this.src = src;
      }

      play = play;
    }

    vi.stubGlobal("Audio", MockAudio as unknown as typeof Audio);

    await playWaitingNudgeSound();

    expect(play).toHaveBeenCalledTimes(1);
    const instance = play.mock.instances[0] as MockAudio;
    expect(instance.src).toBe("/sounds/waiting-nudge.wav");
    expect(instance.preload).toBe("auto");
    expect(instance.volume).toBe(0.8);
    expect(instance.currentTime).toBe(0);
  });
});
