"use client";

import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [darkMode, setDarkMode] = useState(false);

  // on first load, match whatever the user's system is set to
  useEffect(() => {
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    setDarkMode(prefersDark);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  return (
    <button
      onClick={() => setDarkMode(!darkMode)}
      className="w-9 h-9 rounded-full border flex items-center justify-center text-sm"
    >
      {darkMode ? "☀" : "☾"}
    </button>
  );
}
