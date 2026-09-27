import { createFileRoute } from "@tanstack/react-router";
import { PomodoroApp } from "@/components/pomodoro-app";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return <PomodoroApp />;
}
