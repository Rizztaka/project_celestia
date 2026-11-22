import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Upload,
  Download,
  FileText,
  CheckCircle2,
  AlertCircle,
  Copy,
  Layers,
  ShieldCheck,
  Check,
} from 'lucide-react';
import type { OwnedCharacterProfile, OwnedWeapon } from '../types/genshin';
import {
  parseGOODJSON,
  mapGOODToCelestiaProfiles,
  exportToGOODJSON,
  mergeRosterProfiles,
  mergeWeapons,
  type GOODMapResult,
} from '../services/good-parser';
import { getSavedArtifacts, saveArtifacts, getSavedWeapons, saveWeapons } from '../services/storage';
import { useModalAccessibility } from '../hooks/useModalAccessibility';

interface GoodImportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  profiles: Record<string, OwnedCharacterProfile>;
  weapons?: OwnedWeapon[];
  onImportSuccess: (
    mergedProfiles: Record<string, OwnedCharacterProfile>,
    message: string,
    importedWeapons?: OwnedWeapon[],
  ) => void;
}

export const GoodImportExportModal: React.FC<GoodImportExportModalProps> = ({
  isOpen,
  onClose,
  profiles,
  weapons,
  onImportSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<'import' | 'export'>('import');
  const [rawText, setRawText] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [parsedResult, setParsedResult] = useState<GOODMapResult | null>(null);
  const [sourceName, setSourceName] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [exportError, setExportError] = useState<string>('');
  const [overwriteAll, setOverwriteAll] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useModalAccessibility({
    isOpen,
    onClose,
    containerRef: dialogRef,
    initialFocusRef: closeBtnRef,
  });

  useEffect(() => {
    if (isOpen) {
      setErrorMsg('');
      setExportError('');
      setIsDragging(false);
    }
  }, [isOpen]);

  useEffect(() => {
    return () => {
      if (copyTimerRef.current) {
        clearTimeout(copyTimerRef.current);
      }
    };
  }, []);

  if (!isOpen) return null;

  const handleProcessJSON = (jsonString: string, originName = 'Direct Input') => {
    setErrorMsg('');
    const parsed = parseGOODJSON(jsonString);
    if (!parsed.success || !parsed.data) {
      setErrorMsg(parsed.error || 'Failed to parse GOOD data.');
      setParsedResult(null);
      return;
    }

    try {
      const mapped = mapGOODToCelestiaProfiles(parsed.data);
      if (mapped.summary.importedCharacters === 0) {
        setErrorMsg('No recognizable Genshin characters found in GOOD payload.');
        setParsedResult(null);
        return;
      }

      setParsedResult(mapped);
      setSourceName(parsed.data.source || originName);
    } catch (e: unknown) {
      const err = e instanceof Error ? e.message : String(e);
      setErrorMsg(`Mapping error: ${err}`);
      setParsedResult(null);
    }
  };

  const readGoodFile = (file: File) => {
    setFileName(file.name);
    setErrorMsg('');
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = String(event.target?.result ?? '');
      setRawText(content);
      handleProcessJSON(content, file.name);
    };
    reader.onerror = () => {
      setErrorMsg('Failed to read file from disk.');
    };
    reader.readAsText(file);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    readGoodFile(file);
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    readGoodFile(file);
  };

  const handleApplyImport = () => {
    if (!parsedResult) return;

    const merged = mergeRosterProfiles(profiles, parsedResult.profiles, overwriteAll);

    let resolvedWeapons: OwnedWeapon[] | undefined = undefined;
    if (parsedResult.rawWeapons && parsedResult.rawWeapons.length > 0) {
      const currentWeapons = weapons || getSavedWeapons();
      resolvedWeapons = mergeWeapons(currentWeapons, parsedResult.rawWeapons, overwriteAll);
      saveWeapons(resolvedWeapons);
    }

    let artifactWarning = '';
    if (parsedResult.rawArtifacts && parsedResult.rawArtifacts.length > 0) {
      const savedOk = saveArtifacts(parsedResult.rawArtifacts);
      if (!savedOk) {
        artifactWarning = ' (Note: Artifact inventory exceeded browser localStorage limit)';
      }
    }

    const count = Object.keys(parsedResult.profiles).length;
    const weaponCount = parsedResult.rawWeapons?.length ?? parsedResult.summary.importedWeapons;
    const msg = `Successfully imported ${count} character profiles${
      weaponCount > 0 ? ` and ${weaponCount} weapons` : ''
    } from ${sourceName || 'GOOD JSON'}!${artifactWarning}`;

    onImportSuccess(merged, msg, resolvedWeapons);
    onClose();
  };

  const handleDownloadExport = () => {
    setExportError('');
    try {
      const artifacts = getSavedArtifacts();
      const activeWeapons = weapons || getSavedWeapons();
      const jsonStr = exportToGOODJSON(profiles, artifacts, activeWeapons);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `celestia_roster_backup_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      setExportError('Unable to download export file in this browser environment.');
    }
  };

  const handleCopyExport = async () => {
    setExportError('');
    try {
      const artifacts = getSavedArtifacts();
      const activeWeapons = weapons || getSavedWeapons();
      const jsonStr = exportToGOODJSON(profiles, artifacts, activeWeapons);
      await navigator.clipboard.writeText(jsonStr);
      setCopied(true);
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
      copyTimerRef.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      setExportError('Clipboard access was blocked by the browser. Use Download .json File instead.');
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="GOOD JSON Import / Export"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        className="bg-[#121420] border border-[#2c334d] rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden focus:outline-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-[#24293d] bg-[#161926] gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-[#d4af37]/15 border border-[#d4af37]/35 flex items-center justify-center text-[#f3cf58] shrink-0">
              <Layers className="w-5 h-5" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-bold text-zinc-100 font-serif leading-tight">
                Universal Roster Portability (GOOD Format)
              </h2>
              <p className="text-xs text-zinc-300 mt-0.5">
                Client-side JSON import &amp; export compatible with Amenoma, Inventory Klee, and Genshin Optimizer
              </p>
            </div>
          </div>
          <button
            ref={closeBtnRef}
            type="button"
            onClick={onClose}
            aria-label="Close GOOD Import / Export modal"
            className="min-w-[40px] min-h-[40px] rounded-xl flex items-center justify-center text-zinc-300 hover:text-white hover:bg-[#22283d] transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div
          role="tablist"
          aria-label="GOOD format actions"
          className="flex border-b border-[#24293d] bg-[#131624] px-5 sm:px-6 gap-2"
        >
          <button
            id="good-tab-import"
            type="button"
            role="tab"
            aria-selected={activeTab === 'import'}
            aria-controls="good-panel-import"
            onClick={() => setActiveTab('import')}
            className={`min-h-[44px] py-2.5 px-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'import'
                ? 'border-[#d4af37] text-[#f3cf58]'
                : 'border-transparent text-zinc-300 hover:text-white'
            }`}
          >
            <Upload className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Import GOOD JSON</span>
          </button>
          <button
            id="good-tab-export"
            type="button"
            role="tab"
            aria-selected={activeTab === 'export'}
            aria-controls="good-panel-export"
            onClick={() => setActiveTab('export')}
            className={`min-h-[44px] py-2.5 px-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'export'
                ? 'border-[#d4af37] text-[#f3cf58]'
                : 'border-transparent text-zinc-300 hover:text-white'
            }`}
          >
            <Download className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Export Roster Backup</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {activeTab === 'import' ? (
            <div
              id="good-panel-import"
              role="tabpanel"
              aria-labelledby="good-tab-import"
              className="space-y-4"
            >
              {/* Accessible File Dropzone */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".json,application/json"
                aria-label="Select GOOD JSON file"
                className="sr-only"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                className={`w-full border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
                  isDragging
                    ? 'border-[#f3cf58] bg-[#d4af37]/10'
                    : 'border-[#323954] hover:border-[#d4af37]/70 bg-[#161928] hover:bg-[#1a1f32]'
                }`}
              >
                <Upload className="w-8 h-8 text-[#d4af37] mx-auto mb-2" aria-hidden="true" />
                <span className="block text-sm font-semibold text-zinc-100 break-all">
                  {fileName ? fileName : 'Click to select or drag & drop GOOD .json file'}
                </span>
                <span className="block text-xs text-zinc-300 mt-1">
                  Supports Inventory Klee, Amenoma, Irminsul, Seelie, and Genshin Optimizer exports
                </span>
              </button>

              {/* Paste fallback */}
              <div>
                <div className="flex items-center justify-between mb-1.5 gap-2">
                  <label
                    htmlFor="good-raw-json"
                    className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5"
                  >
                    <FileText className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Or paste raw GOOD JSON text</span>
                  </label>
                  {rawText.trim() && (
                    <button
                      type="button"
                      onClick={() => handleProcessJSON(rawText)}
                      className="min-h-[32px] px-2.5 rounded-lg text-xs text-[#f3cf58] hover:bg-[#d4af37]/10 font-semibold cursor-pointer"
                    >
                      Load / Parse
                    </button>
                  )}
                </div>
                <textarea
                  id="good-raw-json"
                  value={rawText}
                  onChange={(e) => {
                    setRawText(e.target.value);
                    setErrorMsg('');
                  }}
                  onPaste={(e) => {
                    const pasted = e.clipboardData.getData('text');
                    if (pasted.trim().startsWith('{')) {
                      handleProcessJSON(pasted);
                    }
                  }}
                  placeholder='{"format": "GOOD", "version": 2, "characters": [...]}'
                  rows={4}
                  className="w-full bg-[#0c0e17] border border-[#2c324a] rounded-xl p-3 text-xs text-zinc-100 placeholder:text-zinc-400 font-mono focus:border-[#d4af37]"
                />
              </div>

              {/* Error feedback */}
              {errorMsg && (
                <div
                  role="alert"
                  className="p-3.5 rounded-xl bg-rose-950/50 border border-rose-400/50 text-rose-100 text-xs flex items-start gap-2"
                >
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-300 mt-0.5" aria-hidden="true" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Parsed summary preview */}
              {parsedResult && (
                <div
                  aria-live="polite"
                  className="p-4 rounded-xl bg-[#181d2e] border border-[#323954] space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-semibold">
                    <span className="text-emerald-300 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                      Valid GOOD Data Detected
                    </span>
                    <span className="text-zinc-300 font-mono text-[11px]">
                      Source: {sourceName}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-[#121420] p-2.5 rounded-lg border border-[#24293d]">
                      <div className="text-base font-bold text-zinc-100 font-serif tabular-nums">
                        {parsedResult.summary.importedCharacters}
                      </div>
                      <div className="text-[11px] text-zinc-300 uppercase tracking-wider mt-0.5">
                        Characters
                      </div>
                    </div>
                    <div className="bg-[#121420] p-2.5 rounded-lg border border-[#24293d]">
                      <div className="text-base font-bold text-zinc-100 font-serif tabular-nums">
                        {parsedResult.rawWeapons?.length ?? parsedResult.summary.importedWeapons}
                      </div>
                      <div className="text-[11px] text-zinc-300 uppercase tracking-wider mt-0.5">
                        Weapons
                      </div>
                    </div>
                    <div className="bg-[#121420] p-2.5 rounded-lg border border-[#24293d]">
                      <div className="text-base font-bold text-zinc-100 font-serif tabular-nums">
                        {parsedResult.summary.importedArtifacts}
                      </div>
                      <div className="text-[11px] text-zinc-300 uppercase tracking-wider mt-0.5">
                        Artifacts
                      </div>
                    </div>
                  </div>

                  {/* Overwrite or Merge toggle */}
                  <label className="flex items-center gap-2.5 text-xs text-zinc-200 cursor-pointer pt-1 min-h-[36px]">
                    <input
                      type="checkbox"
                      checked={overwriteAll}
                      onChange={(e) => setOverwriteAll(e.target.checked)}
                      className="w-4 h-4 rounded border-[#323954] bg-[#121420] accent-[#d4af37] cursor-pointer"
                    />
                    <span>
                      Overwrite entire roster (uncheck to merge with existing characters)
                    </span>
                  </label>
                </div>
              )}
            </div>
          ) : (
            <div
              id="good-panel-export"
              role="tabpanel"
              aria-labelledby="good-tab-export"
              className="space-y-4"
            >
              <div className="p-4 rounded-xl bg-[#161a29] border border-[#282f48] text-xs text-zinc-200 space-y-2.5">
                <div className="flex items-center gap-2 font-semibold text-zinc-100">
                  <ShieldCheck className="w-4 h-4 text-[#d4af37]" aria-hidden="true" />
                  <span>Full Roster &amp; Inventory Snapshot</span>
                </div>
                <p className="text-zinc-300 leading-relaxed">
                  Your exported file contains all configured characters, active constellations (C0–C6), talent levels, equipped weapons, and stored artifacts in standard GOOD v2 format.
                </p>
                <div className="pt-1 flex flex-wrap items-center gap-4 text-xs font-mono text-zinc-200">
                  <span>Characters: {Object.keys(profiles).length}</span>
                  <span>Weapons: {(weapons || getSavedWeapons()).length}</span>
                  <span>Preserved Artifacts: {getSavedArtifacts().length}</span>
                </div>
              </div>

              {exportError && (
                <div
                  role="alert"
                  className="p-3 rounded-xl bg-rose-950/50 border border-rose-400/50 text-rose-100 text-xs flex items-start gap-2"
                >
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-300 mt-0.5" aria-hidden="true" />
                  <span>{exportError}</span>
                </div>
              )}

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={handleDownloadExport}
                  className="flex-1 min-h-[44px] py-2.5 px-4 rounded-xl bg-[#d4af37] text-[#0a0b0e] font-bold text-xs flex items-center justify-center gap-2 hover:bg-[#e5c14d] transition-colors cursor-pointer shadow-md"
                >
                  <Download className="w-4 h-4" aria-hidden="true" />
                  <span>Download .json File</span>
                </button>
                <button
                  type="button"
                  onClick={handleCopyExport}
                  className="min-h-[44px] py-2.5 px-4 rounded-xl bg-[#1a1e2e] text-zinc-100 border border-[#323954] text-xs font-semibold flex items-center justify-center gap-2 hover:bg-[#252b42] transition-colors cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-300" aria-hidden="true" />
                      <span className="text-emerald-300">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" aria-hidden="true" />
                      <span>Copy to Clipboard</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 sm:px-6 py-4 border-t border-[#24293d] bg-[#161926] flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] sm:min-h-[38px] px-4 py-2 rounded-xl text-xs font-semibold text-zinc-200 hover:text-white bg-[#1a1e2e] hover:bg-[#252b42] border border-[#323954] transition-colors cursor-pointer"
          >
            {activeTab === 'import' ? 'Cancel' : 'Close'}
          </button>
          {activeTab === 'import' && (
            <button
              type="button"
              onClick={handleApplyImport}
              disabled={!parsedResult}
              className={`min-h-[44px] sm:min-h-[38px] px-5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors ${
                parsedResult
                  ? 'bg-[#d4af37] text-[#0a0b0e] hover:bg-[#e5c14d] shadow-md cursor-pointer'
                  : 'bg-[#1c2030] text-zinc-400 border border-[#2a3048] cursor-not-allowed'
              }`}
            >
              <Check className="w-4 h-4" aria-hidden="true" />
              <span>Apply Import</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
