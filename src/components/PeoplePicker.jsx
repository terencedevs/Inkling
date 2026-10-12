import { useState, useEffect, useRef, useMemo, useCallback, useId } from 'react';
import { useFetch } from '@/hooks/useFetch';
import { sdk } from '@/services/sdk';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import ApperIcon from '@/components/ApperIcon';
import { useIsMobile } from '@/hooks/useIsMobile';
import { cn } from '@/lib/utils';

const PAGE_SIZE = 20;

function getUserId(person) {
  return String(person?.User?.Id ?? person?.Id ?? '');
}

/**
 * People value → the shape create/update accept: `[{ User: <id> }]`.
 *
 * The picker's own value is `[{ User: { Id, Name } }]` because it needs `Name` to render avatars and
 * badges — but the data API REJECTS that nested object on a write and wants a bare id. Call this on
 * every People field at submit time (the same way Files goes through `sdk.storage.toCreateFormat`).
 *
 * User ids are UUID strings on migrated backends, integers on legacy ones. Digit-only strings are
 * coerced to Number because legacy int backends reject `{ User: "2" }`; UUID strings pass through
 * unchanged. Anything else (null, empty, junk strings, non-integer numbers) is dropped rather than
 * sent as `{ User: null }`, which fails the insert.
 */
export function toPeopleWrite(value) {
  // Inside the function on purpose: peopleWriteShape.test.mjs evaluates this function in isolation.
  const UUID_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!Array.isArray(value)) return [];
  return value
    .map((p) => {
      const raw = p?.User?.Id ?? p?.User ?? p?.Id ?? p;
      if (typeof raw === 'number') {
        return Number.isInteger(raw) && raw > 0 ? { User: raw } : null;
      }
      if (typeof raw !== 'string') return null;
      const id = raw.trim();
      if (/^\d+$/.test(id)) {
        const n = Number(id);
        return n > 0 ? { User: n } : null;
      }
      return UUID_ID.test(id) ? { User: id.toLowerCase() } : null;
    })
    .filter(Boolean);
}

function getUserLabel(user) {
  if (user.FirstName && user.LastName) return `${user.FirstName} ${user.LastName}`;
  return user.Name ?? user.Email ?? `User #${user.Id}`;
}

