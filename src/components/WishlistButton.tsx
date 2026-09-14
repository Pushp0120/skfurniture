import { Button } from "@/components/ui/button";
import { useWishlist } from "@/hooks/use-wishlist";
import { toggleWishlist, type WishlistItem } from "@/lib/wishlist";
import { cn } from "@/lib/utils";
import { Heart } from "lucide-react";
import { toast } from "sonner";

export function WishlistButton({
  item,
  className,
  withLabel = false,
}: {
  item: WishlistItem;
  className?: string;
  withLabel?: boolean;
}) {
  const { items } = useWishlist();
  const active = items.some((entry) => entry.id === item.id);

  const handleClick = () => {
    const now = toggleWishlist(item);
    toast(now ? "Saved to your wishlist" : "Removed from your wishlist");
  };

  return (
    <Button
      type="button"
      variant={active ? "default" : "outline"}
      size={withLabel ? "sm" : "icon"}
      className={cn("gap-1.5", className)}
      onClick={handleClick}
      aria-pressed={active}
      aria-label={active ? "Remove from wishlist" : "Add to wishlist"}
    >
      <Heart className={cn("size-4", active && "fill-current")} />
      {withLabel && <span>{active ? "Wishlisted" : "Wishlist"}</span>}
    </Button>
  );
}
