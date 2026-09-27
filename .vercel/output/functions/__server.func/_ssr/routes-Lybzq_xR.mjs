import { i as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { n as require_jsx_runtime } from "../_libs/radix-ui__react-context+react.mjs";
import { a as Play, c as Check, i as Plus, n as Trash2, o as Pause, r as RotateCcw, s as Minus } from "../_libs/lucide-react.mjs";
import { n as SwitchThumb, t as Switch } from "../_libs/@radix-ui/react-switch+[...].mjs";
import { t as clsx } from "../_libs/clsx.mjs";
import { t as twMerge } from "../_libs/tailwind-merge.mjs";
import { n as persist, r as create, t as createJSONStorage } from "../_libs/zustand.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-Lybzq_xR.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var audio = null;
function context() {
	if (typeof window === "undefined") return null;
	const Ctx = window.AudioContext || window.webkitAudioContext;
	if (!Ctx) return null;
	if (!audio) audio = new Ctx();
	return audio;
}
function unlockAudio() {
	const ctx = context();
	if (ctx && ctx.state === "suspended") ctx.resume();
}
function tone(ctx, freq, when, duration, peak) {
	const osc = ctx.createOscillator();
	const gain = ctx.createGain();
	osc.type = "sine";
	osc.frequency.setValueAtTime(freq, when);
	gain.gain.setValueAtTime(1e-4, when);
	gain.gain.exponentialRampToValueAtTime(peak, when + .03);
	gain.gain.exponentialRampToValueAtTime(1e-4, when + duration);
	osc.connect(gain);
	gain.connect(ctx.destination);
	osc.start(when);
	osc.stop(when + duration + .02);
}
function playChime() {
	try {
		const ctx = context();
		if (!ctx) return;
		if (ctx.state === "suspended") ctx.resume();
		const now = ctx.currentTime + .02;
		tone(ctx, 329.63, now, .7, .025);
		tone(ctx, 659.25, now, .55, .05);
		tone(ctx, 880, now + .16, .7, .04);
	} catch {}
}
function cn(...inputs) {
	return twMerge(clsx(inputs));
}
var LIMITS = {
	focus: {
		min: 1,
		max: 90
	},
	rest: {
		min: 1,
		max: 45
	}
};
function clampMinutes(phase, minutes) {
	const { min, max } = LIMITS[phase];
	const rounded = Math.round(minutes);
	if (!Number.isFinite(rounded)) return min;
	return Math.min(max, Math.max(min, rounded));
}
function phaseDurationMs(phase, focusMinutes, restMinutes) {
	return (phase === "focus" ? focusMinutes : restMinutes) * 6e4;
}
function nextBlock(input) {
	const finishedFocus = input.phase === "focus";
	const phase = finishedFocus ? "rest" : "focus";
	return {
		phase,
		run: "idle",
		endsAt: null,
		remainingMs: phaseDurationMs(phase, input.focusMinutes, input.restMinutes),
		sessions: finishedFocus ? input.sessions + 1 : input.sessions
	};
}
var FOCUS_MINUTES = 25;
var REST_MINUTES = 5;
var usePomodoro = create()(persist((set, get) => ({
	phase: "focus",
	run: "idle",
	endsAt: null,
	remainingMs: FOCUS_MINUTES * 6e4,
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
			remainingMs: phaseDurationMs(phase, s.focusMinutes, s.restMinutes)
		});
	},
	setMinutes: (phase, minutes) => {
		const s = get();
		const clamped = clampMinutes(phase, minutes);
		const patch = phase === "focus" ? { focusMinutes: clamped } : { restMinutes: clamped };
		if (s.phase === phase && s.run !== "running") {
			patch.run = "idle";
			patch.endsAt = null;
			patch.remainingMs = clamped * 6e4;
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
		set({
			run: "running",
			remainingMs: ms,
			endsAt: Date.now() + ms
		});
	},
	pause: () => {
		const s = get();
		if (s.run !== "running" || s.endsAt == null) return;
		set({
			run: "paused",
			remainingMs: Math.max(0, s.endsAt - Date.now()),
			endsAt: null
		});
	},
	resetTimer: () => {
		const s = get();
		set({
			run: "idle",
			endsAt: null,
			remainingMs: phaseDurationMs(s.phase, s.focusMinutes, s.restMinutes)
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
		set({ tasks: [...s.tasks, {
			id: crypto.randomUUID(),
			title: clean,
			done: false
		}] });
	},
	toggleTask: (id) => {
		set({ tasks: get().tasks.map((task) => task.id === id ? {
			...task,
			done: !task.done
		} : task) });
	},
	removeTask: (id) => {
		set({ tasks: get().tasks.filter((task) => task.id !== id) });
	},
	clearSession: () => {
		set({
			phase: "focus",
			run: "idle",
			endsAt: null,
			remainingMs: get().focusMinutes * 6e4,
			sessions: 0,
			tasks: []
		});
	}
}), {
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
		tasks: s.tasks
	})
}));
function clockParts(ms) {
	const totalSeconds = Math.max(0, Math.ceil(ms / 1e3 - 1e-9));
	return {
		minutes: Math.floor(totalSeconds / 60),
		seconds: totalSeconds % 60
	};
}
function formatClock(ms) {
	const { minutes, seconds } = clockParts(ms);
	return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}
