import { cn } from "@/lib/utils";

/**
 * The S KITCHEN POINT logo mark.
 * The source image has a black background, so it reads as a framed badge
 * in the cream header; size/shape can be adjusted via className.
 */
export function BrandLogo({ className }: { className?: string }) {
  return (
    <img
      src="/skp-logo.jpg"
      alt="S KITCHEN POINT logo"
      className={cn(
        "size-11 shrink-0 rounded-xl object-cover ring-1 ring-border/40",
        className,
      )}
    />
  );
}
