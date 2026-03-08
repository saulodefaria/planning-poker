import { describe, it, expect } from "vitest";
import {
  createRoom,
  createParticipant,
  deduplicateName,
  validateName,
  validateVote,
  setVote,
  clearVote,
  revealVotes,
  restartRoom,
  calculateStats,
  findNearestFibonacci,
  serializeRoom,
} from "../room.js";
import { AppError } from "../errors.js";
import type { Room } from "../types.js";

function createTestRoom(): Room {
  return createRoom("r1", "Sprint Planning");
}

describe("deduplicateName", () => {
  it("returns name as-is when no duplicates", () => {
    expect(deduplicateName("Alice", ["Bob", "Charlie"])).toBe("Alice");
  });

  it("appends (2) on first duplicate", () => {
    expect(deduplicateName("Alice", ["Alice", "Bob"])).toBe("Alice (2)");
  });

  it("appends (3) when (2) exists", () => {
    expect(deduplicateName("Alice", ["Alice", "Alice (2)"])).toBe("Alice (3)");
  });

  it("skips own name during reconnect scenario", () => {
    expect(deduplicateName("Alice", ["Alice", "Bob"], "Alice")).toBe("Alice");
  });
});

describe("validateName", () => {
  it("trims and returns valid name", () => {
    expect(validateName("  Alice  ", 30)).toBe("Alice");
  });

  it("throws on empty name", () => {
    expect(() => validateName("   ", 30)).toThrow(AppError);
  });

  it("throws on too-long name", () => {
    expect(() => validateName("a".repeat(31), 30)).toThrow(AppError);
  });
});

describe("validateVote", () => {
  it("accepts valid votes", () => {
    expect(validateVote("5")).toBe("5");
    expect(validateVote("?")).toBe("?");
    expect(validateVote("89")).toBe("89");
  });

  it("rejects invalid votes", () => {
    expect(() => validateVote("4")).toThrow(AppError);
    expect(() => validateVote("")).toThrow(AppError);
    expect(() => validateVote("100")).toThrow(AppError);
  });
});

describe("setVote", () => {
  it("sets vote on participant", () => {
    const room = createTestRoom();
    room.participants.push(createParticipant("p1", "Alice"));

    setVote(room, "p1", "5");

    expect(room.participants[0].vote).toBe("5");
    expect(room.participants[0].hasVoted).toBe(true);
  });

  it("allows changing vote", () => {
    const room = createTestRoom();
    room.participants.push(createParticipant("p1", "Alice"));

    setVote(room, "p1", "5");
    setVote(room, "p1", "8");

    expect(room.participants[0].vote).toBe("8");
  });

  it("throws if room is revealed", () => {
    const room = createTestRoom();
    room.status = "revealed";
    room.participants.push(createParticipant("p1", "Alice"));

    expect(() => setVote(room, "p1", "5")).toThrow(AppError);
  });

  it("throws if participant not found", () => {
    const room = createTestRoom();
    expect(() => setVote(room, "unknown", "5")).toThrow(AppError);
  });
});

describe("clearVote", () => {
  it("clears an existing vote", () => {
    const room = createTestRoom();
    room.participants.push(createParticipant("p1", "Alice"));
    setVote(room, "p1", "5");

    clearVote(room, "p1");

    expect(room.participants[0].vote).toBeNull();
    expect(room.participants[0].hasVoted).toBe(false);
  });

  it("is a no-op when participant has not voted", () => {
    const room = createTestRoom();
    room.participants.push(createParticipant("p1", "Alice"));

    clearVote(room, "p1");

    expect(room.participants[0].vote).toBeNull();
    expect(room.participants[0].hasVoted).toBe(false);
  });

  it("throws if room is revealed", () => {
    const room = createTestRoom();
    room.status = "revealed";
    room.participants.push(createParticipant("p1", "Alice"));

    expect(() => clearVote(room, "p1")).toThrow(AppError);
  });

  it("throws if participant not found", () => {
    const room = createTestRoom();
    expect(() => clearVote(room, "unknown")).toThrow(AppError);
  });
});

