import { getServerSnapshot, getSnapshot, subscribe } from "@/lib/wishlist";
import { useSyncExternalStore } from "react";

export function useWishlist() {
  const items = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return { items, count: items.length };
}
