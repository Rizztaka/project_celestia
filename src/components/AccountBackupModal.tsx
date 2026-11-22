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
  ShieldAlert,
  Info,
} from 'lucide-react';
import {
  validateBackupData,
  importAccountBackup,
  rollbackPreRestoreBackup,
  downloadBackupFile,
  getLastBackupMeta,
  detectAccountConflict,
  type LastBackupMetadata,
  type CelestiaBackupData,
  type ValidationResult,
  type AccountConflictResult,
} from '../services/backup';
import { isDemoModeEnabled, isStorageAvailable, getLastStorageErrorInfo } from '../services/storage';
import { formatGameVersion, CURRENT_GAME_VERSION } from '../data/game-version';
import { useModalAccessibility } from '../hooks/useModalAccessibility';

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
  const [conflict, setConflict] = useState<AccountConflictResult | null>(null);
  const [confirmOverwrite, setConfirmOverwrite] = useState<boolean>(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [hasRollbackAvailable, setHasRollbackAvailable] = useState<boolean>(false);
  const [lastBackupMeta, setLastBackupMeta] = useState<LastBackupMetadata | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [storageHealthy, setStorageHealthy] = useState<boolean>(true);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  useModalAccessibility({
    isOpen,
    onClose,
    containerRef: dialogRef,
    initialFocusRef: closeBtnRef,
  });

  useEffect(() => {
    if (isOpen) {
      setStatusMessage(null);
      setParsedData(null);
      setValidation(null);
      setConflict(null);
      setConfirmOverwrite(false);
      setParseError(null);
      setSelectedFile(null);
      setIsDragging(false);

      const healthy = isStorageAvailable();
      setStorageHealthy(healthy);

      try {
        const hasBackup =
          typeof localStorage !== 'undefined' &&
          localStorage.getItem('celestia_backup_pre_restore') !== null;
        setHasRollbackAvailable(hasBackup);
        setLastBackupMeta(getLastBackupMeta());
      } catch {
        setHasRollbackAvailable(false);
        setLastBackupMeta(null);
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const processFile = (file: File) => {
    setSelectedFile(file);
    setStatusMessage(null);
    setParseError(null);
    setValidation(null);
    setParsedData(null);
    setConflict(null);
    setConfirmOverwrite(false);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = String(event.target?.result ?? '');
        const json = JSON.parse(text);
        const valResult = validateBackupData(json);
        setValidation(valResult);
        if (valResult.valid) {
          const typedData = json as CelestiaBackupData;
          setParsedData(typedData);
          const detectedConflict = detectAccountConflict(typedData);
          setConflict(detectedConflict.hasConflict ? detectedConflict : null);
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Invalid JSON syntax';
        setParseError(`Failed to parse JSON file: ${msg}`);
      }
    };
    reader.onerror = () => {
      setParseError('Failed to read the selected backup file.');
    };
    reader.readAsText(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processFile(file);
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    processFile(file);
  };

  const handleDownloadBackup = () => {
    try {
      downloadBackupFile();
      setLastBackupMeta(getLastBackupMeta());
      setStatusMessage({
        type: 'success',
        text: 'Backup file downloaded. Keep it safe in case you clear browser storage or switch devices.',
      });
    } catch {
      setStatusMessage({
        type: 'error',
        text: 'Unable to export backup file in this browser environment.',
      });
    }
  };

  const handleExecuteRestore = () => {
    if (!parsedData) return;
    if (conflict?.hasConflict && !confirmOverwrite) {
      setStatusMessage({
        type: 'error',
        text: 'Please confirm account overwrite before restoring a backup from a different UID.',
      });
      return;
    }

    const res = importAccountBackup(parsedData, { forceOverwrite: confirmOverwrite });
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
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        className="bg-[#121420] border border-[#2c334d] rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] focus:outline-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-[#24293d] bg-[#161926] gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-purple-500/15 border border-purple-400/35 flex items-center justify-center text-purple-300 shrink-0">
              <Database className="w-5 h-5" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <h2
                id="backup-modal-title"
                className="text-base sm:text-lg font-bold text-zinc-100 font-serif tracking-wide"
              >
                Account Backup &amp; Restore
              </h2>
              <p className="text-xs text-zinc-300 mt-0.5">
                Native JSON backup with schema validation and rollback safety
              </p>
            </div>
          </div>
          <button
            ref={closeBtnRef}
            type="button"
            onClick={onClose}
            className="min-w-[40px] min-h-[40px] rounded-xl flex items-center justify-center text-zinc-300 hover:text-white hover:bg-[#22283d] transition-colors cursor-pointer shrink-0"
            aria-label="Close"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Tab Controls */}
        <div
          role="tablist"
          aria-label="Backup and restore options"
          className="flex border-b border-[#24293d] bg-[#131624] px-5 sm:px-6 gap-2"
        >
          <button
            id="backup-tab-create"
            type="button"
            role="tab"
            aria-selected={activeTab === 'backup'}
            aria-controls="backup-panel-create"
            onClick={() => setActiveTab('backup')}
            className={`min-h-[44px] py-2.5 px-3 text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer border-b-2 ${
              activeTab === 'backup'
                ? 'border-purple-400 text-purple-200'
                : 'border-transparent text-zinc-300 hover:text-white'
            }`}
          >
            <Download className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Create Backup</span>
          </button>
          <button
            id="backup-tab-restore"
            type="button"
            role="tab"
            aria-selected={activeTab === 'restore'}
            aria-controls="backup-panel-restore"
            onClick={() => setActiveTab('restore')}
            className={`min-h-[44px] py-2.5 px-3 text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer border-b-2 ${
              activeTab === 'restore'
                ? 'border-purple-400 text-purple-200'
                : 'border-transparent text-zinc-300 hover:text-white'
            }`}
          >
            <Upload className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Restore Backup</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-sm flex-1">
          {!storageHealthy && (
            <div
              role="alert"
              className="p-3.5 rounded-xl bg-amber-950/60 border border-amber-500/60 text-amber-200 text-xs flex items-start gap-2.5"
            >
              <AlertTriangle className="w-4 h-4 text-amber-300 mt-0.5 shrink-0" aria-hidden="true" />
              <div>
                <strong className="font-semibold block">Browser Storage Restricted:</strong>
                <span>
                  localStorage is unavailable or blocked in this window. Any modifications or restored accounts may not persist across browser restarts.
                </span>
                {getLastStorageErrorInfo()?.message && (
                  <p className="mt-1 font-mono text-[11px] text-amber-300/80">
                    Diagnostic: {getLastStorageErrorInfo()?.message}
                  </p>
                )}
              </div>
            </div>
          )}

          {statusMessage && (
            <div
              role={statusMessage.type === 'error' ? 'alert' : 'status'}
              className={`p-3.5 rounded-xl border flex items-start gap-2.5 ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-950/50 border-emerald-400/50 text-emerald-100'
                  : 'bg-rose-950/50 border-rose-400/50 text-rose-100'
              }`}
            >
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0 text-emerald-300" aria-hidden="true" />
              ) : (
                <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-rose-300" aria-hidden="true" />
              )}
              <div className="text-xs leading-relaxed">{statusMessage.text}</div>
            </div>
          )}

          {activeTab === 'backup' && (
            <div
              id="backup-panel-create"
              role="tabpanel"
              aria-labelledby="backup-tab-create"
              className="space-y-4"
            >
              <div className="p-4 rounded-xl bg-[#161a29] border border-[#282f48] space-y-2.5">
                <h3 className="text-xs font-semibold text-zinc-100 flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-purple-300" aria-hidden="true" />
                  <span>What is included in Celestia native backup:</span>
                </h3>
                <ul className="text-xs text-zinc-300 space-y-1.5 list-disc list-inside leading-relaxed">
                  <li>Active Account UID (for profile identification &amp; sync matching)</li>
                  <li>Owned roster &amp; custom character profiles (levels, constellations, talents, weapons)</li>
                  <li>Equipped and unequipped weapons armory with refinements and levels</li>
                  <li>Pull budget configuration, current pity counts, and Capturing Radiance state</li>
                  <li>Spiral Abyss cycles &amp; custom sandbox floor configurations</li>
                  <li>
                    Schema version tag (Version 2) and game baseline metadata (
                    {formatGameVersion(CURRENT_GAME_VERSION)})
                  </li>
                </ul>
              </div>

              {isDemoModeEnabled() && (
                <div
                  role="status"
                  className="p-3.5 rounded-xl bg-amber-950/45 border border-amber-400/45 text-xs text-amber-100 flex items-start gap-2"
                >
                  <AlertTriangle className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" aria-hidden="true" />
                  <span>
                    Demo Mode is active. Exporting demo sandbox state. Exit Demo Mode to export authentic account data.
                  </span>
                </div>
              )}

              {lastBackupMeta ? (
                <div className="p-3.5 rounded-xl bg-purple-950/30 border border-purple-400/35 text-xs text-purple-100 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-purple-300 shrink-0" aria-hidden="true" />
                    <span>
                      Last exported: {new Date(lastBackupMeta.exportedAt).toLocaleDateString()} at{' '}
                      {new Date(lastBackupMeta.exportedAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <span className="text-xs font-mono text-zinc-200">
                    {lastBackupMeta.characterCount} chars · {lastBackupMeta.weaponCount} weps · {lastBackupMeta.artifactCount} arts
                  </span>
                </div>
              ) : (
                <div className="p-3.5 rounded-xl bg-[#1c1828] border border-amber-500/40 text-xs text-amber-200 flex items-start gap-2.5">
                  <Info className="w-4 h-4 text-amber-300 mt-0.5 shrink-0" aria-hidden="true" />
                  <div className="space-y-1">
                    <strong className="font-semibold text-amber-100 block">No Backup Created Yet</strong>
                    <p className="text-zinc-300 leading-relaxed">
                      Your character calibrations and armory exist only in your browser&apos;s local storage. Download a backup now to ensure you can recover your progress anytime.
                    </p>
                  </div>
                </div>
              )}

              {/* 3-Step Recovery Guidance */}
              <div className="p-4 rounded-xl bg-[#141624] border border-[#23283e] space-y-2">
                <h4 className="text-xs font-semibold text-zinc-200">How Account Recovery Works:</h4>
                <ol className="text-xs text-zinc-400 space-y-1 list-decimal list-inside leading-relaxed">
                  <li><strong className="text-zinc-300">Download:</strong> Save the validated JSON file to your device or cloud drive.</li>
                  <li><strong className="text-zinc-300">Safety:</strong> Keep a copy before clearing browser site data or switching computers.</li>
                  <li><strong className="text-zinc-300">Restore:</strong> Drag &amp; drop the file into the Restore tab on any device to resume immediately.</li>
                </ol>
              </div>

              <div className="flex flex-col gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleDownloadBackup}
                  className="w-full min-h-[44px] py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2 shadow-lg shadow-purple-950/30 cursor-pointer"
                >
                  <Download className="w-4 h-4" aria-hidden="true" />
                  <span>Download Celestia Backup (.json)</span>
                </button>
                <p className="text-xs text-zinc-400 text-center">
                  Saves a timestamped, validated JSON file to your local device.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'restore' && (
            <div
              id="backup-panel-restore"
              role="tabpanel"
              aria-labelledby="backup-tab-restore"
              className="space-y-4"
            >
              {/* Accessible file picker + drag-and-drop */}
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                aria-label="Select Celestia backup file"
                className="sr-only"
                onChange={handleFileChange}
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
                className={`w-full border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-colors ${
                  isDragging
                    ? 'border-purple-400 bg-purple-500/15'
                    : 'border-[#323954] hover:border-purple-400/70 bg-[#161928] hover:bg-[#1a1f32]'
                }`}
              >
                <Upload className="w-6 h-6 mx-auto text-purple-300 mb-2" aria-hidden="true" />
                <span className="block text-xs font-semibold text-zinc-100 break-all">
                  {selectedFile ? selectedFile.name : 'Select Celestia Backup File (.json)'}
                </span>
                <span className="block text-xs text-zinc-300 mt-1">
                  Click or drag &amp; drop a valid native backup file from your device
                </span>
              </button>

              {parseError && (
                <div
                  role="alert"
                  className="p-3.5 rounded-xl bg-rose-950/50 border border-rose-400/50 text-rose-100 text-xs flex items-start gap-2"
                >
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-300 mt-0.5" aria-hidden="true" />
                  <span>{parseError}</span>
                </div>
              )}

              {validation && !validation.valid && (
                <div
                  role="alert"
                  className="p-3.5 rounded-xl bg-amber-950/45 border border-amber-400/50 text-amber-100 text-xs space-y-1.5"
                >
                  <div className="font-semibold flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-300" aria-hidden="true" />
                    <span>Validation Failed:</span>
                  </div>
                  <ul className="list-disc list-inside space-y-1 text-amber-100/90 text-xs">
                    {validation.errors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}

              {validation && validation.valid && validation.summary && parsedData && (
                <div
                  aria-live="polite"
                  className="p-4 rounded-xl bg-[#161a29] border border-purple-400/40 space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span className="font-semibold text-purple-200 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-300" aria-hidden="true" />
                      <span>Valid Backup Verified</span>
                    </span>
                    <span className="text-zinc-300 text-[11px] font-mono">
                      {new Date(validation.summary.exportedAt).toLocaleString()}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="p-2.5 rounded-lg bg-[#121420] border border-[#24293d]">
                      <div className="text-[11px] text-zinc-300">Characters</div>
                      <div className="font-bold text-white text-sm font-serif tabular-nums mt-0.5">
                        {validation.summary.characterCount}
                      </div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-[#121420] border border-[#24293d]">
                      <div className="text-[11px] text-zinc-300">Weapons</div>
                      <div className="font-bold text-white text-sm font-serif tabular-nums mt-0.5">
                        {validation.summary.weaponCount}
                      </div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-[#121420] border border-[#24293d]">
                      <div className="text-[11px] text-zinc-300">Artifacts</div>
                      <div className="font-bold text-white text-sm font-serif tabular-nums mt-0.5">
                        {validation.summary.artifactCount}
                      </div>
                    </div>
                  </div>

                  {validation.summary.uid && (
                    <div className="text-xs text-zinc-300 bg-[#121420] px-3 py-1.5 rounded-lg border border-[#24293d] flex items-center justify-between">
                      <span>Backup Account UID:</span>
                      <span className="font-mono font-semibold text-purple-300">{validation.summary.uid}</span>
                    </div>
                  )}

                  {/* Conflict detection alert */}
                  {conflict && (
                    <div
                      role="alert"
                      className="p-3.5 rounded-xl bg-amber-950/60 border border-amber-500/60 text-amber-100 text-xs space-y-2.5"
                    >
                      <div className="flex items-start gap-2">
                        <ShieldAlert className="w-4 h-4 text-amber-300 mt-0.5 shrink-0" aria-hidden="true" />
                        <div>
                          <strong className="font-bold block text-amber-200">Cross-Account Identity Warning:</strong>
                          <p className="mt-0.5 leading-relaxed text-amber-100/90">
                            {conflict.reason === 'uid_mismatch'
                              ? `Active account (UID: ${conflict.currentUid}) differs from this backup (UID: ${conflict.incomingUid}).`
                              : `Your active account has ${conflict.currentCharacterCount} characters. Restoring this backup will replace them.`}
                          </p>
                        </div>
                      </div>
                      <label className="flex items-center gap-2 cursor-pointer pt-1 border-t border-amber-500/30">
                        <input
                          type="checkbox"
                          checked={confirmOverwrite}
                          onChange={(e) => setConfirmOverwrite(e.target.checked)}
                          className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 border-zinc-600"
                        />
                        <span className="font-semibold text-white">
                          I confirm I want to overwrite my active account data with this backup
                        </span>
                      </label>
                    </div>
                  )}

                  <div className="p-3 rounded-lg bg-purple-950/30 border border-purple-400/25 text-xs text-zinc-200 space-y-1">
                    <p className="text-purple-200 font-semibold">Automatic Rollback Guard:</p>
                    <p className="leading-relaxed">
                      Restoring replaces your current roster and armory data. An automatic safety snapshot (
                      <code className="text-purple-200 font-mono">celestia_backup_pre_restore</code>) is saved first so you can undo anytime.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleExecuteRestore}
                    disabled={Boolean(conflict && !confirmOverwrite)}
                    className={`w-full min-h-[44px] py-2.5 px-4 rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-2 shadow-md ${
                      conflict && !confirmOverwrite
                        ? 'bg-zinc-700 text-zinc-400 cursor-not-allowed'
                        : 'bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer'
                    }`}
                  >
                    <RefreshCw className="w-4 h-4" aria-hidden="true" />
                    <span>Confirm &amp; Restore Account</span>
                  </button>
                </div>
              )}

              {/* Rollback section */}
              {hasRollbackAvailable && (
                <div className="pt-3 border-t border-[#24293d] flex flex-wrap items-center justify-between gap-2">
                  <div className="text-xs text-zinc-300">Pre-restore safety snapshot available.</div>
                  <button
                    type="button"
                    onClick={handleRollback}
                    className="min-h-[40px] sm:min-h-[36px] py-1.5 px-3 rounded-xl bg-[#1a1e2e] hover:bg-[#252b42] text-zinc-100 border border-[#323954] text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Undo2 className="w-3.5 h-3.5 text-amber-300" aria-hidden="true" />
                    <span>Undo Previous Restore</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 sm:px-6 py-3.5 border-t border-[#24293d] bg-[#161926] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] sm:min-h-[38px] py-2 px-4 rounded-xl bg-[#1a1e2e] hover:bg-[#252b42] text-zinc-100 border border-[#323954] text-xs font-semibold transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default AccountBackupModal;
