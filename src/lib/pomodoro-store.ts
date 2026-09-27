import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { playChime } from "@/lib/chime";
import {
  clampMinutes,
  nextBlock,
  phaseDurationMs,
  type Phase,
} from "@/lib/pomodoro-logic";

export type RunState = "idle" | "running" | "paused";

export type Task = {
  id: string;
  title: string;
  done: boolean;
};

type PomodoroState = {
  phase: Phase;
  run: RunState;
  endsAt: number | null;
  remainingMs: number;
  focusMinutes: number;
  restMinutes: number;
  sessions: number;
  sound: boolean;
  tasks: Task[];
  setPhase: (phase: Phase) => void;
  setMinutes: (phase: Phase, minutes: number) => void;
  bumpMinutes: (phase: Phase, delta: number) => void;
  setSound: (sound: boolean) => void;
  start: () => void;
  pause: () => void;
  resetTimer: () => void;
  finishBlock: (opts?: { chime?: boolean }) => void;
  addTask: (title: string) => void;
  toggleTask: (id: string) => void;
  removeTask: (id: string) => void;
  clearSession: () => void;
};

const FOCUS_MINUTES = 25;
const REST_MINUTES = 5;

export const usePomodoro = create<PomodoroState>()(
  persist(
    (set, get) => ({
      phase: "focus",
      run: "idle",
      endsAt: null,
      remainingMs: FOCUS_MINUTES * 60_000,
      focusMinutes: FOCUS_MINUTES,
      restMinutes: REST_MINUTES,
      sessions: 0,
      sound: true,
      tasks: [],

      setPhase: (phase) => {
        const s = get();
        if (s.run === "running" || s.phase === phase) return;
        set({
          phase,
          run: "idle",
          endsAt: null,
          remainingMs: phaseDurationMs(phase, s.focusMinutes, s.restMinutes),
        });
      },

      setMinutes: (phase, minutes) => {
        const s = get();
        const clamped = clampMinutes(phase, minutes);
        const patch: Partial<PomodoroState> =
          phase === "focus" ? { focusMinutes: clamped } : { restMinutes: clamped };
        if (s.phase === phase && s.run !== "running") {
          patch.run = "idle";
          patch.endsAt = null;
          patch.remainingMs = clamped * 60_000;
        }
        set(patch);
      },

      bumpMinutes: (phase, delta) => {
        const s = get();
        const current = phase === "focus" ? s.focusMinutes : s.restMinutes;
        get().setMinutes(phase, current + delta);
      },

      setSound: (sound) => set({ sound }),

      start: () => {
        const s = get();
        if (s.run === "running") return;
        const total = phaseDurationMs(s.phase, s.focusMinutes, s.restMinutes);
        const ms = s.run === "paused" && s.remainingMs > 0 ? s.remainingMs : total;
        set({ run: "running", remainingMs: ms, endsAt: Date.now() + ms });
      },

      pause: () => {
        const s = get();
        if (s.run !== "running" || s.endsAt == null) return;
        set({
          run: "paused",
          remainingMs: Math.max(0, s.endsAt - Date.now()),
          endsAt: null,
        });
      },

      resetTimer: () => {
        const s = get();
        set({
          run: "idle",
          endsAt: null,
          remainingMs: phaseDurationMs(s.phase, s.focusMinutes, s.restMinutes),
        });
      },

      finishBlock: (opts) => {
        const s = get();
        if (s.run !== "running") return;
        if (opts?.chime && s.sound) playChime();
        set(nextBlock(s));
      },

      addTask: (title) => {
        const clean = title.trim().slice(0, 140);
        if (!clean) return;
        const s = get();
        if (s.tasks.length >= 40) return;
        set({
          tasks: [...s.tasks, { id: crypto.randomUUID(), title: clean, done: false }],
        });
      },

      toggleTask: (id) => {
        set({
          tasks: get().tasks.map((task) =>
            task.id === id ? { ...task, done: !task.done } : task,
          ),
        });
      },

      removeTask: (id) => {
        set({ tasks: get().tasks.filter((task) => task.id !== id) });
      },

      clearSession: () => {
        const s = get();
        set({
          phase: "focus",
          run: "idle",
          endsAt: null,
          remainingMs: s.focusMinutes * 60_000,
          sessions: 0,
          tasks: [],
        });
      },
    }),
    {
      name: "senda-pomodoro",
      version: 1,
      skipHydration: true,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        phase: s.phase,
        run: s.run,
        endsAt: s.endsAt,
        remainingMs: s.remainingMs,
        focusMinutes: s.focusMinutes,
        restMinutes: s.restMinutes,
        sessions: s.sessions,
        sound: s.sound,
        tasks: s.tasks,
      }),
    },
  ),
);
