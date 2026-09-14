import { BrandReport } from "@/components/BrandReport";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useAuth } from "@/hooks/use-auth";
import { useAction, useMutation, useQuery } from "convex/react";
import {
  AlertTriangle,
  Instagram,
  Loader2,
  LogOut,
  Sparkles,
  Trash2,
  Wand2,
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";

const IG_BAR =
  "linear-gradient(90deg, #FEDA75 0%, #FA7E1E 28%, #D62976 58%, #962FBF 80%, #4F5BD5 100%)";

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const analyses = useQuery(api.analyses.list);
  const createAnalysis = useMutation(api.analyses.create);
  const removeAnalysis = useMutation(api.analyses.remove);
  const runAnalyze = useAction(api.analyze.analyze);

  const [url, setUrl] = useState("");
  const [context, setContext] = useState("");
  const [showContext, setShowContext] = useState(false);
  const [activeId, setActiveId] = useState<Id<"analyses"> | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const activeDoc = useQuery(
    api.analyses.get,
    activeId ? { id: activeId } : "skip",
  );

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = url.trim();
    if (!trimmed || isSubmitting) return;

    setFormError(null);
    setIsSubmitting(true);
    const trimmedContext = context.trim();

    try {
      const id = await createAnalysis({
        instagramUrl: trimmed,
        userContext: trimmedContext || undefined,
      });
      setActiveId(id);
      setUrl("");
      setContext("");
      setShowContext(false);

      await runAnalyze({
        analysisId: id,
        url: trimmed,
        userContext: trimmedContext || undefined,
      });
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Something went wrong. Try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (
    id: Id<"analyses">,
    event: React.MouseEvent,
  ) => {
    event.stopPropagation();
    try {
      await removeAnalysis({ id });
      if (activeId === id) setActiveId(null);
      toast.success("Report deleted");
    } catch {
      toast.error("Couldn't delete the report");
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur">
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 h-px"
          style={{ backgroundImage: IG_BAR }}
        />
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-5">
          <button
            type="button"
            onClick={() => navigate("/")}
            className="flex items-center gap-2.5"
          >
            <span className="flex size-9 items-center justify-center rounded-xl bg-foreground text-background">
              <Instagram className="size-5" />
            </span>
            <span className="text-sm font-semibold tracking-tight">
              Brand&nbsp;Pulse&nbsp;AI
            </span>
          </button>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-muted-foreground sm:block">
              {user?.email}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={handleSignOut}
            >
              <LogOut className="size-4" />
              Sign out
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-5 py-8">
        <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
          {/* Left: composer + history */}
          <div className="space-y-6">
            <Card className="border-border/70 shadow-none">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 text-primary">
                  <Wand2 className="size-4" />
                  <span className="text-xs font-medium uppercase tracking-[0.16em]">
                    New analysis
                  </span>
                </div>
                <h1 className="mt-3 text-lg font-semibold tracking-tight">
                  Analyse an Instagram profile
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Paste a public profile link to get the 7-part brand report.
                </p>

                <form onSubmit={handleSubmit} className="mt-4 space-y-3">
                  <Input
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="instagram.com/username"
                    autoComplete="off"
                    spellCheck={false}
                    disabled={isSubmitting}
                  />

                  {showContext ? (
                    <Textarea
                      value={context}
                      onChange={(e) => setContext(e.target.value)}
                      placeholder="Optional: paste the bio, a few captions, or key details to sharpen the analysis."
                      rows={4}
                      disabled={isSubmitting}
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowContext(true)}
                      className="text-xs font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                    >
                      + Add details for a sharper report (optional)
                    </button>
                  )}

                  {formError && (
                    <p className="text-sm text-destructive">{formError}</p>
                  )}

                  <Button
                    type="submit"
                    className="w-full gap-2"
                    disabled={isSubmitting || !url.trim()}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        Analysing…
                      </>
                    ) : (
                      <>
                        <Sparkles className="size-4" />
                        Generate report
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <div>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold tracking-tight">
                  Recent reports
                </h2>
                <span className="text-xs text-muted-foreground">
                  {analyses?.length ?? 0}
                </span>
              </div>

              {analyses === undefined ? (
                <div className="space-y-2">
                  <Skeleton className="h-16 w-full rounded-xl" />
                  <Skeleton className="h-16 w-full rounded-xl" />
                </div>
              ) : analyses.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border/70 p-5 text-sm text-muted-foreground">
                  No reports yet. Your analyses will show up here.
                </div>
              ) : (
                <div className="max-h-[26rem] space-y-2 overflow-y-auto pr-1">
                  {analyses.map((item) => {
                    const active = item._id === activeId;
                    return (
                      <button
                        key={item._id}
                        type="button"
                        onClick={() => setActiveId(item._id)}
                        className={`group flex w-full items-center justify-between gap-3 rounded-xl border p-3 text-left transition-colors ${
                          active
                            ? "border-primary/50 bg-primary/5"
                            : "border-border/70 hover:border-primary/30 hover:bg-muted/50"
                        }`}
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">
                            {item.username ? `@${item.username}` : item.instagramUrl}
                          </p>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {formatDate(item.createdAt)}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <StatusBadge status={item.status} />
                          <span
                            role="button"
                            tabIndex={0}
                            onClick={(e) => handleDelete(item._id, e)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                handleDelete(item._id, e as unknown as React.MouseEvent);
                              }
                            }}
                            className="flex size-7 items-center justify-center rounded-md text-muted-foreground opacity-0 transition-opacity hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
                            aria-label="Delete report"
                          >
                            <Trash2 className="size-4" />
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right: report panel */}
          <Card className="min-h-[32rem] border-border/70 shadow-none">
            <CardContent className="p-6">
              {!activeId ? (
                <EmptyState />
              ) : activeDoc === undefined || activeDoc?.status === "pending" ? (
                <LoadingState />
              ) : activeDoc === null ? (
                <EmptyState />
              ) : activeDoc.status === "error" ? (
                <ErrorState message={activeDoc.error} />
              ) : activeDoc.report ? (
                <BrandReport report={activeDoc.report} />
              ) : (
                <EmptyState />
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

function StatusBadge({ status }: { status: "pending" | "complete" | "error" }) {
  if (status === "pending") {
    return (
      <Badge variant="outline" className="border-border/70 text-muted-foreground">
        <Loader2 className="mr-1 size-3 animate-spin" />
        Working
      </Badge>
    );
  }
  if (status === "error") {
    return (
      <Badge variant="outline" className="border-destructive/40 text-destructive">
        Failed
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary">
      Ready
    </Badge>
  );
}

function EmptyState() {
  return (
    <div className="flex h-full min-h-[28rem] flex-col items-center justify-center text-center">
      <span className="flex size-14 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#D62976,#962FBF)] text-white">
        <Instagram className="size-7" />
      </span>
      <h2 className="mt-5 text-lg font-semibold tracking-tight">
        Paste a link to start
      </h2>
      <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">
        Drop in an Instagram profile and Brand Pulse AI will return a 7-part
        brand report — personality, audience, offer, colours, content style,
        website goal and a homepage headline.
      </p>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        Reading the profile and writing your report…
      </div>
      <Skeleton className="h-28 w-full rounded-2xl" />
      <div className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-32 w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}

function ErrorState({ message }: { message?: string }) {
  return (
    <div className="flex h-full min-h-[28rem] flex-col items-center justify-center text-center">
      <span className="flex size-12 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
        <AlertTriangle className="size-6" />
      </span>
      <h2 className="mt-4 text-lg font-semibold tracking-tight">
        Couldn't build that report
      </h2>
      <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">
        {message ||
          "Something went wrong while analysing this profile. Check the link and try again."}
      </p>
    </div>
  );
}
