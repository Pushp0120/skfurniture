import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { apiSend } from "@/lib/api";
import { cn } from "@/lib/utils";
import { CheckCircle2, Loader2, Send, Star } from "lucide-react";
import { useState } from "react";

export function ReviewForm() {
  const [name, setName] = useState("");
  const [rating, setRating] = useState(5);
  const [text, setText] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success">(
    "idle",
  );
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (status === "submitting") return;
    setError(null);
    setStatus("submitting");

    try {
      await apiSend("/api/reviews", { body: { name, rating, text } });
      setName("");
      setText("");
      setRating(5);
      setStatus("success");
    } catch (err) {
      setStatus("idle");
      setError(
        err instanceof Error
          ? err.message
          : "Couldn't submit your review. Please try again.",
      );
    }
  };

  if (status === "success") {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-border/70 bg-card p-8 text-center">
        <span className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <CheckCircle2 className="size-6" />
        </span>
        <h3 className="mt-4 text-lg font-semibold tracking-tight">
          Thanks for the review!
        </h3>
        <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">
          It will appear on the site as soon as we approve it.
        </p>
        <Button
          type="button"
          variant="outline"
          className="mt-5"
          onClick={() => setStatus("idle")}
        >
          Write another review
        </Button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-2xl border border-border/70 bg-card p-6"
    >
      <div className="space-y-2">
        <Label htmlFor="review-name">Your name</Label>
        <Input
          id="review-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          required
          disabled={status === "submitting"}
        />
      </div>

      <div className="space-y-2">
        <Label>Your rating</Label>
        <div className="flex items-center gap-1">
          {Array.from({ length: 5 }).map((_, index) => {
            const value = index + 1;
            return (
              <button
                key={value}
                type="button"
                onClick={() => setRating(value)}
                disabled={status === "submitting"}
                aria-label={`${value} star${value > 1 ? "s" : ""}`}
                className="rounded p-0.5 transition-transform hover:scale-110"
              >
                <Star
                  className={cn(
                    "size-7",
                    value <= rating
                      ? "fill-primary text-primary"
                      : "text-muted-foreground/40",
                  )}
                />
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="review-text">Your review</Label>
        <Textarea
          id="review-text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="What was your experience with S KITCHEN POINT?"
          rows={4}
          required
          disabled={status === "submitting"}
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button
        type="submit"
        className="w-full gap-2"
        disabled={status === "submitting"}
      >
        {status === "submitting" ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Submitting…
          </>
        ) : (
          <>
            <Send className="size-4" />
            Submit review
          </>
        )}
      </Button>
    </form>
  );
}
