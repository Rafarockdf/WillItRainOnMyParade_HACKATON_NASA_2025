"use client";
import { useEffect, useState } from "react";
import { Moon, Sun, Monitor } from "lucide-react";

type Theme = "light" | "dark" | "system";

function getSystemPreference(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  const effective: "light" | "dark" = theme === "system" ? getSystemPreference() : theme;
  root.classList.toggle("dark", effective === "dark");
  root.setAttribute("data-theme", effective); // para CSS vars existentes
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("system");

  // Inicialização
  useEffect(() => {
    const stored = (typeof window !== "undefined" && localStorage.getItem("theme-mode")) as Theme | null;
    if (stored === "light" || stored === "dark" || stored === "system") {
      setTheme(stored);
      applyTheme(stored);
    } else {
      applyTheme("system");
    }
    // Listener para mudança de preferência do sistema quando em modo system
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      if (theme === "system") applyTheme("system");
    };
    media.addEventListener("change", handler);
    return () => media.removeEventListener("change", handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function cycle() {
    const order: Theme[] = ["light", "dark", "system"]; // ciclo
    const idx = order.indexOf(theme);
    const next = order[(idx + 1) % order.length];
    setTheme(next);
    localStorage.setItem("theme-mode", next);
    applyTheme(next);
  }

  const effective = theme === "system" ? getSystemPreference() : theme;
  const label = theme === "system" ? `Auto (${effective === "dark" ? "Dark" : "Light"})` : theme === "dark" ? "Dark" : "Light";
  const Icon = theme === "system" ? Monitor : theme === "dark" ? Moon : Sun;

  return (
    <button
      onClick={cycle}
      aria-label="Alternar tema"
      title={`Tema: ${label} (clique para alterar)`}
      className="inline-flex items-center gap-2 border rounded px-3 py-1.5 text-sm hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
    >
      <Icon className="h-4 w-4" />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}
