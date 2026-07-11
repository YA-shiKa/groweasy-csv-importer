"use client";

import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const preferred =
      window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false;
    setDark(preferred);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  return (
    <button
      onClick={() => setDark((d) => !d)}
      aria-label="Toggle dark mode"
      className="flex h-9 w-9 items-center justify-center rounded-full border border-ink/15 text-sm transition-colors hover:bg-ink/5 dark:border-paper/15 dark:hover:bg-paper/10"
    >
      {dark ? "☀" : "☾"}
    </button>
  );
}
