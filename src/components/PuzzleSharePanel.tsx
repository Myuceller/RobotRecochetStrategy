import { useState } from 'react';

type PuzzleSharePanelProps = {
  exportedJson: string;
  importText: string;
  importError: string | null;
  importSuccess: string | null;
  disabled?: boolean;
  onExport: () => void;
  onImportTextChange: (value: string) => void;
  onImport: () => void;
};

export function PuzzleSharePanel({
  exportedJson,
  importText,
  importError,
  importSuccess,
  disabled = false,
  onExport,
  onImportTextChange,
  onImport,
}: PuzzleSharePanelProps) {
  const [copyStatus, setCopyStatus] = useState<string | null>(null);

  const handleCopy = async () => {
    if (!exportedJson) {
      return;
    }

    try {
      await navigator.clipboard?.writeText(exportedJson);
      setCopyStatus('Copied JSON.');
    } catch {
      setCopyStatus('Copy failed. Select the JSON manually.');
    }
  };

  return (
    <details className="mt-3 rounded border border-slate-300 bg-white text-sm shadow-sm">
      <summary className="cursor-pointer list-none px-4 py-3 font-semibold text-slate-800">
        Import / Export
        <span className="ml-2 text-xs font-normal text-slate-500">JSON tools</span>
      </summary>
      <section className="border-t border-slate-200 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">Import / Export</h2>
          <p className="mt-1 text-slate-600">
            Copy exported puzzle JSON or paste wallSpec JSON with vWalls/hWalls.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onExport}
            className="rounded bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-700"
          >
            Export
          </button>
          <button
            type="button"
            onClick={handleCopy}
            disabled={!exportedJson}
            className="rounded border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Copy JSON
          </button>
        </div>
      </div>

      <label htmlFor="export-json" className="mt-4 block text-xs font-semibold uppercase text-slate-500">
        Exported JSON
      </label>
      <textarea
        id="export-json"
        readOnly
        value={exportedJson}
        placeholder="Click Export to generate JSON for the active puzzle."
        className="mt-2 h-32 w-full resize-y rounded border border-slate-300 bg-slate-50 p-3 font-mono text-xs text-slate-900"
      />

      <label htmlFor="import-json" className="mt-4 block text-xs font-semibold uppercase text-slate-500">
        Import JSON
      </label>
      <textarea
        id="import-json"
        value={importText}
        onChange={(event) => onImportTextChange(event.target.value)}
        placeholder="Paste exported puzzle JSON or wallSpec JSON here."
        className="mt-2 h-32 w-full resize-y rounded border border-slate-300 bg-white p-3 font-mono text-xs text-slate-900"
      />

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={onImport}
          disabled={disabled || importText.trim().length === 0}
          className="rounded bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Import
        </button>
        {disabled ? <span className="text-xs text-slate-500">Import is disabled while work is running.</span> : null}
      </div>

      {copyStatus ? <p className="mt-3 text-xs text-slate-600">{copyStatus}</p> : null}
      {importSuccess ? <p className="mt-3 text-xs font-medium text-green-700">{importSuccess}</p> : null}
      {importError ? <p className="mt-3 text-xs font-medium text-red-700">{importError}</p> : null}
      </section>
    </details>
  );
}
