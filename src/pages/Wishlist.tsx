import { BrandLogo } from "@/components/BrandLogo";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useWishlist } from "@/hooks/use-wishlist";
import { clearWishlist, removeFromWishlist } from "@/lib/wishlist";
import { ArrowLeft, Heart, Instagram, Trash2 } from "lucide-react";
import { Link } from "react-router";
import { toast } from "sonner";

const INSTAGRAM_URL = "https://instagram.com/s_kitchen_point_bilimora";

function formatPrice(value: number) {
  return `₹${value.toLocaleString("en-IN")}`;
}

export default function Wishlist() {
  const { items, count } = useWishlist();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-3xl items-center justify-between px-5">
          <Link to="/" className="flex items-center gap-2.5">
            <BrandLogo />
            <span className="text-sm font-semibold tracking-tight">
              S KITCHEN POINT
            </span>
          </Link>
          <Button asChild variant="outline" size="sm" className="gap-1.5">
            <Link to="/">
              <ArrowLeft className="size-4" />
              Back to site
            </Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl px-5 py-10">
        <div className="flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Heart className="size-5 fill-current" />
          </span>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Your wishlist
            </h1>
            <p className="text-sm text-muted-foreground">
              {count === 0
                ? "Nothing saved yet"
                : `${count} item${count > 1 ? "s" : ""} saved`}
            </p>
          </div>
        </div>

        {items.length === 0 ? (
          <div className="mt-8 flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/70 p-12 text-center">
            <span className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <Heart className="size-6" />
            </span>
            <h2 className="mt-4 text-base font-semibold">
              Your wishlist is empty
            </h2>
            <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">
              Browse our services and tap the heart on anything you like — it
              will show up here.
            </p>
            <Button asChild className="mt-5">
              <Link to="/">Explore services</Link>
            </Button>
          </div>
        ) : (
          <div className="mt-8 space-y-3">
            {items.map((item) => (
              <Card key={item.id} className="border-border/70 shadow-none">
                <CardContent className="flex items-center justify-between gap-4 p-5">
                  <div className="min-w-0">
                    <p className="truncate text-base font-semibold">
                      {item.name}
                    </p>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      <span className="font-medium text-foreground">
                        {formatPrice(item.price)}
                      </span>{" "}
                      {item.priceNote ?? ""}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-destructive"
                    aria-label={`Remove ${item.name}`}
                    onClick={() => {
                      removeFromWishlist(item.id);
                      toast("Removed from your wishlist");
                    }}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <Button
                type="button"
                variant="ghost"
                className="text-muted-foreground"
                onClick={() => {
                  clearWishlist();
                  toast("Wishlist cleared");
                }}
              >
                Clear wishlist
              </Button>
              <Button asChild className="gap-2">
                <a
                  href={INSTAGRAM_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Instagram className="size-4" />
                  Share on Instagram
                </a>
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
