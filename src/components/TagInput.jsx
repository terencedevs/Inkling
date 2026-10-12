import { useState, useRef, useEffect, useId, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import ApperIcon from '@/components/ApperIcon';
import { useIsMobile } from '@/hooks/useIsMobile';
import { cn } from '@/lib/utils';

const toArray = (v) => Array.isArray(v) ? v : typeof v === 'string' && v ? v.split(',').map(s => s.trim()).filter(Boolean) : [];

export default function TagInput({
  value,
  onChange,
  availableTags = [],
  placeholder = 'Add tag…',
  maxTags,
  disabled = false,
  className,
  'aria-label': ariaLabel,
}) {
  const [input, setInput] = useState('');
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);

  const isMobile = useIsMobile();
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const containerRef = useRef(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const listboxId = useId();

  const selected = toArray(value);
  const atLimit = maxTags != null && selected.length >= maxTags;

  const emit = useCallback((next) => onChangeRef.current?.(next.join(',')), []);

  // A MultiPicklist value must match its declared `_meta.values` EXACTLY — the platform rejects
  // "engineering" for a field declaring "Engineering". So a tag matching a declared one
  // case-insensitively is stored in the DECLARED casing; anything else is kept as typed (open
  // tag fields are free text and must not be case-mangled).
  const canonicalize = useCallback((raw) => {
    const tag = raw.trim();
    if (!tag) return '';
    return availableTags.find(t => t.toLowerCase() === tag.toLowerCase()) ?? tag;
  }, [availableTags]);

  const addTag = useCallback((raw) => {
    const tag = canonicalize(raw);
    if (!tag || atLimit) return;
    // Case-insensitive dedupe: "ENG" must not sit alongside an already-selected "Eng".
    if (selected.some(t => t.toLowerCase() === tag.toLowerCase())) return;
    emit([...selected, tag]);
    setInput('');
    setActiveIdx(-1);
    setOpen(false);
  }, [selected, atLimit, emit, canonicalize]);

  const removeTag = useCallback((tag) => {
    emit(selected.filter(t => t !== tag));
    inputRef.current?.focus();
  }, [selected, emit]);

  // Filtered suggestions. All comparisons are case-insensitive: selections now carry the DECLARED
  // casing, so an exact-match test would re-offer a tag that is already selected.
  const selectedLower = selected.map(t => t.toLowerCase());
  const filtered = availableTags.filter(
    t => !selectedLower.includes(t.toLowerCase()) && t.toLowerCase().includes(input.toLowerCase()),
  );
  const showCustom = !!(input.trim() && !availableTags.some(t => t.toLowerCase() === input.trim().toLowerCase()) && !selectedLower.includes(input.trim().toLowerCase()));
  const totalItems = filtered.length + (showCustom ? 1 : 0);
  const showDropdown = open && totalItems > 0 && !atLimit;

  // Outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
        setActiveIdx(-1);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Scroll active into view
  useEffect(() => {
    if (activeIdx >= 0 && listRef.current) {
      listRef.current.children[activeIdx]?.scrollIntoView({ block: 'nearest' });
    }
  }, [activeIdx]);

  const handleKeyDown = useCallback((e) => {
    if (disabled) return;
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setOpen(true);
        setActiveIdx(i => (i + 1) % totalItems || 0);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIdx(i => (i <= 0 ? totalItems - 1 : i - 1));
        break;
      case 'Enter':
        e.preventDefault();
        if (activeIdx >= 0 && activeIdx < filtered.length) addTag(filtered[activeIdx]);
        else addTag(input);
        break;
      case 'Escape':
        setOpen(false);
        setActiveIdx(-1);
        break;
      case 'Backspace':
        if (!input && selected.length) removeTag(selected.at(-1));
        break;
    }
  }, [disabled, totalItems, activeIdx, filtered, input, selected, addTag, removeTag]);

  const handleOptionClick = useCallback((tag) => {
    addTag(tag);
    inputRef.current?.focus();
  }, [addTag]);

  const activeDescendant = activeIdx >= 0 ? `${listboxId}-opt-${activeIdx}` : undefined;

  return (
    <div className={cn('relative', className)} ref={containerRef}>
      <div
        className={cn(
          'flex flex-wrap items-center gap-1.5 rounded-md border border-input bg-background text-sm ring-offset-background transition-colors',
          isMobile ? 'px-2.5 py-2 min-h-[2.75rem]' : 'px-2 py-1.5 min-h-[2.25rem]',
          'focus-within:ring-2 focus-within:ring-ring/40',
          disabled && 'cursor-not-allowed opacity-50',
        )}
        onClick={() => !disabled && inputRef.current?.focus()}
        aria-label={ariaLabel}
      >
        {selected.map(tag => (
          <Badge key={tag} variant="secondary" className={cn('gap-1 pl-2 pr-1 text-xs font-normal', isMobile ? 'py-1' : 'py-0.5')}>
            {tag}
            {!disabled && (
              <button
                type="button"
                tabIndex={-1}
                onClick={(e) => { e.stopPropagation(); removeTag(tag); }}
                className="rounded-sm hover:text-destructive p-0.5"
                aria-label={`Remove ${tag}`}
              >
                <ApperIcon name="X" className="size-3" />
              </button>
            )}
          </Badge>
        ))}
        {!atLimit && (
          <input
            ref={inputRef}
            type="text"
            value={input}
            disabled={disabled}
            onChange={(e) => { setInput(e.target.value); setOpen(true); setActiveIdx(-1); }}
            onFocus={() => setOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder={selected.length ? '' : placeholder}
            role="combobox"
            aria-expanded={showDropdown}
            aria-controls={showDropdown ? listboxId : undefined}
            aria-activedescendant={activeDescendant}
            aria-autocomplete="list"
            className={cn(
              'min-w-[60px] flex-1 bg-transparent outline-none placeholder:text-muted-foreground',
              isMobile && 'text-base',
            )}
          />
        )}
      </div>

      {showDropdown && (
        <div
          ref={listRef}
          id={listboxId}
          role="listbox"
          className={cn(
            'absolute left-0 right-0 top-full z-50 mt-1 max-h-48 overflow-y-auto rounded-md border border-border bg-popover shadow-lg',
            'animate-in fade-in-0 zoom-in-[0.98] duration-100',
          )}
        >
          {filtered.map((tag, i) => (
            <button
              key={tag}
              id={`${listboxId}-opt-${i}`}
              role="option"
              aria-selected={i === activeIdx}
              type="button"
              onMouseDown={(e) => { e.preventDefault(); handleOptionClick(tag); }}
              onMouseEnter={() => setActiveIdx(i)}
              className={cn(
                'flex w-full items-center text-sm transition-colors',
                isMobile ? 'px-4 py-2.5' : 'px-3 py-1.5',
                i === activeIdx ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/50',
              )}
            >
              {tag}
            </button>
          ))}
          {showCustom && (
            <button
              id={`${listboxId}-opt-${filtered.length}`}
              role="option"
              aria-selected={filtered.length === activeIdx}
              type="button"
              onMouseDown={(e) => { e.preventDefault(); handleOptionClick(input); }}
              onMouseEnter={() => setActiveIdx(filtered.length)}
              className={cn(
                'flex w-full items-center gap-2 text-sm transition-colors',
                isMobile ? 'px-4 py-2.5' : 'px-3 py-1.5',
                filtered.length === activeIdx ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/50',
              )}
            >
              <ApperIcon name="Plus" className="size-3.5 text-muted-foreground" />
              Create &ldquo;<span className="font-medium">{input.trim()}</span>&rdquo;
            </button>
          )}
        </div>
      )}
    </div>
  );
}
