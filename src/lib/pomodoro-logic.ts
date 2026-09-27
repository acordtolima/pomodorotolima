export type Phase = "focus" | "rest";

const LIMITS: Record<Phase, { min: number; max: number }> = {
  focus: { min: 1, max: 90 },
  rest: { min: 1, max: 45 },
};

export function clampMinutes(phase: Phase, minutes: number) {
  const { min, max } = LIMITS[phase];
  const rounded = Math.round(minutes);
  if (!Number.isFinite(rounded)) return min;
  return Math.min(max, Math.max(min, rounded));
}

export function phaseDurationMs(phase: Phase, focusMinutes: number, restMinutes: number) {
  return (phase === "focus" ? focusMinutes : restMinutes) * 60_000;
}

export function nextBlock(input: {
  phase: Phase;
  focusMinutes: number;
  restMinutes: number;
  sessions: number;
}) {
  const finishedFocus = input.phase === "focus";
  const phase: Phase = finishedFocus ? "rest" : "focus";
  return {
    phase,
    run: "idle" as const,
    endsAt: null,
    remainingMs: phaseDurationMs(phase, input.focusMinutes, input.restMinutes),
    sessions: finishedFocus ? input.sessions + 1 : input.sessions,
  };
}
