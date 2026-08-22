"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { useRouter } from "next/navigation";
import { CornerDownLeft, Loader2, Search } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { searchEverything, type SearchGroup } from "@/lib/actions/search";
import { cn } from "@/lib/utils";

export function GlobalSearch() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [groups, setGroups] = useState<SearchGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const reqId = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Flattened hits, in display order, for keyboard navigation.
  const flat = groups.flatMap((g) => g.items);

  // Ctrl/⌘ + K toggles the palette from anywhere in the app.
  useEffect(() => {
    function onKey(e: globalThis.KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Debounced search that ignores out-of-order responses.
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setGroups([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const id = ++reqId.current;
    const timer = setTimeout(async () => {
      try {
        const results = await searchEverything(q);
        if (reqId.current === id) {
          setGroups(results);
          setActiveIndex(0);
        }
      } catch {
        if (reqId.current === id) setGroups([]);
      } finally {
        if (reqId.current === id) setLoading(false);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [query]);

  // Reset state whenever the palette closes.
  useEffect(() => {
    if (!open) {
      setQuery("");
      setGroups([]);
      setActiveIndex(0);
    } else {
      const t = setTimeout(() => inputRef.current?.focus(), 40);
      return () => clearTimeout(t);
    }
  }, [open]);

  const go = useCallback(
    (href: string) => {
      setOpen(false);
      router.push(href);
    },
    [router],
  );

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (!flat.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % flat.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (i - 1 + flat.length) % flat.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      const hit = flat[activeIndex];
      if (hit) go(hit.href);
    }
  }

  const q = query.trim();
  // Running cursor so each hit knows its position in the flattened list.
  let cursor = -1;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-8 items-center gap-2 rounded-[8px] border border-input bg-transparent px-2.5 text-xs text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
        title="Search (Ctrl / ⌘ K)"
      >
        <Search className="size-4" />
        <span className="hidden sm:inline">Search…</span>
        <kbd className="hidden rounded border bg-muted px-1 font-sans text-[10px] font-medium sm:inline">
          ⌘K
        </kbd>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          showCloseButton={false}
          className="top-[14%] max-w-lg translate-y-0 gap-0 p-0 sm:max-w-lg"
        >
          <DialogTitle className="sr-only">Search</DialogTitle>
          <DialogDescription className="sr-only">
            Search across customers, inventory, parties and leads.
          </DialogDescription>

          <div className="flex items-center gap-2 border-b px-3">
            <Search className="size-4 shrink-0 text-muted-foreground" />
            <input
              ref={inputRef}
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Search customers, plots, parties, leads…"
              className="h-11 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
            {loading ? (
              <Loader2 className="size-4 shrink-0 animate-spin text-muted-foreground" />
            ) : null}
          </div>

          <div className="max-h-[50vh] overflow-y-auto p-1.5">
            {q.length < 2 ? (
              <p className="px-3 py-8 text-center text-sm text-muted-foreground">
                Type at least 2 characters to search.
              </p>
            ) : !loading && flat.length === 0 ? (
              <p className="px-3 py-8 text-center text-sm text-muted-foreground">
                No matches for &ldquo;{q}&rdquo;.
              </p>
            ) : (
              groups.map((group) => (
                <div key={group.group} className="mb-1">
                  <p className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    {group.group}
                  </p>
                  {group.items.map((hit) => {
                    cursor += 1;
                    const idx = cursor;
                    const isActive = idx === activeIndex;
                    return (
                      <button
                        key={`${group.group}-${hit.id}`}
                        type="button"
                        onClick={() => go(hit.href)}
                        onMouseEnter={() => setActiveIndex(idx)}
                        className={cn(
                          "flex w-full items-center justify-between gap-2 rounded-[8px] px-2 py-2 text-left",
                          isActive ? "bg-muted" : "hover:bg-muted/50",
                        )}
                      >
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-medium text-foreground">
                            {hit.label}
                          </span>
                          {hit.sub ? (
                            <span className="block truncate text-xs text-muted-foreground">
                              {hit.sub}
                            </span>
                          ) : null}
                        </span>
                        {isActive ? (
                          <CornerDownLeft className="size-3.5 shrink-0 text-muted-foreground" />
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