function speakClock(ms) {
	const { minutes, seconds } = clockParts(ms);
	return `${minutes} ${minutes === 1 ? "minuto" : "minutos"} y ${seconds} ${seconds === 1 ? "segundo" : "segundos"}`;
}
var RADIUS = 46;
var CIRCUMFERENCE = 2 * Math.PI * RADIUS;
function ProgressRing({ progress, phase, label, children }) {
	const clamped = Math.min(1, Math.max(0, progress));
	const offset = CIRCUMFERENCE * (1 - (clamped <= 0 ? .012 : clamped));
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "relative size-56 sm:size-72",
		role: "progressbar",
		"aria-valuemin": 0,
		"aria-valuemax": 100,
		"aria-valuenow": Math.round(clamped * 100),
		"aria-label": label,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
			viewBox: "0 0 120 120",
			className: cn("size-full -rotate-90", phase === "focus" ? "text-focus" : "text-rest"),
			"aria-hidden": "true",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
				cx: "60",
				cy: "60",
				r: RADIUS,
				fill: "none",
				strokeWidth: "6",
				className: "stroke-line"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
				cx: "60",
				cy: "60",
				r: RADIUS,
				fill: "none",
				strokeWidth: "6",
				strokeLinecap: "round",
				className: "ring-arc stroke-current",
				strokeDasharray: CIRCUMFERENCE,
				strokeDashoffset: offset
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "absolute inset-0 grid place-items-center px-10",
			children
		})]
	});
}
var FOCUS_PRESETS = [
	15,
	25,
	50
];
var REST_PRESETS = [
	5,
	10,
	15
];
function statusLabel(phase, run) {
	if (run === "paused") return "En pausa";
	if (phase === "focus" && run === "running") return "En foco";
	if (phase === "rest" && run === "running") return "En descanso";
	if (phase === "rest") return "Descanso listo";
	return "Listo";
}
function openLabel(count) {
	return count === 1 ? "1 abierta" : `${count} abiertas`;
}
function PomodoroApp() {
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
	const [now, setNow] = (0, import_react.useState)(0);
	const [draft, setDraft] = (0, import_react.useState)("");
	const [confirmClear, setConfirmClear] = (0, import_react.useState)(false);
	const lastNow = (0, import_react.useRef)(0);
	(0, import_react.useEffect)(() => {
		usePomodoro.persist.rehydrate();
		setNow(Date.now());
	}, []);
	(0, import_react.useEffect)(() => {
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
	(0, import_react.useEffect)(() => {
		if (run !== "running" || endsAt == null || now <= 0) return;
		if (now >= endsAt) {
			const crossed = lastNow.current > 0 && lastNow.current < endsAt;
			usePomodoro.getState().finishBlock({ chime: crossed });
		}
		lastNow.current = now;
	}, [
		now,
		run,
		endsAt
	]);
	(0, import_react.useEffect)(() => {
		const onKey = (event) => {
			if (event.code !== "Space") return;
			const target = event.target;
			if (target instanceof HTMLElement && target.closest("input, textarea, button, a, [role='switch']")) return;
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
	const remaining = run === "running" && endsAt != null && typeof window !== "undefined" ? Math.max(0, endsAt - (now || Date.now())) : remainingMs;
	const progress = total > 0 ? 1 - Math.min(total, remaining) / total : 0;
	const clock = formatClock(remaining);
	const status = statusLabel(phase, run);
	const current = tasks.find((task) => !task.done) ?? null;
	const openCount = tasks.reduce((count, task) => count + (task.done ? 0 : 1), 0);
	const filledPips = sessions === 0 ? 0 : sessions % 4 === 0 ? 4 : sessions % 4;
	const canClear = sessions > 0 || tasks.length > 0;
	const locked = run === "running";
	(0, import_react.useEffect)(() => {
		document.title = run === "running" ? `${clock} · ${phase === "focus" ? "Foco" : "Descanso"} — Senda` : "Senda";
	}, [
		clock,
		phase,
		run
	]);
	function onPrimary() {
		if (run === "running") {
			pause();
			return;
		}
		unlockAudio();
		start();
	}
	function onAdd(event) {
		event.preventDefault();
		addTask(draft);
		setDraft("");
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "mx-auto flex min-h-dvh w-full max-w-5xl flex-col px-5 py-6 sm:px-8 sm:py-10",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
			className: "flex items-center justify-between gap-4",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex min-w-0 items-center gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "grid size-11 shrink-0 place-items-center rounded-full border border-line bg-surface text-focus",
					"aria-hidden": "true",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
						viewBox: "0 0 32 32",
						className: "size-6",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
							cx: "16",
							cy: "16",
							r: "10",
							fill: "none",
							stroke: "currentColor",
							strokeWidth: "3"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
							cx: "16",
							cy: "16",
							r: "10",
							fill: "none",
							className: "stroke-rest",
							strokeWidth: "3",
							strokeLinecap: "round",
							strokeDasharray: "18 64",
							transform: "rotate(-90 16 16)"
						})]
					})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "min-w-0",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "font-display text-3xl leading-none sm:text-4xl",
						children: "Senda"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-sm text-pretty text-muted",
						children: "Un tramo cada vez."
					})]
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex shrink-0 items-center gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					id: "sound-label",
					className: "text-sm text-muted",
					children: "Sonido"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Switch, {
					checked: sound,
					onCheckedChange: (checked) => {
						setSound(checked);
						if (checked) {
							unlockAudio();
							playChime();
						}
					},
					"aria-labelledby": "sound-label",
					className: "relative h-11 w-16 overflow-hidden rounded-full bg-line p-1 transition-colors duration-200 data-[state=checked]:bg-focus",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SwitchThumb, { className: "block size-9 rounded-full border border-line bg-surface transition-transform duration-200 data-[state=checked]:translate-x-5 data-[state=checked]:border-focus" })
				})]
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-8 grid w-full min-w-0 grid-cols-1 items-start gap-8 lg:mt-12 lg:grid-cols-[minmax(0,1.15fr)_minmax(18rem,24rem)] lg:gap-14",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "flex w-full min-w-0 flex-col items-center lg:pt-2",
				"aria-label": "Temporizador",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "inline-flex rounded-full border border-line bg-surface p-1",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PhaseTab, {
							active: phase === "focus",
							disabled: locked,
							onClick: () => setPhase("focus"),
							tone: "focus",
							children: "Foco"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PhaseTab, {
							active: phase === "rest",
							disabled: locked,
							onClick: () => setPhase("rest"),
							tone: "rest",
							children: "Descanso"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-6",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ProgressRing, {
							progress,
							phase,
							label: phase === "focus" ? "Progreso del foco" : "Progreso del descanso",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								role: "timer",
								"aria-label": `${speakClock(remaining)} restantes`,
								className: "font-display text-5xl leading-none tabular-nums sm:text-6xl",
								children: clock
							})
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						"aria-live": "polite",
						className: cn("mt-4 inline-flex h-9 items-center gap-2 rounded-full px-3 text-sm font-medium", run === "running" && phase === "focus" && "bg-focus-soft text-focus", run === "running" && phase === "rest" && "bg-rest-soft text-rest", run === "paused" && "bg-surface text-ink", run === "idle" && "text-muted"),
						children: [run === "running" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "pip-live size-1.5 rounded-full bg-current",
							"aria-hidden": "true"
						}) : null, status]
					}),
					current ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-3 w-full max-w-sm truncate px-2 text-center text-sm text-muted",
						children: ["Ahora · ", current.title]
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-6 grid w-full max-w-sm grid-cols-2 gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							onClick: onPrimary,
							className: "inline-flex h-12 items-center justify-center gap-2 rounded-full bg-focus px-4 text-sm font-medium text-on-accent transition-opacity duration-200 active:opacity-80",
							children: [run === "running" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pause, {
								className: "size-4",
								"aria-hidden": "true"
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Play, {
								className: "size-4",
								"aria-hidden": "true"
							}), run === "running" ? "Pausar" : run === "paused" ? "Reanudar" : "Iniciar"]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							onClick: resetTimer,
							disabled: run === "idle",
							className: "inline-flex h-12 items-center justify-center gap-2 rounded-full border border-line bg-surface px-4 text-sm font-medium text-ink transition-opacity duration-200 active:opacity-80 disabled:opacity-40",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RotateCcw, {
								className: "size-4",
								"aria-hidden": "true"
							}), "Reiniciar"]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-8 w-full max-w-sm",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mb-3 flex items-baseline justify-between gap-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
									className: "text-sm font-medium",
									children: "Duraciones"
								}), locked ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-sm text-muted",
									children: "Pausa para editar"
								}) : null]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DurationRow, {
								label: "Foco",
								phase: "focus",
								minutes: focusMinutes,
								presets: FOCUS_PRESETS,
								locked,
								onPreset: (minutes) => setMinutes("focus", minutes),
								onBump: (delta) => bumpMinutes("focus", delta)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "mt-4",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DurationRow, {
									label: "Descanso",
									phase: "rest",
									minutes: restMinutes,
									presets: REST_PRESETS,
									locked,
									onPreset: (minutes) => setMinutes("rest", minutes),
									onBump: (delta) => bumpMinutes("rest", delta)
								})
							})
						]
					})
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
				className: "flex w-full min-w-0 flex-col gap-6 rounded-3xl border border-line bg-surface p-5 sm:p-6",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-end justify-between gap-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "text-sm font-medium text-muted",
							children: "Sesiones de foco"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 font-display text-4xl leading-none tabular-nums",
							children: sessions
						})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "flex gap-2 pb-1",
							"aria-hidden": "true",
							children: [
								0,
								1,
								2,
								3
							].map((index) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: cn("size-3.5 rounded-full", index < filledPips ? "bg-focus" : "border border-line") }, index))
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-px bg-line" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-baseline justify-between gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								className: "font-display text-2xl leading-none",
								children: "Esta sesión"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-sm text-muted",
								children: openLabel(openCount)
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
							onSubmit: onAdd,
							className: "mt-4 flex min-w-0 gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								value: draft,
								onChange: (event) => setDraft(event.target.value),
								placeholder: "Escribe una tarea",
								"aria-label": "Nueva tarea",
								maxLength: 140,
								enterKeyHint: "done",
								className: "h-12 min-w-0 flex-1 rounded-full border border-line bg-bg px-4 text-base text-ink placeholder:text-muted"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "submit",
								disabled: draft.trim().length === 0,
								className: "h-12 shrink-0 rounded-full bg-ink px-4 text-sm font-medium text-on-accent transition-opacity duration-200 active:opacity-80 disabled:opacity-40",
								children: "Añadir"
							})]
						}),
						tasks.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "px-2 py-6 text-center text-sm text-pretty text-muted",
							children: "Nada en la lista. Añade lo que quieres cerrar en este tramo."
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
							className: "mt-3 max-h-80 overflow-y-auto",
							children: tasks.map((task) => {
								const isCurrent = current?.id === task.id;
								return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
									className: "flex items-center border-b border-line last:border-b-0",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
										type: "button",
										onClick: () => toggleTask(task.id),
										className: "flex min-h-12 min-w-0 flex-1 items-center gap-3 py-2 text-left",
										"aria-pressed": task.done,
										"aria-label": isCurrent ? `Ahora, ${task.title}` : task.title,
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: cn("grid size-6 shrink-0 place-items-center rounded-full border", task.done ? "border-focus bg-focus text-on-accent" : "border-line bg-bg"),
											"aria-hidden": "true",
											children: task.done ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "size-3.5" }) : null
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: cn("min-w-0 text-base wrap-break-word", task.done && "text-muted line-through"),
											children: [isCurrent ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "mr-2 text-sm font-medium text-focus",
												children: "Ahora"
											}) : null, task.title]
										})]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										onClick: () => removeTask(task.id),
										"aria-label": `Eliminar ${task.title}`,
										className: "grid size-11 shrink-0 place-items-center text-muted",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, {
											className: "size-4",
											"aria-hidden": "true"
										})
									})]
								}, task.id);
							})
						})
					] }),
					confirmClear ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "rounded-2xl bg-rest-soft p-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm text-pretty text-ink",
							children: "Se vacía la lista y el conteo vuelve a cero. Las duraciones se quedan."
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-3 grid grid-cols-2 gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: () => setConfirmClear(false),
								className: "h-11 rounded-full border border-line bg-surface text-sm font-medium",
								children: "Cancelar"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: () => {
									clearSession();
									setConfirmClear(false);
								},
								className: "h-11 rounded-full bg-rest text-sm font-medium text-on-accent",
								children: "Vaciar"
							})]
						})]
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: () => setConfirmClear(true),
						disabled: !canClear,
						className: "h-11 rounded-full text-sm text-muted disabled:opacity-40",
						children: "Nueva sesión"
					})
				]
			})]
		})]
	});
}
function PhaseTab({ active, disabled, onClick, tone, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		type: "button",
		"aria-pressed": active,
		disabled,
		onClick,
		className: cn("h-11 min-w-24 rounded-full px-4 text-sm font-medium transition-colors duration-200 disabled:opacity-100", active && tone === "focus" && "bg-focus text-on-accent", active && tone === "rest" && "bg-rest text-on-accent", !active && "text-muted", disabled && !active && "text-muted"),
		children
	});
}
function DurationRow({ label, phase, minutes, presets, locked, onPreset, onBump }) {
	const max = phase === "focus" ? 90 : 45;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
		className: "mb-2 text-sm font-medium",
		children: [
			label,
			" ",
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "font-normal text-muted",
				children: "min"
			})
		]
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex min-w-0 flex-wrap items-center justify-between gap-3",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "flex gap-2",
			children: presets.map((preset) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				"aria-pressed": minutes === preset,
				"aria-label": `${preset} minutos de ${label.toLowerCase()}`,
				disabled: locked,
				onClick: () => onPreset(preset),
				className: cn("h-11 min-w-11 rounded-full px-3 text-sm font-medium tabular-nums", minutes === preset ? "bg-ink text-on-accent" : "border border-line bg-surface text-ink", "disabled:opacity-40"),
				children: preset
			}, preset))
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-center",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					"aria-label": `Quitar un minuto de ${label.toLowerCase()}`,
					disabled: locked || minutes <= 1,
					onClick: () => onBump(-1),
					className: "grid size-11 place-items-center rounded-full border border-line bg-surface disabled:opacity-40",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Minus, {
						className: "size-4",
						"aria-hidden": "true"
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "w-10 text-center text-sm font-medium tabular-nums",
					children: minutes
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					"aria-label": `Sumar un minuto de ${label.toLowerCase()}`,
					disabled: locked || minutes >= max,
					onClick: () => onBump(1),
					className: "grid size-11 place-items-center rounded-full border border-line bg-surface disabled:opacity-40",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, {
						className: "size-4",
						"aria-hidden": "true"
					})
				})
			]
		})]
	})] });
}
function Home() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PomodoroApp, {});
}
//#endregion
export { Home as component };
