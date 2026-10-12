import { useState, useEffect, useRef, useMemo, useCallback, useId } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';
import ApperIcon from '@/components/ApperIcon';
import { useIsMobile } from '@/hooks/useIsMobile';
import { sdk } from '@/services/sdk';
import { cn } from '@/lib/utils';

const DEFAULT_LABEL = (item) => item.Name ?? item.title_c ?? `#${item.Id}`;
const DEFAULT_ID = (item) => item.Id;
// Record ids are opaque: UUID strings on migrated backends, integers on legacy ones. Digit-only
// strings are coerced to Number because legacy int backends reject a string Lookup value.
const normId = (v) => (typeof v === 'string' && /^\d+$/.test(v) ? Number(v) : v);
const PAGE_SIZE = 20;
const DEBOUNCE_MS = 300;
const FLIP_THRESHOLD = 280;

function LookupPicker({
  table,
  options: staticOptions,
  fetchParams,
  pageSize = PAGE_SIZE,
  value,
  onChange,
  labelKey,
  idKey,
  placeholder = 'Select…',
  searchField,
  filterLocal,
  debounceMs = DEBOUNCE_MS,
  clearable = false,
  refreshable = false,
  includeAll = false,
  allLabel = 'All',
  onCreate,
  createLabel = 'Create new…',
  disabled = false,
  className,
  'aria-label': ariaLabel,
}) {
  const [items, setItems] = useState(staticOptions ?? []);
  const [loading, setLoading] = useState(() => !staticOptions && !!table);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [activeIndex, setActiveIndex] = useState(-1);
  const [dropUp, setDropUp] = useState(false);
  const [resolvedLabel, setResolvedLabel] = useState(null);

  const isMobile = useIsMobile();
  const offsetRef = useRef(0);
  const containerRef = useRef(null);
  const listRef = useRef(null);
  const debounceRef = useRef(null);
  const fetchParamsRef = useRef(fetchParams);
  const abortRef = useRef(null);
  const resolvedValueRef = useRef(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  fetchParamsRef.current = fetchParams;

  const listboxId = useId();

  const isStatic = !!staticOptions;
  const isServerSearch = !!searchField && !isStatic;
  const isLocalFilter = filterLocal ?? (isStatic && (staticOptions?.length ?? 0) > 8);
  const showSearchInput = isServerSearch || isLocalFilter;

  const getLabel = useMemo(() => {
    if (typeof labelKey === 'function') return labelKey;
    if (typeof labelKey === 'string') return (item) => item[labelKey] ?? `#${item.Id}`;
    return DEFAULT_LABEL;
  }, [labelKey]);

  const getId = useMemo(() => {
    if (typeof idKey === 'function') return idKey;
    if (typeof idKey === 'string') return (item) => item[idKey];
    return DEFAULT_ID;
  }, [idKey]);

  // --- Debounce server search ---
  useEffect(() => {
    if (!isServerSearch) { setDebouncedSearch(search); return; }
    debounceRef.current = setTimeout(() => setDebouncedSearch(search), debounceMs);
    return () => clearTimeout(debounceRef.current);
  }, [search, isServerSearch, debounceMs]);

  // --- Data fetching ---
  const fetchPage = useCallback(async (offset = 0, append = false, query = '') => {
    if (isStatic || !table) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    if (offset === 0) setLoading(true); else setLoadingMore(true);
    try {
      const pageNum = Math.floor(offset / pageSize) + 1;
      let q = sdk.table(table).select(['Name']);
      const extraFilter = fetchParamsRef.current?.filter;
      if (extraFilter) q = q.where(extraFilter);
      if (isServerSearch && query) {
        q = q.where(window.ApperSDK.CoreSDK.contains(searchField, query));
      }
      const res = await q.page(pageNum, pageSize).fetch();
      if (controller.signal.aborted) return;
      const data = res.data ?? [];
      setItems((prev) => append ? [...prev, ...data] : data);
      setHasMore(data.length >= pageSize);
      offsetRef.current = offset + data.length;
    } catch (err) {
      if (controller.signal.aborted) return;
      if (!append) setItems([]);
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
        setLoadingMore(false);
      }
    }
  }, [table, isStatic, pageSize, isServerSearch, searchField]);

  useEffect(() => {
    if (isStatic) { setItems(staticOptions); return; }
    offsetRef.current = 0;
    fetchPage(0, false, debouncedSearch);
    return () => abortRef.current?.abort();
  }, [table, staticOptions, isStatic, fetchPage, debouncedSearch]);

  // --- Resolve display label (deduped by value) ---
  useEffect(() => {
    if (!value || isStatic) { setResolvedLabel(null); return; }
    const match = items.find((o) => String(getId(o)) === String(value));
    if (match) { setResolvedLabel(null); return; }
    if (String(value) === String(resolvedValueRef.current)) return;
    if (!table) return;
    let cancelled = false;
    resolvedValueRef.current = value;
    sdk.table(table).get(normId(value)).then((res) => {
      if (!cancelled && res.data) setResolvedLabel(getLabel(res.data));
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [value, items, table, isStatic, getId, getLabel]);

  const displayLabel = useMemo(() => {
    if (!value) return null;
    const match = items.find((o) => String(getId(o)) === String(value));
    if (match) return getLabel(match);
    return resolvedLabel;
  }, [value, items, getId, getLabel, resolvedLabel]);

  // --- Actions ---
  const refresh = useCallback(() => {
    offsetRef.current = 0;
    setSearch('');
    setDebouncedSearch('');
    fetchPage(0, false, '');
  }, [fetchPage]);

  const loadMore = useCallback(() => {
    if (loadingMore || !hasMore) return;
    fetchPage(offsetRef.current, true, debouncedSearch);
  }, [loadingMore, hasMore, fetchPage, debouncedSearch]);

  const closeDropdown = useCallback(() => {
    setOpen(false);
    setSearch('');
    setDebouncedSearch('');
    setActiveIndex(-1);
  }, []);

  const select = useCallback((val) => {
    onChangeRef.current?.(val);
    closeDropdown();
  }, [closeDropdown]);

  const clear = useCallback((e) => {
    e.stopPropagation();
    onChangeRef.current?.(null);
  }, []);

  // --- Outside click/touch (desktop) ---
  useEffect(() => {
    if (!open || isMobile) return;
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) closeDropdown();
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('touchstart', handler);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('touchstart', handler);
    };
  }, [open, isMobile, closeDropdown]);

  // --- Lock body scroll on mobile (preserve scroll position) ---
  useEffect(() => {
    if (!open || !isMobile) return;
    const scrollY = window.scrollY;
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.left = '0';
    document.body.style.right = '0';
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      document.body.style.overflow = '';
      window.scrollTo(0, scrollY);
    };
  }, [open, isMobile]);

  // --- Dropdown flip (desktop) ---
  useEffect(() => {
    if (!open || !containerRef.current || isMobile) return;
    const rect = containerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    setDropUp(spaceBelow < FLIP_THRESHOLD && rect.top > spaceBelow);
  }, [open, isMobile]);

  // --- Auto load more ---
  const checkLoadMore = useCallback(() => {
    const el = listRef.current;
    if (!el || !hasMore || loadingMore) return;
    if (el.scrollHeight <= el.clientHeight || el.scrollTop + el.clientHeight >= el.scrollHeight - 24) {
      loadMore();
    }
  }, [hasMore, loadingMore, loadMore]);

  useEffect(() => {
    if (open) checkLoadMore();
  }, [open, items, checkLoadMore]);

  // --- Client-side filter ---
  const filtered = useMemo(() => {
    if (isServerSearch || !search || !isLocalFilter) return items;
    const q = search.toLowerCase();
    return items.filter((item) => getLabel(item).toLowerCase().includes(q));
  }, [items, search, getLabel, isLocalFilter, isServerSearch]);

  // --- Keyboard navigation ---
  const optionIds = useMemo(() => {
    const ids = [];
    if (includeAll) ids.push(null);
    filtered.forEach((item) => ids.push(normId(getId(item))));
    return ids;
  }, [filtered, includeAll, getId]);

  const handleKeyDown = useCallback((e) => {
    if (!open) {
      if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
        e.preventDefault();
        setOpen(true);
      }
      return;
    }
    switch (e.key) {
      case 'ArrowDown': e.preventDefault(); setActiveIndex((i) => Math.min(i + 1, optionIds.length - 1)); break;
      case 'ArrowUp':   e.preventDefault(); setActiveIndex((i) => Math.max(i - 1, 0)); break;
      case 'Enter':     e.preventDefault(); { const id = optionIds[activeIndex]; if (id !== undefined) select(id); } break;
      case 'Escape':    e.preventDefault(); closeDropdown(); break;
      case 'Home':      e.preventDefault(); setActiveIndex(0); break;
      case 'End':       e.preventDefault(); setActiveIndex(optionIds.length - 1); break;
    }
  }, [open, optionIds, activeIndex, select, closeDropdown]);

  useEffect(() => {
    if (activeIndex < 0 || !listRef.current) return;
    const el = listRef.current.children[activeIndex];
    if (el) el.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  useEffect(() => { setActiveIndex(-1); }, [filtered]);

  // --- Shared list content ---
  const renderOptions = () => (
    <>
      {includeAll && (
        <div
          id={`${listboxId}-opt-0`}
          role="option"
          aria-selected={!value}
          onClick={() => select(null)}
          className={cn(
            'px-4 py-2.5 sm:px-3 sm:py-1.5 text-sm flex items-center justify-between cursor-pointer transition-colors',
            'active:bg-primary/10',
            !value ? 'bg-primary/8 font-medium' : 'hover:bg-muted',
            activeIndex === 0 && 'bg-muted',
          )}
        >
          {allLabel}
          {!value && <ApperIcon name="Check" size={15} className="text-primary shrink-0" />}
        </div>
      )}
      {filtered.map((item, i) => {
        const id = getId(item);
        const isSelected = !!value && String(value) === String(id);
        const idx = includeAll ? i + 1 : i;
        return (
          <div
            key={id}
            id={`${listboxId}-opt-${idx}`}
            role="option"
            aria-selected={isSelected}
            onClick={() => select(normId(id))}
            className={cn(
              'px-4 py-2.5 sm:px-3 sm:py-1.5 text-sm flex items-center justify-between cursor-pointer transition-colors',
              'active:bg-primary/10',
              isSelected ? 'bg-primary/8 font-medium' : 'hover:bg-muted',
              activeIndex === idx && 'bg-muted',
            )}
          >
            <span className="truncate mr-2">{getLabel(item)}</span>
            {isSelected && <ApperIcon name="Check" size={15} className="text-primary shrink-0" />}
          </div>
        );
      })}
      {loading && !items.length && (
        <div className="flex justify-center py-4"><Loader2 className="size-5 animate-spin" /></div>
      )}
      {!loading && filtered.length === 0 && (
        <p className="px-4 py-3 text-sm text-muted-foreground text-center">
          {search ? 'No matches' : 'No options available'}
        </p>
      )}
      {loadingMore && (
        <div className="flex justify-center py-2"><Loader2 className="size-4 animate-spin" /></div>
      )}
    </>
  );

  const renderToolbar = () => (
    (showSearchInput || (refreshable && !isStatic)) ? (
      <div className="flex items-center gap-1.5 p-2 sm:p-1.5 border-b border-border">
        {showSearchInput && (
          <div className="relative flex-1">
            <ApperIcon name="Search" size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={isServerSearch ? 'Search…' : 'Filter…'}
              className="h-9 sm:h-7 text-sm sm:text-xs pl-8 pr-7"
              autoFocus={!isMobile}
              aria-label="Search options"
              onKeyDown={(e) => { if (e.key === 'Escape') { e.stopPropagation(); closeDropdown(); } }}
            />
            {isServerSearch && search && search !== debouncedSearch && (
              <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 size-3.5 sm:size-3 animate-spin" />
            )}
          </div>
        )}
        {refreshable && !isStatic && (
          <Button
            type="button" variant="ghost" size="icon-sm"
            onClick={refresh} disabled={loading}
            className="shrink-0 size-9 sm:size-7"
            aria-label="Refresh list"
          >
            <ApperIcon name="RefreshCw" size={14} className={loading ? 'animate-spin' : ''} />
          </Button>
        )}
      </div>
    ) : null
  );

  const renderFooter = () => (
    onCreate ? (
      <button
        type="button"
        onClick={() => onCreate()}
        className="flex items-center gap-2 px-4 py-2.5 sm:px-3 sm:py-2 text-sm font-medium text-primary border-t border-border transition-colors hover:bg-muted active:bg-primary/10"
      >
        <ApperIcon name="Plus" size={15} />
        {createLabel}
      </button>
    ) : null
  );

  return (
    <div className={cn('relative', className)} ref={containerRef} onKeyDown={handleKeyDown}>
      {/* Trigger */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => open ? closeDropdown() : setOpen(true)}
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={open ? listboxId : undefined}
        aria-activedescendant={open && activeIndex >= 0 ? `${listboxId}-opt-${activeIndex}` : undefined}
        aria-label={ariaLabel ?? placeholder}
        className={cn(
          'flex h-10 sm:h-9 w-full items-center justify-between rounded-lg sm:rounded-md',
          'border border-input bg-transparent px-3 py-2 sm:py-1 text-sm shadow-xs transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40',
          'disabled:cursor-not-allowed disabled:opacity-50',
          open && 'ring-2 ring-ring/40',
        )}
      >
        <span className={cn('truncate', displayLabel ? 'text-foreground' : 'text-muted-foreground')}>
          {loading && !items.length ? 'Loading…' : (displayLabel ?? placeholder)}
        </span>
        <span className="flex items-center gap-1 ml-2 shrink-0">
          {clearable && value && !loading && (
            <span
              role="button"
              tabIndex={-1}
              onClick={clear}
              className="rounded-full p-1 hover:bg-muted active:bg-muted/80 transition-colors"
              aria-label="Clear selection"
            >
              <ApperIcon name="X" size={14} className="text-muted-foreground" />
            </span>
          )}
          <ApperIcon name="ChevronsUpDown" size={15} className="text-muted-foreground" />
        </span>
      </button>

      {/* --- Mobile: bottom sheet --- */}
      {open && isMobile && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={closeDropdown} />
          <div className="relative bg-popover rounded-t-2xl shadow-2xl flex flex-col max-h-[70vh] animate-in slide-in-from-bottom-4 duration-200">
            <div className="flex justify-center pt-2.5 pb-1">
              <div className="w-10 h-1 rounded-full bg-border" />
            </div>
            <div className="px-4 pb-2 flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">{ariaLabel ?? placeholder}</span>
              <button
                type="button"
                onClick={closeDropdown}
                className="rounded-full p-1.5 hover:bg-muted transition-colors"
                aria-label="Close"
              >
                <ApperIcon name="X" size={18} className="text-muted-foreground" />
              </button>
            </div>
            {renderToolbar()}
            <div
              ref={listRef}
              onScroll={checkLoadMore}
              role="listbox"
              id={listboxId}
              className="overflow-y-auto flex-1 overscroll-contain pb-safe"
            >
              {renderOptions()}
            </div>
            {renderFooter()}
          </div>
        </div>
      )}

      {/* --- Desktop: popover dropdown --- */}
      {open && !isMobile && (
        <div
          className={cn(
            'absolute left-0 right-0 z-30 rounded-lg border border-border bg-popover shadow-lg ring-1 ring-black/5',
            'flex flex-col max-h-72',
            'animate-in fade-in-0 zoom-in-[0.98] duration-100',
            dropUp ? 'bottom-full mb-1' : 'top-full mt-1',
          )}
        >
          {renderToolbar()}
          <div
            ref={listRef}
            onScroll={checkLoadMore}
            role="listbox"
            id={listboxId}
            aria-activedescendant={activeIndex >= 0 ? `${listboxId}-opt-${activeIndex}` : undefined}
            className="overflow-y-auto flex-1 py-1"
          >
            {renderOptions()}
          </div>
          {renderFooter()}
        </div>
      )}
    </div>
  );
}

export default LookupPicker;