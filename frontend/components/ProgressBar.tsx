"use client";

export default function ProgressBar({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center gap-3 py-16">
      <div className="w-64 h-2 bg-gray-200 rounded-full overflow-hidden">
        <div className="h-full w-1/3 bg-blue-500 rounded-full animate-pulse" />
      </div>
      <p className="text-sm text-gray-500">{label}</p>
    </div>
  );
}
