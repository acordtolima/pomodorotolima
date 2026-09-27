export function clockParts(ms: number) {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000 - 1e-9));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return { minutes, seconds };
}

export function formatClock(ms: number) {
  const { minutes, seconds } = clockParts(ms);
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function speakClock(ms: number) {
  const { minutes, seconds } = clockParts(ms);
  const minLabel = minutes === 1 ? "minuto" : "minutos";
  const secLabel = seconds === 1 ? "segundo" : "segundos";
  return `${minutes} ${minLabel} y ${seconds} ${secLabel}`;
}
