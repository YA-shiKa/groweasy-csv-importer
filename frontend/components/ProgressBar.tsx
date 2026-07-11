"use client";

export default function ProgressBar({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center gap-4 py-16">
      <div className="relative h-1.5 w-64 overflow-hidden rounded-full bg-ink/10 dark:bg-paper/10">
        <div className="absolute inset-y-0 w-1/3 animate-[loading_1.2s_ease-in-out_infinite] rounded-full bg-accent" />
      </div>
      <p className="font-mono text-sm text-ink/60 dark:text-paper/60">{label}</p>
      <style jsx>{`
        @keyframes loading {
          0% {
            left: -33%;
          }
          100% {
            left: 100%;
          }
        }
      `}</style>
    </div>
  );
}
