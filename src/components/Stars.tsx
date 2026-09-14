import { cn } from "@/lib/utils";
import { Star } from "lucide-react";

export function Stars({
  value,
  className,
  sizeClass = "size-4",
}: {
  value: number;
  className?: string;
  sizeClass?: string;
}) {
  const rounded = Math.round(value);
  return (
    <div
      className={cn("flex items-center gap-0.5", className)}
      aria-label={`${value} out of 5 stars`}
    >
      {Array.from({ length: 5 }).map((_, index) => (
        <Star
          key={index}
          className={cn(
            sizeClass,
            index < rounded
              ? "fill-primary text-primary"
              : "text-muted-foreground/40",
          )}
        />
      ))}
    </div>
  );
}
