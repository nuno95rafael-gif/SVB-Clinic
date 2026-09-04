"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

type Theme = "light" | "dark";

export function ThemeToggle() {
  // null até montar no browser — não dá para saber a preferência do sistema
  // no servidor, e arriscar um valor errado causaria um flash ao corrigir.
  const [theme, setTheme] = useState<Theme | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("theme");
    if (stored === "light" || stored === "dark") {
      setTheme(stored);
    } else {
      setTheme(window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    }
  }, []);

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("theme", next);
  }

  const isDark = theme !== "light";

  return (
    <button
      type="button"
      onClick={toggle}
      title={isDark ? "Modo claro" : "Modo escuro"}
      aria-label={isDark ? "Ativar modo claro" : "Ativar modo escuro"}
      className="rounded-md p-1.5 text-foreground-faint hover:bg-background hover:text-foreground"
    >
      {isDark ? <Sun size={15} /> : <Moon size={15} />}
    </button>
  );
}