export default function PeoplePicker({
  value = [],
  onChange,
  multiple = true,
  placeholder = 'Select person…',
  disabled = false,
  className,
  'aria-label': ariaLabel,
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [activeIndex, setActiveIndex] = useState(-1);

  const isMobile = useIsMobile();
  const containerRef = useRef(null);
  const listRef = useRef(null);
  const inputRef = useRef(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const listboxId = useId();

  const selected = Array.isArray(value) ? value : [];

  const { data: users = [] } = useFetch(
    () => sdk.admin.fetch('user', {
      pagingInfo: { limit: PAGE_SIZE, offset: 0 },
      fields: [
        { field: { Name: 'FirstName' } },
        { field: { Name: 'LastName' } },
        { field: { Name: 'Email' } },
        { field: { Name: 'Name' } },
        { field: { Name: 'AvatarUrl' } },
      ],
    }).then(r => r.data ?? []),
    { initialLoading: true }
  );

  // Filter by search
  const filtered = useMemo(() => {
    if (!search) return users;
    const q = search.toLowerCase();
    return users.filter(u => getUserLabel(u).toLowerCase().includes(q) || u.Email?.toLowerCase().includes(q));
  }, [users, search]);

  // Check if user is selected
  const isSelected = useCallback((userId) => {
    return selected.some(p => getUserId(p) === String(userId));
  }, [selected]);

  // Toggle selection
  const toggle = useCallback((user) => {
    const uid = String(user.Id);
    if (isSelected(uid)) {
      onChangeRef.current?.(selected.filter(p => getUserId(p) !== uid));
    } else {
      const entry = { User: { Id: user.Id, Name: user.Email } };
      if (multiple) {
        onChangeRef.current?.([...selected, entry]);
      } else {
        onChangeRef.current?.([entry]);
        closeDropdown();
      }
    }
  }, [selected, multiple, isSelected]);

  const remove = useCallback((person) => {
    onChangeRef.current?.(selected.filter(p => getUserId(p) !== getUserId(person)));
  }, [selected]);

  const closeDropdown = useCallback(() => {
    setOpen(false);
    setSearch('');
    setActiveIndex(-1);
  }, []);

  // Outside click
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

  // Body scroll lock on mobile
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

  // Keyboard
  const handleKeyDown = useCallback((e) => {
    if (!open) {
      if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
        e.preventDefault();
        setOpen(true);
      }
      return;
    }
    switch (e.key) {
      case 'ArrowDown': e.preventDefault(); setActiveIndex(i => Math.min(i + 1, filtered.length - 1)); break;
      case 'ArrowUp': e.preventDefault(); setActiveIndex(i => Math.max(i - 1, 0)); break;
      case 'Enter': e.preventDefault(); if (activeIndex >= 0 && filtered[activeIndex]) toggle(filtered[activeIndex]); break;
      case 'Escape': e.preventDefault(); closeDropdown(); break;
    }
  }, [open, filtered, activeIndex, toggle, closeDropdown]);

  // Scroll active into view
  useEffect(() => {
    if (activeIndex < 0 || !listRef.current) return;
    listRef.current.children[activeIndex]?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  useEffect(() => { setActiveIndex(-1); }, [filtered]);

  const renderList = () => (
    <>
      {filtered.length === 0 ? (
        <p className="px-3 py-4 text-sm text-muted-foreground text-center">No users found</p>
      ) : (
        filtered.map((user, i) => {
          const checked = isSelected(user.Id);
          return (
            <div
              key={user.Id}
              id={`${listboxId}-opt-${i}`}
              role="option"
              aria-selected={checked}
              onClick={() => toggle(user)}
              className={cn(
                'flex items-center gap-2 cursor-pointer transition-colors',
                isMobile ? 'px-4 py-3' : 'px-3 py-2',
                checked ? 'bg-primary/8 font-medium' : 'hover:bg-muted',
                activeIndex === i && 'bg-muted',
              )}
            >
              <div className="size-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <span className="text-xs font-medium text-primary">
                  {(user.FirstName?.[0] ?? user.Email?.[0] ?? '?').toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm truncate">{getUserLabel(user)}</p>
                <p className="text-xs text-muted-foreground truncate">{user.Email}</p>
              </div>
              {checked && <ApperIcon name="Check" size={15} className="text-primary shrink-0" />}
            </div>
          );
        })
      )}
    </>
  );

  return (
    <div className={cn('relative', className)} ref={containerRef} onKeyDown={handleKeyDown}>
      {/* Selected badges */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {selected.map(person => (
            <Badge key={getUserId(person)} variant="secondary" className="gap-1 py-0.5 pl-2 pr-1 text-xs font-normal">
              {person.User?.Name ?? `User ${getUserId(person)}`}
              {!disabled && (
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={(e) => { e.stopPropagation(); remove(person); }}
                  className="rounded-sm hover:text-destructive"
                  aria-label={`Remove ${person.User?.Name}`}
                >
                  <ApperIcon name="X" className="size-3" />
                </button>
              )}
            </Badge>
          ))}
        </div>
      )}

      {/* Trigger */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => open ? closeDropdown() : setOpen(true)}
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={open ? listboxId : undefined}
        aria-label={ariaLabel ?? placeholder}
        className={cn(
          'flex h-10 sm:h-9 w-full items-center justify-between rounded-lg sm:rounded-md',
          'border border-input bg-transparent px-3 py-2 sm:py-1 text-sm shadow-xs transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40',
          'disabled:cursor-not-allowed disabled:opacity-50',
          open && 'ring-2 ring-ring/40',
        )}
      >
        <span className="text-muted-foreground truncate">
          {selected.length ? `${selected.length} selected` : placeholder}
        </span>
        <ApperIcon name="ChevronsUpDown" size={15} className="ml-auto text-muted-foreground shrink-0" />
      </button>

      {/* Mobile bottom sheet */}
      {open && isMobile && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={closeDropdown} />
          <div className="relative bg-popover rounded-t-2xl shadow-2xl flex flex-col max-h-[70vh] animate-in slide-in-from-bottom-4 duration-200">
            <div className="flex justify-center pt-2.5 pb-1">
              <div className="w-10 h-1 rounded-full bg-border" />
            </div>
            <div className="px-4 pb-2 flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">{ariaLabel ?? placeholder}</span>
              <button type="button" onClick={closeDropdown} className="rounded-full p-1.5 hover:bg-muted transition-colors" aria-label="Close">
                <ApperIcon name="X" size={18} className="text-muted-foreground" />
              </button>
            </div>
            <div className="px-3 pb-2">
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search people…"
                className="h-9 text-sm"
                aria-label="Search people"
              />
            </div>
            <div ref={listRef} role="listbox" id={listboxId} className="overflow-y-auto flex-1 overscroll-contain pb-safe">
              {renderList()}
            </div>
          </div>
        </div>
      )}

      {/* Desktop dropdown */}
      {open && !isMobile && (
        <div className="absolute left-0 right-0 z-30 top-full mt-1 rounded-lg border border-border bg-popover shadow-lg ring-1 ring-black/5 flex flex-col max-h-72 animate-in fade-in-0 zoom-in-[0.98] duration-100">
          <div className="p-1.5 border-b border-border">
            <Input
              ref={inputRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search…"
              className="h-7 text-xs"
              autoFocus
              aria-label="Search people"
              onKeyDown={(e) => { if (e.key === 'Escape') { e.stopPropagation(); closeDropdown(); } }}
            />
          </div>
          <div ref={listRef} role="listbox" id={listboxId} className="overflow-y-auto flex-1 py-1">
            {renderList()}
          </div>
        </div>
      )}
    </div>
  );
}