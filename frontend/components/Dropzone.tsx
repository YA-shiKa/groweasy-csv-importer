"use client";

import { useCallback, useRef, useState } from "react";

const MAX_SIZE = 5 * 1024 * 1024;

interface DropzoneProps {
  onFileAccepted: (file: File) => void;
  error: string | null;
}

export default function Dropzone({ onFileAccepted, error }: DropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateAndAccept = useCallback(
    (file: File | undefined) => {
      if (!file) return;
      if (!file.name.toLowerCase().endsWith(".csv")) {
        onFileAccepted(file); // let parent surface the "invalid type" error via parse failure
        return;
      }
      if (file.size > MAX_SIZE) {
        onFileAccepted(file);
        return;
      }
      onFileAccepted(file);
    },
    [onFileAccepted]
  );

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          validateAndAccept(e.dataTransfer.files?.[0]);
        }}
        className={`group relative flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-8 py-16 text-center transition-all duration-200
          ${
            isDragging
              ? "border-accent bg-accent-soft dark:bg-accent/10 scale-[1.01]"
              : "border-ink/15 hover:border-accent/60 dark:border-paper/15"
          }`}
      >
        <div
          className={`flex h-14 w-14 items-center justify-center rounded-xl border font-mono text-xs transition-transform ${
            isDragging ? "-translate-y-1 border-accent text-accent" : "border-ink/20 text-ink/50 dark:border-paper/20 dark:text-paper/50"
          }`}
        >
          .csv
        </div>
        <p className="font-display text-lg font-medium">
          {isDragging ? "Drop it in" : "Drag a CSV here, or click to browse"}
        </p>
        <p className="max-w-sm text-sm text-ink/50 dark:text-paper/50">
          Facebook exports, Google Ads exports, Excel sheets, real-estate CRM
          exports — column names don&apos;t need to match anything. Max 5MB.
        </p>
        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={(e) => validateAndAccept(e.target.files?.[0])}
        />
      </div>
      {error && (
        <p role="alert" className="mt-3 rounded-lg bg-signal-bad/10 px-4 py-2 text-sm text-signal-bad">
          {error}
        </p>
      )}
    </div>
  );
}
