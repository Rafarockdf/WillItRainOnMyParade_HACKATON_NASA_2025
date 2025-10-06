"use client";
import { useEffect, useState } from "react";

type Theme = "light" | "dark";

export default function ThemeProvider() {
  const [theme, setTheme] = useState<Theme | null>(null);

  useEffect(() => {
    const stored = (typeof window !== "undefined" && localStorage.getItem("theme")) as Theme | null;
    if (stored === "light" || stored === "dark") {
      setTheme(stored);
      document.documentElement.setAttribute("data-theme", stored);
      // Adiciona/remove classe 'dark' para Tailwind
      if (stored === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    } else {
      // inherit system preference initially
      setTheme(null);
      document.documentElement.removeAttribute("data-theme");
      document.documentElement.classList.remove("dark");
    }
  }, []);

  function toggle() {
    const current = document.documentElement.getAttribute("data-theme") as Theme | null;
    const next: Theme = current === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    // Adiciona/remove classe 'dark' para Tailwind
    if (next === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("theme", next);
    setTheme(next);
  }

  return (
    <button
      onClick={toggle}
      title="Alternar tema"
      className="border rounded px-3 py-1.5 text-sm hover:bg-black/5 dark:hover:bg-white/10 transition"
      aria-label="Alternar tema"
    >
      {theme === "dark" ? "Tema: Dark" : theme === "light" ? "Tema: Light" : "Tema: Auto"}
    </button>
  );
}
