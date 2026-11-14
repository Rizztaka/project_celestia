import React, { useState, useRef } from 'react';
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
import type { OwnedCharacterProfile } from '../types/genshin';
import {
  parseGOODJSON,
  mapGOODToCelestiaProfiles,
  exportToGOODJSON,
  mergeRosterProfiles,
  type GOODMapResult,
} from '../services/good-parser';
import { getSavedArtifacts, saveArtifacts } from '../services/storage';

interface GoodImportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  profiles: Record<string, OwnedCharacterProfile>;
  onImportSuccess: (
    mergedProfiles: Record<string, OwnedCharacterProfile>,
    message: string,
  ) => void;
}

export const GoodImportExportModal: React.FC<GoodImportExportModalProps> = ({
  isOpen,
  onClose,
  profiles,
  onImportSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<'import' | 'export'>('import');
  const [rawText, setRawText] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [parsedResult, setParsedResult] = useState<GOODMapResult | null>(null);
  const [sourceName, setSourceName] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [overwriteAll, setOverwriteAll] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setRawText(content);
      handleProcessJSON(content, file.name);
    };
    reader.onerror = () => {
      setErrorMsg('Failed to read file from disk.');
    };
    reader.readAsText(file);
  };

  const handleApplyImport = () => {
    if (!parsedResult) return;

    const merged = mergeRosterProfiles(profiles, parsedResult.profiles, overwriteAll);

    // If artifacts were present in the GOOD file, persist them
    if (parsedResult.rawArtifacts && parsedResult.rawArtifacts.length > 0) {
      saveArtifacts(parsedResult.rawArtifacts);
    }

    const count = Object.keys(parsedResult.profiles).length;
    const msg = `Successfully imported ${count} character profiles${
      parsedResult.summary.importedWeapons > 0
        ? ` with ${parsedResult.summary.importedWeapons} equipped weapons`
        : ''
    } from ${sourceName || 'GOOD JSON'}!`;

    onImportSuccess(merged, msg);
    onClose();
  };

  const handleDownloadExport = () => {
    const artifacts = getSavedArtifacts();
    const jsonStr = exportToGOODJSON(profiles, artifacts);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `celestia_roster_backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopyExport = () => {
    const artifacts = getSavedArtifacts();
    const jsonStr = exportToGOODJSON(profiles, artifacts);
    navigator.clipboard.writeText(jsonStr);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#12141f] border border-[#2b3149] rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#202538] bg-[#161926]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#d4af37]/15 border border-[#d4af37]/30 flex items-center justify-center text-[#d4af37]">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-zinc-100 font-serif">
                Universal Roster Portability (GOOD Format)
              </h2>
              <p className="text-xs text-zinc-400">
                100% Client-Side JSON import & export compatible with Amenoma, Inventory Klee, and Genshin Optimizer
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-[#202538] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-[#202538] bg-[#131522] px-6">
          <button
            onClick={() => setActiveTab('import')}
            className={`py-3 px-4 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'import'
                ? 'border-[#d4af37] text-[#d4af37]'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Import GOOD JSON</span>
          </button>
          <button
            onClick={() => setActiveTab('export')}
            className={`py-3 px-4 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'export'
                ? 'border-[#d4af37] text-[#d4af37]'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Roster Backup</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {activeTab === 'import' ? (
            <div className="space-y-4">
              {/* File Dropzone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-[#2b334d] hover:border-[#d4af37]/60 bg-[#161825]/60 hover:bg-[#1a1e30] rounded-xl p-6 text-center cursor-pointer transition-colors"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept=".json,application/json"
                  className="hidden"
                />
                <Upload className="w-8 h-8 text-[#d4af37] mx-auto mb-2" />
                <p className="text-sm font-semibold text-zinc-200">
                  {fileName ? fileName : 'Click to select or drag & drop GOOD .json file'}
                </p>
                <p className="text-xs text-zinc-400 mt-1">
                  Supports exported JSON from Inventory Klee, Amenoma, Irminsul, Seelie, and Genshin Optimizer
                </p>
              </div>

              {/* Paste fallback */}
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1.5 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" />
                  <span>Or paste raw GOOD JSON text</span>
                </label>
                <textarea
                  value={rawText}
                  onChange={(e) => {
                    setRawText(e.target.value);
                    if (e.target.value.trim().startsWith('{')) {
                      handleProcessJSON(e.target.value);
                    }
                  }}
                  placeholder='{"format": "GOOD", "version": 2, "characters": [...]}'
                  rows={4}
                  className="w-full bg-[#0d0f17] border border-[#23283c] rounded-xl p-3 text-xs text-zinc-200 font-mono focus:outline-none focus:border-[#d4af37]"
                />
              </div>

              {/* Error feedback */}
              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-950/30 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Parsed summary preview */}
              {parsedResult && (
                <div className="p-4 rounded-xl bg-[#181d2e] border border-[#2b334d] space-y-3">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" />
                      Valid GOOD Data Detected
                    </span>
                    <span className="text-zinc-400 font-mono text-[11px]">
                      Source: {sourceName}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-[#12141f] p-2.5 rounded-lg border border-[#23283b]">
                      <div className="text-base font-bold text-zinc-100 font-serif">
                        {parsedResult.summary.importedCharacters}
                      </div>
                      <div className="text-[10px] text-zinc-400 uppercase tracking-wider mt-0.5">
                        Characters
                      </div>
                    </div>
                    <div className="bg-[#12141f] p-2.5 rounded-lg border border-[#23283b]">
                      <div className="text-base font-bold text-zinc-100 font-serif">
                        {parsedResult.summary.importedWeapons}
                      </div>
                      <div className="text-[10px] text-zinc-400 uppercase tracking-wider mt-0.5">
                        Weapons
                      </div>
                    </div>
                    <div className="bg-[#12141f] p-2.5 rounded-lg border border-[#23283b]">
                      <div className="text-base font-bold text-zinc-100 font-serif">
                        {parsedResult.summary.importedArtifacts}
                      </div>
                      <div className="text-[10px] text-zinc-400 uppercase tracking-wider mt-0.5">
                        Artifacts
                      </div>
                    </div>
                  </div>

                  {/* Overwrite or Merge toggle */}
                  <label className="flex items-center gap-2.5 text-xs text-zinc-300 cursor-pointer pt-1">
                    <input
                      type="checkbox"
                      checked={overwriteAll}
                      onChange={(e) => setOverwriteAll(e.target.checked)}
                      className="rounded border-[#2b334d] bg-[#12141f] text-[#d4af37] focus:ring-0 cursor-pointer"
                    />
                    <span>
                      Overwrite entire roster (uncheck to merge with existing characters)
                    </span>
                  </label>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-[#161a29] border border-[#262c44] text-xs text-zinc-300 space-y-2">
                <div className="flex items-center gap-2 font-semibold text-zinc-100">
                  <ShieldCheck className="w-4 h-4 text-[#d4af37]" />
                  <span>Full Roster & Inventory Snapshot</span>
                </div>
                <p className="text-zinc-400">
                  Your exported file contains all configured characters, their active constellations (C0–C6), talent levels, equipped weapons, and stored artifact bags in standard GOOD v2 format.
                </p>
                <div className="pt-2 flex items-center gap-4 text-xs font-mono text-zinc-400">
                  <span>Characters: {Object.keys(profiles).length}</span>
                  <span>
                    Equipped Weapons: {Object.values(profiles).filter((p) => p.weapon).length}
                  </span>
                  <span>Preserved Artifacts: {getSavedArtifacts().length}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={handleDownloadExport}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-[#d4af37] text-black font-semibold text-xs flex items-center justify-center gap-2 hover:bg-[#e2c158] transition-colors cursor-pointer shadow-lg"
                >
                  <Download className="w-4 h-4" />
                  <span>Download .json File</span>
                </button>
                <button
                  onClick={handleCopyExport}
                  className="py-2.5 px-4 rounded-xl bg-[#1e2336] text-zinc-200 border border-[#2f3754] text-xs font-semibold flex items-center gap-2 hover:bg-[#272e47] transition-colors cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span className="text-emerald-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copy to Clipboard</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        {activeTab === 'import' && (
          <div className="px-6 py-4 border-t border-[#202538] bg-[#141624] flex items-center justify-end gap-2.5">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-zinc-200 hover:bg-[#1f2438] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleApplyImport}
              disabled={!parsedResult}
              className={`px-5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer ${
                parsedResult
                  ? 'bg-[#d4af37] text-black font-bold hover:bg-[#e2c158] shadow-md'
                  : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
              }`}
            >
              <Check className="w-4 h-4" />
              <span>Apply Import</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
