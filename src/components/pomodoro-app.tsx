import { useEffect, useRef, useState, type FormEvent } from "react";
import * as Switch from "@radix-ui/react-switch";
import { Check, Minus, Pause, Play, Plus, RotateCcw, Trash2 } from "lucide-react";
import { playChime, unlockAudio } from "@/lib/chime";
import { cn } from "@/lib/cn";
import { phaseDurationMs, type Phase } from "@/lib/pomodoro-logic";
import { usePomodoro, type RunState } from "@/lib/pomodoro-store";
import { formatClock, speakClock } from "@/lib/time";
import { ProgressRing } from "@/components/progress-ring";

const FOCUS_PRESETS = [15, 25, 50];
const REST_PRESETS = [5, 10, 15];

function statusLabel(phase: Phase, run: RunState) {
  if (run === "paused") return "En pausa";
  if (phase === "focus" && run === "running") return "En foco";
  if (phase === "rest" && run === "running") return "En descanso";
  if (phase === "rest") return "Descanso listo";
  return "Listo";
}

function openLabel(count: number) {
  return count === 1 ? "1 abierta" : `${count} abiertas`;
}

export function PomodoroApp() {
  const phase = usePomodoro((s) => s.phase);
  const run = usePomodoro((s) => s.run);
  const endsAt = usePomodoro((s) => s.endsAt);
  const remainingMs = usePomodoro((s) => s.remainingMs);
  const focusMinutes = usePomodoro((s) => s.focusMinutes);
  const restMinutes = usePomodoro((s) => s.restMinutes);
  const sessions = usePomodoro((s) => s.sessions);
  const sound = usePomodoro((s) => s.sound);
  const tasks = usePomodoro((s) => s.tasks);
  const setPhase = usePomodoro((s) => s.setPhase);
  const bumpMinutes = usePomodoro((s) => s.bumpMinutes);
  const setMinutes = usePomodoro((s) => s.setMinutes);
  const setSound = usePomodoro((s) => s.setSound);
  const start = usePomodoro((s) => s.start);
  const pause = usePomodoro((s) => s.pause);
  const resetTimer = usePomodoro((s) => s.resetTimer);
  const addTask = usePomodoro((s) => s.addTask);
  const toggleTask = usePomodoro((s) => s.toggleTask);
  const removeTask = usePomodoro((s) => s.removeTask);
  const clearSession = usePomodoro((s) => s.clearSession);

  const [now, setNow] = useState(0);
  const [draft, setDraft] = useState("");
  const [confirmClear, setConfirmClear] = useState(false);
  const lastNow = useRef(0);

  useEffect(() => {
    void usePomodoro.persist.rehydrate();
    setNow(Date.now());
  }, []);

  useEffect(() => {
    if (run !== "running") return;
    const tick = () => setNow(Date.now());
    tick();
    const id = window.setInterval(tick, 200);
    document.addEventListener("visibilitychange", tick);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [run]);

  useEffect(() => {
    if (run !== "running" || endsAt == null || now <= 0) return;
    if (now >= endsAt) {
      const crossed = lastNow.current > 0 && lastNow.current < endsAt;
      usePomodoro.getState().finishBlock({ chime: crossed });
    }
    lastNow.current = now;
  }, [now, run, endsAt]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.code !== "Space") return;
      const target = event.target;
      if (
        target instanceof HTMLElement &&
        target.closest("input, textarea, button, a, [role='switch']")
      ) {
        return;
      }
      event.preventDefault();
      const s = usePomodoro.getState();
      if (s.run === "running") s.pause();
      else {
        unlockAudio();
        s.start();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const total = phaseDurationMs(phase, focusMinutes, restMinutes);
  const remaining =
    run === "running" && endsAt != null && typeof window !== "undefined"
      ? Math.max(0, endsAt - (now || Date.now()))
      : remainingMs;
  const progress = total > 0 ? 1 - Math.min(total, remaining) / total : 0;
  const clock = formatClock(remaining);
  const status = statusLabel(phase, run);
  const current = tasks.find((task) => !task.done) ?? null;
  const openCount = tasks.reduce((count, task) => count + (task.done ? 0 : 1), 0);
  const filledPips = sessions === 0 ? 0 : sessions % 4 === 0 ? 4 : sessions % 4;
  const canClear = sessions > 0 || tasks.length > 0;
  const locked = run === "running";

  useEffect(() => {
    const phaseName = phase === "focus" ? "Foco" : "Descanso";
    document.title = run === "running" ? `${clock} · ${phaseName} — Senda` : "Senda";
  }, [clock, phase, run]);

  function onPrimary() {
    if (run === "running") {
      pause();
      return;
    }
    unlockAudio();
    start();
  }

  function onAdd(event: FormEvent) {
    event.preventDefault();
    addTask(draft);
    setDraft("");
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-5xl flex-col px-5 py-6 sm:px-8 sm:py-10">
      <header className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <span
            className="grid size-11 shrink-0 place-items-center rounded-full border border-line bg-surface text-focus"
            aria-hidden="true"
          >
            <svg viewBox="0 0 32 32" className="size-6">
              <circle cx="16" cy="16" r="10" fill="none" stroke="currentColor" strokeWidth="3" />
              <circle
                cx="16"
                cy="16"
                r="10"
                fill="none"
                className="stroke-rest"
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray="18 64"
                transform="rotate(-90 16 16)"
              />
            </svg>
          </span>
          <div className="min-w-0">
            <h1 className="font-display text-3xl leading-none sm:text-4xl">Senda</h1>
            <p className="mt-1 text-sm text-pretty text-muted">Un tramo cada vez.</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <span id="sound-label" className="text-sm text-muted">
            Sonido
          </span>
          <Switch.Root
            checked={sound}
            onCheckedChange={(checked) => {
              setSound(checked);
              if (checked) {
                unlockAudio();
                playChime();
              }
            }}
            aria-labelledby="sound-label"
            className="relative h-11 w-16 overflow-hidden rounded-full bg-line p-1 transition-colors duration-200 data-[state=checked]:bg-focus"
          >
            <Switch.Thumb className="block size-9 rounded-full border border-line bg-surface transition-transform duration-200 data-[state=checked]:translate-x-5 data-[state=checked]:border-focus" />
          </Switch.Root>
        </div>
      </header>

      <div className="mt-8 grid w-full min-w-0 grid-cols-1 items-start gap-8 lg:mt-12 lg:grid-cols-[minmax(0,1.15fr)_minmax(18rem,24rem)] lg:gap-14">
        <section className="flex w-full min-w-0 flex-col items-center lg:pt-2" aria-label="Temporizador">
          <div className="inline-flex rounded-full border border-line bg-surface p-1">
            <PhaseTab
              active={phase === "focus"}
              disabled={locked}
              onClick={() => setPhase("focus")}
              tone="focus"
            >
              Foco
            </PhaseTab>
            <PhaseTab
              active={phase === "rest"}
              disabled={locked}
              onClick={() => setPhase("rest")}
              tone="rest"
            >
              Descanso
            </PhaseTab>
          </div>

          <div className="mt-6">
            <ProgressRing
              progress={progress}
              phase={phase}
              label={phase === "focus" ? "Progreso del foco" : "Progreso del descanso"}
            >
              <p
                role="timer"
                aria-label={`${speakClock(remaining)} restantes`}
                className="font-display text-5xl leading-none tabular-nums sm:text-6xl"
              >
                {clock}
              </p>
            </ProgressRing>
          </div>

          <p
            aria-live="polite"
            className={cn(
              "mt-4 inline-flex h-9 items-center gap-2 rounded-full px-3 text-sm font-medium",
              run === "running" && phase === "focus" && "bg-focus-soft text-focus",
              run === "running" && phase === "rest" && "bg-rest-soft text-rest",
              run === "paused" && "bg-surface text-ink",
              run === "idle" && "text-muted",
            )}
          >
            {run === "running" ? (
              <span className="pip-live size-1.5 rounded-full bg-current" aria-hidden="true" />
            ) : null}
            {status}
          </p>

          {current ? (
            <p className="mt-3 w-full max-w-sm truncate px-2 text-center text-sm text-muted">
              Ahora · {current.title}
            </p>
          ) : null}

          <div className="mt-6 grid w-full max-w-sm grid-cols-2 gap-3">
            <button
              type="button"
              onClick={onPrimary}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-focus px-4 text-sm font-medium text-on-accent transition-opacity duration-200 active:opacity-80"
            >
              {run === "running" ? (
                <Pause className="size-4" aria-hidden="true" />
              ) : (
                <Play className="size-4" aria-hidden="true" />
              )}
              {run === "running" ? "Pausar" : run === "paused" ? "Reanudar" : "Iniciar"}
            </button>
            <button
              type="button"
              onClick={resetTimer}
              disabled={run === "idle"}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-line bg-surface px-4 text-sm font-medium text-ink transition-opacity duration-200 active:opacity-80 disabled:opacity-40"
            >
              <RotateCcw className="size-4" aria-hidden="true" />
              Reiniciar
            </button>
          </div>

          <div className="mt-8 w-full max-w-sm">
            <div className="mb-3 flex items-baseline justify-between gap-3">
              <h2 className="text-sm font-medium">Duraciones</h2>
              {locked ? <p className="text-sm text-muted">Pausa para editar</p> : null}
            </div>
            <DurationRow
              label="Foco"
              phase="focus"
              minutes={focusMinutes}
              presets={FOCUS_PRESETS}
              locked={locked}
              onPreset={(minutes) => setMinutes("focus", minutes)}
              onBump={(delta) => bumpMinutes("focus", delta)}
            />
            <div className="mt-4">
              <DurationRow
                label="Descanso"
                phase="rest"
                minutes={restMinutes}
                presets={REST_PRESETS}
                locked={locked}
                onPreset={(minutes) => setMinutes("rest", minutes)}
                onBump={(delta) => bumpMinutes("rest", delta)}
              />
            </div>
          </div>
        </section>

        <aside className="flex w-full min-w-0 flex-col gap-6 rounded-3xl border border-line bg-surface p-5 sm:p-6">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-sm font-medium text-muted">Sesiones de foco</h2>
              <p className="mt-1 font-display text-4xl leading-none tabular-nums">{sessions}</p>
            </div>
            <div className="flex gap-2 pb-1" aria-hidden="true">
              {[0, 1, 2, 3].map((index) => (
                <span
                  key={index}
                  className={cn(
                    "size-3.5 rounded-full",
                    index < filledPips ? "bg-focus" : "border border-line",
                  )}
                />
              ))}
            </div>
          </div>

          <div className="h-px bg-line" />

          <div>
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="font-display text-2xl leading-none">Esta sesión</h2>
              <p className="text-sm text-muted">{openLabel(openCount)}</p>
            </div>

            <form onSubmit={onAdd} className="mt-4 flex min-w-0 gap-2">
              <input
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder="Escribe una tarea"
                aria-label="Nueva tarea"
                maxLength={140}
                enterKeyHint="done"
                className="h-12 min-w-0 flex-1 rounded-full border border-line bg-bg px-4 text-base text-ink placeholder:text-muted"
              />
              <button
                type="submit"
                disabled={draft.trim().length === 0}
                className="h-12 shrink-0 rounded-full bg-ink px-4 text-sm font-medium text-on-accent transition-opacity duration-200 active:opacity-80 disabled:opacity-40"
              >
                Añadir
              </button>
            </form>

            {tasks.length === 0 ? (
              <p className="px-2 py-6 text-center text-sm text-pretty text-muted">
                Nada en la lista. Añade lo que quieres cerrar en este tramo.
              </p>
            ) : (
              <ul className="mt-3 max-h-80 overflow-y-auto">
                {tasks.map((task) => {
                  const isCurrent = current?.id === task.id;
                  return (
                    <li key={task.id} className="flex items-center border-b border-line last:border-b-0">
                      <button
                        type="button"
                        onClick={() => toggleTask(task.id)}
                        className="flex min-h-12 min-w-0 flex-1 items-center gap-3 py-2 text-left"
                        aria-pressed={task.done}
                        aria-label={isCurrent ? `Ahora, ${task.title}` : task.title}
                      >
                        <span
                          className={cn(
                            "grid size-6 shrink-0 place-items-center rounded-full border",
                            task.done
                              ? "border-focus bg-focus text-on-accent"
                              : "border-line bg-bg",
                          )}
                          aria-hidden="true"
                        >
                          {task.done ? <Check className="size-3.5" /> : null}
                        </span>
                        <span
                          className={cn(
                            "min-w-0 text-base wrap-break-word",
                            task.done && "text-muted line-through",
                          )}
                        >
                          {isCurrent ? (
                            <span className="mr-2 text-sm font-medium text-focus">Ahora</span>
                          ) : null}
                          {task.title}
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => removeTask(task.id)}
                        aria-label={`Eliminar ${task.title}`}
                        className="grid size-11 shrink-0 place-items-center text-muted"
                      >
                        <Trash2 className="size-4" aria-hidden="true" />
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {confirmClear ? (
            <div className="rounded-2xl bg-rest-soft p-3">
              <p className="text-sm text-pretty text-ink">
                Se vacía la lista y el conteo vuelve a cero. Las duraciones se quedan.
              </p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmClear(false)}
                  className="h-11 rounded-full border border-line bg-surface text-sm font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    clearSession();
                    setConfirmClear(false);
                  }}
                  className="h-11 rounded-full bg-rest text-sm font-medium text-on-accent"
                >
                  Vaciar
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmClear(true)}
              disabled={!canClear}
              className="h-11 rounded-full text-sm text-muted disabled:opacity-40"
            >
              Nueva sesión
            </button>
          )}
        </aside>
      </div>
    </main>
  );
}

function PhaseTab({
  active,
  disabled,
  onClick,
  tone,
  children,
}: {
  active: boolean;
  disabled: boolean;
  onClick: () => void;
  tone: Phase;
  children: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "h-11 min-w-24 rounded-full px-4 text-sm font-medium transition-colors duration-200 disabled:opacity-100",
        active && tone === "focus" && "bg-focus text-on-accent",
        active && tone === "rest" && "bg-rest text-on-accent",
        !active && "text-muted",
        disabled && !active && "text-muted",
      )}
    >
      {children}
    </button>
  );
}

function DurationRow({
  label,
  phase,
  minutes,
  presets,
  locked,
  onPreset,
  onBump,
}: {
  label: string;
  phase: Phase;
  minutes: number;
  presets: number[];
  locked: boolean;
  onPreset: (minutes: number) => void;
  onBump: (delta: number) => void;
}) {
  const max = phase === "focus" ? 90 : 45;
  return (
    <div>
      <p className="mb-2 text-sm font-medium">
        {label} <span className="font-normal text-muted">min</span>
      </p>
      <div className="flex min-w-0 flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          {presets.map((preset) => (
            <button
              key={preset}
              type="button"
              aria-pressed={minutes === preset}
              aria-label={`${preset} minutos de ${label.toLowerCase()}`}
              disabled={locked}
              onClick={() => onPreset(preset)}
              className={cn(
                "h-11 min-w-11 rounded-full px-3 text-sm font-medium tabular-nums",
                minutes === preset
                  ? "bg-ink text-on-accent"
                  : "border border-line bg-surface text-ink",
                "disabled:opacity-40",
              )}
            >
              {preset}
            </button>
          ))}
        </div>
        <div className="flex items-center">
          <button
            type="button"
            aria-label={`Quitar un minuto de ${label.toLowerCase()}`}
            disabled={locked || minutes <= 1}
            onClick={() => onBump(-1)}
            className="grid size-11 place-items-center rounded-full border border-line bg-surface disabled:opacity-40"
          >
            <Minus className="size-4" aria-hidden="true" />
          </button>
          <span className="w-10 text-center text-sm font-medium tabular-nums">{minutes}</span>
          <button
            type="button"
            aria-label={`Sumar un minuto de ${label.toLowerCase()}`}
            disabled={locked || minutes >= max}
            onClick={() => onBump(1)}
            className="grid size-11 place-items-center rounded-full border border-line bg-surface disabled:opacity-40"
          >
            <Plus className="size-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}
