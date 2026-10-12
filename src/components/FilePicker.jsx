import { useState, useRef, useId, useCallback } from 'react';
import { sdk } from '@/services/sdk';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import ApperIcon from '@/components/ApperIcon';
import { useIsMobile } from '@/hooks/useIsMobile';
import { cn } from '@/lib/utils';

const DEFAULT_CONFIG = {
  supportedExtensions: '',
  supportMultipleValues: true,
  minValue: 0,
  maxValue: 10240,
};

function normalizeConfig(raw) {
  const merged = { ...DEFAULT_CONFIG, ...raw };

  const ext = merged.supportedExtensions;
  merged.supportedExtensions = Array.isArray(ext)
    ? ext.filter(Boolean).join(',')
    : typeof ext === 'string' ? ext : '';

  const multi = merged.supportMultipleValues;
  merged.supportMultipleValues = typeof multi === 'string'
    ? multi !== 'false'
    : Boolean(multi ?? true);

  merged.minValue = Number(merged.minValue) || 0;
  merged.maxValue = Number(merged.maxValue) || 0;

  return merged;
}

const FILE_ICONS = {
  'application/pdf': 'FileText',
  'image/': 'Image',
  'video/': 'Video',
  'audio/': 'Music',
};

function getFileIcon(type) {
  if (!type) return 'File';
  for (const [prefix, icon] of Object.entries(FILE_ICONS)) {
    if (type.startsWith(prefix)) return icon;
  }
  return 'File';
}

function toBytes(size, isServerFile) {
  return isServerFile ? size * 1024 : size;
}

function formatSize(bytes) {
  if (!bytes) return '';
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}

function normalizeFile(file) {
  // Server files carry an Id (UUID on migrated backends); a falsy Id means a local, not-yet-uploaded file.
  const isServer = !!file.Id;
  return {
    ...file,
    _name: file.Name ?? file.name ?? 'Untitled',
    _type: file.Type ?? file.type ?? '',
    _bytes: toBytes(file.Size ?? file.size ?? 0, isServer),
    _isExisting: isServer,
  };
}