describe("revealVotes", () => {
  it("sets status to revealed", () => {
    const room = createTestRoom();
    revealVotes(room);
    expect(room.status).toBe("revealed");
  });

  it("throws if already revealed", () => {
    const room = createTestRoom();
    room.status = "revealed";
    expect(() => revealVotes(room)).toThrow(AppError);
  });
});

describe("restartRoom", () => {
  it("increments round and clears votes", () => {
    const room = createTestRoom();
    room.participants.push(createParticipant("p1", "Alice"));
    setVote(room, "p1", "5");
    revealVotes(room);

    restartRoom(room);

    expect(room.status).toBe("voting");
    expect(room.round).toBe(2);
    expect(room.participants[0].vote).toBeNull();
    expect(room.participants[0].hasVoted).toBe(false);
  });

  it("throws if not revealed", () => {
    const room = createTestRoom();
    expect(() => restartRoom(room)).toThrow(AppError);
  });
});

describe("calculateStats", () => {
  function roomWithVotes(votes: (string | null)[]): Room {
    const room = createTestRoom();
    room.status = "revealed";
    votes.forEach((v, i) => {
      const p = createParticipant(`p${i}`, `User${i}`);
      if (v !== null) {
        p.vote = v as any;
        p.hasVoted = true;
      }
      room.participants.push(p);
    });
    return room;
  }

  it("calculates average ignoring ?", () => {
    const stats = calculateStats(roomWithVotes(["3", "5", "?"]));
    expect(stats.average).toBe(4);
    expect(stats.nearestFibonacci).toBe(3);
  });

  it("returns null average when only ? votes", () => {
    const stats = calculateStats(roomWithVotes(["?", "?"]));
    expect(stats.average).toBeNull();
    expect(stats.nearestFibonacci).toBeNull();
  });

  it("returns null average when no votes", () => {
    const stats = calculateStats(roomWithVotes([null, null]));
    expect(stats.average).toBeNull();
  });

  it("groups votes in deck order", () => {
    const stats = calculateStats(roomWithVotes(["5", "3", "5", "?"]));
    expect(stats.groupedVotes).toEqual([
      { vote: "?", count: 1 },
      { vote: "3", count: 1 },
      { vote: "5", count: 2 },
    ]);
  });

  it("calculates average with one decimal", () => {
    const stats = calculateStats(roomWithVotes(["3", "5", "8"]));
    // (3+5+8)/3 = 5.333...
    expect(stats.average).toBe(5.3);
  });
});

describe("findNearestFibonacci", () => {
  it("returns exact match", () => {
    expect(findNearestFibonacci(5)).toBe(5);
  });

  it("returns closest value", () => {
    expect(findNearestFibonacci(4)).toBe(3);
    expect(findNearestFibonacci(6)).toBe(5);
  });

  it("returns lower value when equidistant", () => {
    // 4 is equidistant between 3 and 5 -> choose lower (3)
    expect(findNearestFibonacci(4)).toBe(3);
  });

  it("handles edge cases", () => {
    expect(findNearestFibonacci(1)).toBe(1);
    expect(findNearestFibonacci(89)).toBe(89);
    expect(findNearestFibonacci(100)).toBe(89);
  });
});

describe("serializeRoom", () => {
  it("hides votes during voting", () => {
    const room = createTestRoom();
    room.participants.push(createParticipant("p1", "Alice"));
    setVote(room, "p1", "5");

    const serialized = serializeRoom(room);

    expect(serialized.participants[0].vote).toBeNull();
    expect(serialized.participants[0].hasVoted).toBe(true);
    expect(serialized.stats).toBeNull();
  });

  it("shows votes after reveal", () => {
    const room = createTestRoom();
    room.participants.push(createParticipant("p1", "Alice"));
    setVote(room, "p1", "5");
    revealVotes(room);

    const serialized = serializeRoom(room);

    expect(serialized.participants[0].vote).toBe("5");
    expect(serialized.stats).not.toBeNull();
  });
});
