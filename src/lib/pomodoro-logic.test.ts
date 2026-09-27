import assert from "node:assert/strict";
import test from "node:test";
import { clampMinutes, nextBlock } from "./pomodoro-logic.ts";
import { formatClock } from "./time.ts";

test("finishing focus opens rest and counts the session", () => {
  const next = nextBlock({
    phase: "focus",
    focusMinutes: 25,
    restMinutes: 5,
    sessions: 2,
  });
  assert.equal(next.phase, "rest");
  assert.equal(next.run, "idle");
  assert.equal(next.sessions, 3);
  assert.equal(next.remainingMs, 5 * 60_000);
  assert.equal(next.endsAt, null);
});

test("finishing rest returns to focus without counting", () => {
  const next = nextBlock({
    phase: "rest",
    focusMinutes: 40,
    restMinutes: 10,
    sessions: 3,
  });
  assert.equal(next.phase, "focus");
  assert.equal(next.sessions, 3);
  assert.equal(next.remainingMs, 40 * 60_000);
});

test("durations stay inside a calm range", () => {
  assert.equal(clampMinutes("focus", 0), 1);
  assert.equal(clampMinutes("focus", 99), 90);
  assert.equal(clampMinutes("focus", 24.6), 25);
  assert.equal(clampMinutes("rest", 3.2), 3);
  assert.equal(clampMinutes("rest", 80), 45);
  assert.equal(clampMinutes("focus", Number.NaN), 1);
});

test("the clock rounds up so a full block starts intact", () => {
  assert.equal(formatClock(25 * 60_000), "25:00");
  assert.equal(formatClock(0), "00:00");
  assert.equal(formatClock(1000), "00:01");
  assert.equal(formatClock(1), "00:01");
  assert.equal(formatClock(61_000), "01:01");
});
