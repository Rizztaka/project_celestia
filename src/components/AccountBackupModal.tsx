import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Download,
  Upload,
  Database,
  CheckCircle2,
  AlertTriangle,
  Undo2,
  RefreshCw,
  FileCheck,
} from 'lucide-react';
import {
  validateBackupData,
  importAccountBackup,
  rollbackPreRestoreBackup,
  downloadBackupFile,
  getLastBackupMeta,
  type LastBackupMetadata,
  type CelestiaBackupData,
  type ValidationResult,
} from '../services/backup';
import { isDemoModeEnabled } from '../services/storage';

interface AccountBackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRestoreSuccess?: () => void;
}

export const AccountBackupModal: React.FC<AccountBackupModalProps> = ({
  isOpen,
  onClose,
  onRestoreSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<'backup' | 'restore'>('backup');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<CelestiaBackupData | null>(null);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [hasRollbackAvailable, setHasRollbackAvailable] = useState<boolean>(false);
  const [lastBackupMeta, setLastBackupMeta] = useState<LastBackupMetadata | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setStatusMessage(null);
      setParsedData(null);
      setValidation(null);
      setParseError(null);
      setSelectedFile(null);
      try {
        const hasBackup = typeof localStorage !== 'undefined' && localStorage.getItem('celestia_backup_pre_restore') !== null;
        setHasRollbackAvailable(hasBackup);
        setLastBackupMeta(getLastBackupMeta());
      } catch {
        setHasRollbackAvailable(false);
        setLastBackupMeta(null);
      }
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processFile(file);
    e.target.value = '';
  };

  const processFile = (file: File) => {
    setSelectedFile(file);
    setStatusMessage(null);
    setParseError(null);
    setValidation(null);
    setParsedData(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const json = JSON.parse(text);
        const valResult = validateBackupData(json);
        setValidation(valResult);
        if (valResult.valid) {
          setParsedData(json as CelestiaBackupData);
        }
      } catch (err: any) {
        setParseError(`Failed to parse JSON file: ${err?.message || 'Invalid JSON syntax'}`);
      }
    };
    reader.onerror = () => {
      setParseError('Failed to read the selected backup file.');
    };
    reader.readAsText(file);
  };

  const handleExecuteRestore = () => {
    if (!parsedData) return;
    const res = importAccountBackup(parsedData);
    if (res.success) {
      setStatusMessage({
        type: 'success',
        text: 'Account state restored successfully! A safety snapshot was preserved in case you need to undo.',
      });
      setHasRollbackAvailable(true);
      if (onRestoreSuccess) {
        onRestoreSuccess();
      }
    } else {
      setStatusMessage({
        type: 'error',
        text: res.error || 'Failed to restore account backup.',
      });
    }
  };

  const handleRollback = () => {
    const ok = rollbackPreRestoreBackup();
    if (ok) {
      setStatusMessage({
        type: 'success',
        text: 'Successfully rolled back to the pre-restore state.',
      });
      if (onRestoreSuccess) {
        onRestoreSuccess();
      }
    } else {
      setStatusMessage({
        type: 'error',
        text: 'Failed to rollback: pre-restore snapshot not found.',
      });
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="backup-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-zinc-900 border border-zinc-750 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-950/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 id="backup-modal-title" className="text-base font-bold text-white tracking-wide">
                Account Backup & Restore
              </h2>
              <p className="text-xs text-zinc-400">
                Native JSON backup with schema validation and rollback safety
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Controls */}
        <div className="flex border-b border-zinc-800 bg-zinc-900/60 px-6 pt-3 gap-4">
          <button
            onClick={() => setActiveTab('backup')}
            className={`pb-2.5 text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer border-b-2 ${
              activeTab === 'backup'
                ? 'border-purple-500 text-purple-300'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            Create Backup
          </button>
          <button
            onClick={() => setActiveTab('restore')}
            className={`pb-2.5 text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer border-b-2 ${
              activeTab === 'restore'
                ? 'border-purple-500 text-purple-300'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            Restore Backup
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-sm">
          {statusMessage && (
            <div
              className={`p-3.5 rounded-xl border flex items-start gap-2.5 ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
                  : 'bg-red-950/30 border-red-500/40 text-red-300'
              }`}
            >
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0 text-emerald-400" />
              ) : (
                <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-red-400" />
              )}
              <div className="text-xs leading-relaxed">{statusMessage.text}</div>
            </div>
          )}

          {activeTab === 'backup' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-zinc-950/50 border border-zinc-800 space-y-2">
                <h3 className="text-xs font-semibold text-zinc-200 flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-purple-400" />
                  What is included in Celestia native backup:
                </h3>
                <ul className="text-xs text-zinc-400 space-y-1 list-disc list-inside">
                  <li>Owned roster & custom character profiles (levels, constellations, talents)</li>
                  <li>Equipped and unequipped weapons armory with refinements</li>
                  <li>Pull budget configuration, current pity counts, and Capturing Radiance state</li>
                  <li>Spiral Abyss cycles & custom sandbox floor configurations</li>
                  <li>Schema version tag (Version 2) and game baseline metadata (v7.2)</li>
                </ul>
              </div>

              {isDemoModeEnabled() && (
                <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-800/50 text-xs text-amber-300 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>
                    Demo Mode is active. Exporting demo sandbox state. Exit Demo Mode to export authentic account data.
                  </span>
                </div>
              )}

              {lastBackupMeta && (
                <div className="p-3 rounded-xl bg-purple-950/20 border border-purple-800/40 text-xs text-purple-300 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />
                    <span>
                      Last exported: {new Date(lastBackupMeta.exportedAt).toLocaleDateString()} at {new Date(lastBackupMeta.exportedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <span className="text-[11px] text-zinc-400">
                    {lastBackupMeta.characterCount} chars · {lastBackupMeta.weaponCount} weps
                  </span>
                </div>
              )}

              <div className="flex flex-col gap-2 pt-2">
                <button
                  onClick={() => {
                    downloadBackupFile();
                    setLastBackupMeta(getLastBackupMeta());
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2 shadow-lg shadow-purple-950/30 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  Download Celestia Backup (.json)
                </button>
                <p className="text-[11px] text-zinc-500 text-center">
                  Saves a timestamped, validated JSON file to your local device.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'restore' && (
            <div className="space-y-4">
              {/* File upload drag area */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-zinc-700 hover:border-purple-500/50 rounded-xl p-5 text-center cursor-pointer transition-colors bg-zinc-950/30"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,application/json"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <Upload className="w-6 h-6 mx-auto text-purple-400 mb-2" />
                <p className="text-xs font-semibold text-zinc-200">
                  {selectedFile ? selectedFile.name : 'Select Celestia Backup File (.json)'}
                </p>
                <p className="text-[11px] text-zinc-500 mt-1">
                  Click to browse your device for a valid native backup file
                </p>
              </div>

              {parseError && (
                <div className="p-3 rounded-xl bg-red-950/30 border border-red-500/40 text-red-300 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
                  <span>{parseError}</span>
                </div>
              )}

              {validation && !validation.valid && (
                <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-500/40 text-amber-300 text-xs space-y-1.5">
                  <div className="font-semibold flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    Validation Failed:
                  </div>
                  <ul className="list-disc list-inside space-y-1 text-amber-200/90 text-[11px]">
                    {validation.errors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}

              {validation && validation.valid && validation.summary && parsedData && (
                <div className="p-4 rounded-xl bg-zinc-950/60 border border-purple-500/30 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-purple-300 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      Valid Backup Verified
                    </span>
                    <span className="text-zinc-500 text-[11px]">
                      {new Date(validation.summary.exportedAt).toLocaleString()}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="p-2 rounded-lg bg-zinc-900 border border-zinc-800">
                      <div className="text-[10px] text-zinc-400">Characters</div>
                      <div className="font-bold text-white text-sm">{validation.summary.characterCount}</div>
                    </div>
                    <div className="p-2 rounded-lg bg-zinc-900 border border-zinc-800">
                      <div className="text-[10px] text-zinc-400">Weapons</div>
                      <div className="font-bold text-white text-sm">{validation.summary.weaponCount}</div>
                    </div>
                    <div className="p-2 rounded-lg bg-zinc-900 border border-zinc-800">
                      <div className="text-[10px] text-zinc-400">Artifacts</div>
                      <div className="font-bold text-white text-sm">{validation.summary.artifactCount}</div>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-purple-950/20 border border-purple-500/20 text-[11px] text-zinc-300 space-y-1">
                    <p className="text-purple-300 font-semibold">Automatic Rollback Guard:</p>
                    <p>
                      Restoring will overwrite current roster and armory data. An immutable safety snapshot
                      (<code className="text-purple-300">celestia_backup_pre_restore</code>) will be recorded automatically.
                    </p>
                  </div>

                  <button
                    onClick={handleExecuteRestore}
                    className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Confirm & Restore Account
                  </button>
                </div>
              )}

              {/* Rollback section */}
              {hasRollbackAvailable && (
                <div className="pt-2 border-t border-zinc-800 flex items-center justify-between">
                  <div className="text-xs text-zinc-400">
                    Pre-restore snapshot exists.
                  </div>
                  <button
                    onClick={handleRollback}
                    className="py-1.5 px-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Undo2 className="w-3.5 h-3.5 text-amber-400" />
                    Undo Previous Restore
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-zinc-800 bg-zinc-950/40 flex justify-end">
          <button
            onClick={onClose}
            className="py-1.5 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
