"use client";

import { useRef, useState } from "react";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export default function Dropzone({ onFileAccepted, error }: { onFileAccepted: (file: File) => void; error: string | null }) {
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFile(file: File | undefined) {
    if (!file) return;
    onFileAccepted(file);
  }

  function openFilePicker() {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  }

  return (
    <div>
      <div
        onClick={openFilePicker}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          handleFile(e.dataTransfer.files[0]);
        }}
        className={
          "border-2 border-dashed rounded-xl p-10 text-center cursor-pointer " +
          (dragging ? "border-blue-500 bg-blue-50" : "border-gray-300")
        }
      >
        <p className="font-medium text-lg mb-1">
          {dragging ? "Drop the file" : "Click or drag a CSV file here"}
        </p>
        <p className="text-sm text-gray-500">
          Any column layout works. Max file size 5MB.
        </p>

        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
      </div>

      {error && (
        <p className="mt-3 text-sm text-red-600 bg-red-50 px-3 py-2 rounded">
          {error}
        </p>
      )}
    </div>
  );
}
