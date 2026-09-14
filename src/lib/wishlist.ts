export interface WishlistItem {
  id: string;
  name: string;
  price: number;
  priceNote?: string;
}

const STORAGE_KEY = "skf-wishlist-v1";
const EMPTY: WishlistItem[] = [];

function load(): WishlistItem[] {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY;
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return EMPTY;
    return parsed.filter(
      (item): item is WishlistItem =>
        !!item && typeof (item as WishlistItem).id === "string",
    );
  } catch {
    return EMPTY;
  }
}

let items: WishlistItem[] = load();
const listeners = new Set<() => void>();

function persist() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // storage unavailable — keep the in-memory copy
  }
}

function emit() {
  listeners.forEach((listener) => listener());
}

export function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getSnapshot(): WishlistItem[] {
  return items;
}

export function getServerSnapshot(): WishlistItem[] {
  return EMPTY;
}

/** Toggles an item. Returns true if it is now in the wishlist. */
export function toggleWishlist(item: WishlistItem): boolean {
  const exists = items.some((entry) => entry.id === item.id);
  items = exists
    ? items.filter((entry) => entry.id !== item.id)
    : [item, ...items];
  persist();
  emit();
  return !exists;
}

export function removeFromWishlist(id: string) {
  items = items.filter((entry) => entry.id !== id);
  persist();
  emit();
}

export function clearWishlist() {
  items = [];
  persist();
  emit();
}