export default function FilePicker({
  value = [],
  onChange,
  fieldConfig = DEFAULT_CONFIG,
  maxFiles,
  readOnly = false,
  disabled = false,
}) {
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0, fileProgress: 0, fileName: '' });
  const inputRef = useRef(null);
  const filesRef = useRef(value);
  filesRef.current = Array.isArray(value) ? value : [];
  const inputId = useId();
  const isMobile = useIsMobile();

  const files = filesRef.current;
  const config = normalizeConfig(fieldConfig);
  const multiple = config.supportMultipleValues;
  const effectiveMaxFiles = maxFiles ?? (multiple ? Infinity : 1);
  const canAdd = !readOnly && !disabled && files.length < effectiveMaxFiles;

  const openFilePicker = useCallback(() => {
    if (!canAdd || uploading) return;
    inputRef.current?.click();
  }, [canAdd, uploading]);

  const processFiles = useCallback(async (rawFiles) => {
    if (!canAdd || uploading) return;
    const selected = Array.from(rawFiles);
    if (!selected.length) return;

    const remaining = effectiveMaxFiles - filesRef.current.length;
    if (selected.length > remaining) {
      toast.error(`Can only add ${remaining} more file${remaining === 1 ? '' : 's'}`);
      return;
    }

    // Deduplicate by name + size
    const existing = filesRef.current;
    const deduped = selected.filter(f =>
      !existing.some(e => (e.Name ?? e.name) === f.name && (e.Size ?? e.size ?? 0) === f.size)
    );
    if (!deduped.length) {
      toast.info('File already attached');
      return;
    }

    setUploading(true);
    setBatchProgress({ current: 0, total: deduped.length, fileProgress: 0, fileName: '' });
    const uploaded = [];

    for (let i = 0; i < deduped.length; i++) {
      const file = deduped[i];
      setBatchProgress(prev => ({ ...prev, current: i + 1, fileProgress: 0, fileName: file.name }));

      const validation = sdk.storage.validate(file, config);
      if (!validation.valid) {
        toast.error(`${file.name}: ${validation.error}`);
        continue;
      }

      try {
        const result = await sdk.storage.upload(file, {
          onProgress: (p) => setBatchProgress(prev => ({ ...prev, fileProgress: p })),
        });
        uploaded.push({
          ...result,
          size: result.size || file.size,
          name: result.name || file.name,
          type: result.type || file.type,
        });
      } catch (err) {
        toast.error(`Failed to upload ${file.name}: ${err.message ?? 'Unknown error'}`);
      }
    }

    if (uploaded.length) {
      onChange([...filesRef.current, ...uploaded]);
    }
    setUploading(false);
    setBatchProgress({ current: 0, total: 0, fileProgress: 0, fileName: '' });
    if (inputRef.current) inputRef.current.value = '';
  }, [canAdd, uploading, effectiveMaxFiles, config, onChange]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    processFiles(e.dataTransfer.files);
  }, [processFiles]);

  const handleRemove = useCallback((idx) => {
    onChange(filesRef.current.filter((_, i) => i !== idx));
  }, [onChange]);

  const handlePreview = useCallback(async (file) => {
    if (!file.Id) return;
    try {
      const { url } = await sdk.storage.preview(file);
      const win = window.open(url, '_blank', 'noopener,noreferrer');
      if (win) win.addEventListener('load', () => setTimeout(() => URL.revokeObjectURL(url), 1000));
    } catch {
      toast.error('Preview failed');
    }
  }, []);

  const handleDownload = useCallback(async (file) => {
    if (!file.Id) return;
    try {
      const { url, name } = await sdk.storage.download(file);
      const link = document.createElement('a');
      link.href = url;
      link.download = name;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 100);
    } catch {
      toast.error('Download failed');
    }
  }, []);

  const extList = config.supportedExtensions
    ? config.supportedExtensions.split(',').map(e => e.trim()).filter(Boolean)
    : [];

  const extensions = extList.length
    ? extList.map(e => `.${e}`).join(',')
    : undefined;

  const acceptHint = extList.length
    ? extList.map(e => e.toUpperCase()).join(', ')
    : null;

  const maxHint = config.maxValue ? `Max ${formatSize(config.maxValue * 1024)}` : null;

  // Overall batch progress percentage
  const overallProgress = batchProgress.total > 0
    ? (((batchProgress.current - 1) + batchProgress.fileProgress / 100) / batchProgress.total) * 100
    : 0;

  return (
    <div className="space-y-3">
      {/* Drop zone — hidden in readOnly mode */}
      {!readOnly && (
        <div
          role="button"
          tabIndex={canAdd ? 0 : -1}
          aria-label="Upload files"
          aria-disabled={!canAdd || uploading}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={openFilePicker}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openFilePicker(); } }}
          className={cn(
            'border-2 border-dashed rounded-lg transition-colors',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40',
            isMobile ? 'p-4' : 'p-6',
            canAdd && !uploading && 'cursor-pointer hover:border-primary/50 hover:bg-muted/30',
            dragOver && 'border-primary bg-primary/5',
            (!canAdd || uploading) && 'opacity-50 cursor-not-allowed',
            !dragOver && !uploading && canAdd && 'border-border',
          )}
        >
          <div className="flex flex-col items-center text-center gap-1.5">
            <ApperIcon
              name={uploading ? 'Loader' : 'Upload'}
              size={isMobile ? 20 : 24}
              className={cn('text-muted-foreground', uploading && 'animate-spin')}
            />

            {uploading ? (
              <>
                <p className="text-xs text-muted-foreground font-medium">
                  Uploading {batchProgress.current} of {batchProgress.total}
                </p>
                <p className="text-sm text-foreground font-medium truncate max-w-full">{batchProgress.fileName}</p>
                {/* Per-file progress */}
                <div className="h-1.5 w-48 max-w-full bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary transition-all duration-150" style={{ width: `${batchProgress.fileProgress}%` }} />
                </div>
                {/* Overall batch progress */}
                {batchProgress.total > 1 && (
                  <div className="h-1 w-48 max-w-full bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary/50 transition-all duration-150" style={{ width: `${overallProgress}%` }} />
                  </div>
                )}
                <p className="text-xs text-muted-foreground">{Math.round(batchProgress.fileProgress)}%</p>
              </>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">
                  {!canAdd
                    ? `Maximum ${effectiveMaxFiles} file${effectiveMaxFiles === 1 ? '' : 's'} reached`
                    : isMobile ? 'Tap to select files' : 'Drag & drop or click to upload'}
                </p>
                {canAdd && (acceptHint || maxHint) && (
                  <p className="text-xs text-muted-foreground/70">
                    {[acceptHint, maxHint].filter(Boolean).join(' · ')}
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        multiple={multiple && effectiveMaxFiles > 1}
        accept={extensions}
        onChange={(e) => processFiles(e.target.files ?? [])}
        className="hidden"
        id={inputId}
        disabled={!canAdd || uploading}
        aria-hidden="true"
      />

      {/* File list */}
      {files.length > 0 && (
        <div className="space-y-1.5" role="list" aria-label="Attached files">
          {files.map((raw, idx) => {
            const file = normalizeFile(raw);
            return (
              <div
                key={raw.Id ?? raw.path ?? idx}
                role="listitem"
                className={cn(
                  'flex items-center gap-2 rounded-md border border-border/50',
                  'transition-colors hover:bg-muted',
                  isMobile ? 'p-2.5' : 'p-2',
                )}
              >
                <ApperIcon name={getFileIcon(file._type)} size={16} className="shrink-0 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate leading-tight">{file._name}</p>
                  {file._bytes > 0 && (
                    <p className="text-xs text-muted-foreground">{formatSize(file._bytes)}</p>
                  )}
                </div>
                <div className="flex items-center shrink-0">
                  {file._isExisting && (
                    <>
                      <Button
                        type="button" variant="ghost"
                        className={cn(isMobile ? 'size-9' : 'size-7', 'p-0')}
                        onClick={() => handlePreview(raw)}
                        aria-label={`Preview ${file._name}`}
                      >
                        <ApperIcon name="Eye" size={14} />
                      </Button>
                      <Button
                        type="button" variant="ghost"
                        className={cn(isMobile ? 'size-9' : 'size-7', 'p-0')}
                        onClick={() => handleDownload(raw)}
                        aria-label={`Download ${file._name}`}
                      >
                        <ApperIcon name="Download" size={14} />
                      </Button>
                    </>
                  )}
                  {!readOnly && (
                    <Button
                      type="button" variant="ghost"
                      className={cn(isMobile ? 'size-9' : 'size-7', 'p-0 text-destructive hover:text-destructive')}
                      onClick={() => handleRemove(idx)}
                      disabled={disabled}
                      aria-label={`Remove ${file._name}`}
                    >
                      <ApperIcon name="Trash2" size={14} />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Empty state for readOnly */}
      {readOnly && files.length === 0 && (
        <p className="text-sm text-muted-foreground">No attachments</p>
      )}
    </div>
  );
}