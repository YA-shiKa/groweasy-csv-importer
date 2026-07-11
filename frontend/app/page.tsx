"use client";

import { useState } from "react";
import Papa from "papaparse";
import Dropzone from "@/components/Dropzone";
import PreviewTable from "@/components/PreviewTable";
import ResultsTable from "@/components/ResultsTable";
import { downloadCrmRecordsAsCsv } from "@/lib/csvExport";
import ProgressBar from "@/components/ProgressBar";
import ThemeToggle from "@/components/ThemeToggle";
import { importRows, ApiError } from "@/lib/api";
import type { ImportResponse, RawRow } from "@/lib/types";

type Step = "upload" | "preview" | "processing" | "results";

const MAX_SIZE = 5 * 1024 * 1024;

export default function Home() {
  const [step, setStep] = useState<Step>("upload");
  const [fileName, setFileName] = useState<string>("");
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<RawRow[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [processError, setProcessError] = useState<string | null>(null);
  const [result, setResult] = useState<ImportResponse | null>(null);

  function handleFile(file: File) {
    setUploadError(null);

    if (!file.name.toLowerCase().endsWith(".csv")) {
      setUploadError("That doesn't look like a CSV file. Please upload a .csv file.");
      return;
    }
    if (file.size > MAX_SIZE) {
      setUploadError(`File is too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Max size is 5MB.`);
      return;
    }

    setFileName(file.name);
    Papa.parse<RawRow>(file, {
      header: true,
      skipEmptyLines: "greedy",
      transformHeader: (h) => h.trim(),
      complete: (res) => {
        const cleanRows = res.data.filter((r) => Object.values(r).some((v) => (v ?? "").toString().trim() !== ""));
        if (cleanRows.length === 0) {
          setUploadError("This CSV doesn't contain any usable rows.");
          return;
        }
        setHeaders(res.meta.fields ?? []);
        setRows(cleanRows);
        setStep("preview");
      },
      error: (err) => setUploadError(`Couldn't parse this CSV: ${err.message}`),
    });
  }

  async function handleConfirm() {
    setStep("processing");
    setProcessError(null);
    try {
      const data = await importRows(rows);
      setResult(data);
      setStep("results");
    } catch (err) {
      setProcessError(err instanceof ApiError ? err.message : "Something went wrong while importing. Please try again.");
      setStep("preview");
    }
  }

  function reset() {
    setStep("upload");
    setFileName("");
    setHeaders([]);
    setRows([]);
    setResult(null);
    setUploadError(null);
    setProcessError(null);
  }

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-6 py-12">
      <header className="mb-10 flex items-center justify-between">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-accent">GrowEasy · Lead Sources</p>
          <h1 className="font-display text-3xl font-bold tracking-tight">CSV → CRM Importer</h1>
          <p className="mt-1 text-sm text-ink/50 dark:text-paper/50">
            Upload any lead export. AI maps every column to the CRM schema — no fixed format required.
          </p>
        </div>
        <ThemeToggle />
      </header>

      <Steps current={step} />

      <section className="mt-8">
        {step === "upload" && <Dropzone onFileAccepted={handleFile} error={uploadError} />}

        {step === "preview" && (
          <div className="flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{fileName}</p>
                <p className="text-sm text-ink/50 dark:text-paper/50">
                  {rows.length.toLocaleString()} rows detected · {headers.length} columns
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={reset}
                  className="rounded-full border border-ink/15 px-4 py-2 text-sm font-medium hover:bg-ink/5 dark:border-paper/15 dark:hover:bg-paper/10"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirm}
                  className="rounded-full bg-accent px-5 py-2 text-sm font-medium text-white transition-transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  Confirm import ({rows.length.toLocaleString()} rows)
                </button>
              </div>
            </div>
            {processError && (
              <p role="alert" className="rounded-lg bg-signal-bad/10 px-4 py-2 text-sm text-signal-bad">
                {processError}
              </p>
            )}
            <PreviewTable headers={headers} rows={rows} />
          </div>
        )}

        {step === "processing" && (
          <ProgressBar label={`Mapping ${rows.length.toLocaleString()} rows to CRM fields with Gemini…`} />
        )}

        {step === "results" && result && (
          <div className="flex flex-col gap-5">
            <div className="grid grid-cols-3 gap-4">
              <StatCard label="Total rows" value={result.totalRows} />
              <StatCard label="Imported" value={result.totalImported} tone="good" />
              <StatCard label="Skipped" value={result.totalSkipped} tone="bad" />
            </div>
            <div className="flex justify-end">
            <button
  onClick={() => downloadCrmRecordsAsCsv(result.imported, `${fileName.replace(/\.csv$/i, "")}_crm_import.csv`)}
  disabled={result.imported.length === 0}
  className="rounded-full bg-accent px-4 py-2 text-sm font-medium text-white transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100"
>
  Download CSV ({result.imported.length.toLocaleString()} records)
</button>
              <button
                onClick={reset}
                className="rounded-full border border-ink/15 px-4 py-2 text-sm font-medium hover:bg-ink/5 dark:border-paper/15 dark:hover:bg-paper/10"
              >
                Import another file
              </button>
            </div>
            <ResultsTable imported={result.imported} skipped={result.skipped} />
          </div>
        )}
      </section>
    </main>
  );
}

function Steps({ current }: { current: Step }) {
  const stepOrder: Step[] = ["upload", "preview", "processing", "results"];
  const labels: Record<Step, string> = {
    upload: "Upload",
    preview: "Preview",
    processing: "Processing",
    results: "Result",
  };
  const currentIndex = stepOrder.indexOf(current);

  return (
    <ol className="flex items-center gap-2 font-mono text-xs uppercase tracking-wide">
      {stepOrder.map((s, i) => (
        <li key={s} className="flex items-center gap-2">
          <span
            className={`flex h-6 w-6 items-center justify-center rounded-full ${
              i <= currentIndex ? "bg-ink text-paper dark:bg-paper dark:text-ink" : "bg-ink/10 text-ink/40 dark:bg-paper/10 dark:text-paper/40"
            }`}
          >
            {i + 1}
          </span>
          <span className={i <= currentIndex ? "text-ink dark:text-paper" : "text-ink/40 dark:text-paper/40"}>{labels[s]}</span>
          {i < stepOrder.length - 1 && <span className="mx-1 h-px w-8 bg-ink/10 dark:bg-paper/10" />}
        </li>
      ))}
    </ol>
  );
}

function StatCard({ label, value, tone }: { label: string; value: number; tone?: "good" | "bad" }) {
  const toneClass = tone === "good" ? "text-signal-good" : tone === "bad" ? "text-signal-bad" : "text-ink dark:text-paper";
  return (
    <div className="rounded-2xl border border-ink/10 px-5 py-4 dark:border-paper/10">
      <p className="font-mono text-xs uppercase tracking-wide text-ink/50 dark:text-paper/50">{label}</p>
      <p className={`font-display text-3xl font-bold ${toneClass}`}>{value.toLocaleString()}</p>
    </div>
  );
}
