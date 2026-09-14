import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useAuth } from "@/hooks/use-auth";
import { useMutation, useQuery } from "convex/react";
import {
  ArrowLeft,
  Check,
  Inbox,
  Lock,
  LogOut,
  Mail,
  Phone,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";

type Filter = "all" | "new" | "handled";
type OwnerState = "checking" | "owner" | "denied";

function timeAgo(ts: number) {
  const diff = Date.now() - ts;
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(ts).toLocaleDateString();
}

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const enquiries = useQuery(api.enquiries.list);
  const claimOwner = useMutation(api.enquiries.claimOwner);
  const setStatus = useMutation(api.enquiries.setStatus);
  const removeEnquiry = useMutation(api.enquiries.remove);

  const [filter, setFilter] = useState<Filter>("all");
  const [ownerState, setOwnerState] = useState<OwnerState>("checking");

  useEffect(() => {
    let active = true;
    claimOwner()
      .then((result) => {
        if (active) setOwnerState(result.isOwner ? "owner" : "denied");
      })
      .catch(() => {
        if (active) setOwnerState("denied");
      });
    return () => {
      active = false;
    };
  }, [claimOwner]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const list = enquiries ?? [];
  const newCount = list.filter((e) => e.status === "new").length;
  const handledCount = list.filter((e) => e.status === "handled").length;
  const visible = list.filter((e) =>
    filter === "all" ? true : e.status === filter,
  );

  const toggleStatus = async (
    id: Id<"enquiries">,
    status: "new" | "handled",
  ) => {
    try {
      await setStatus({ id, status });
    } catch {
      toast.error("Couldn't update the enquiry");
    }
  };

  const handleDelete = async (id: Id<"enquiries">) => {
    try {
      await removeEnquiry({ id });
      toast.success("Enquiry deleted");
    } catch {
      toast.error("Couldn't delete the enquiry");
    }
  };

  const filters: { key: Filter; label: string; count: number }[] = [
    { key: "all", label: "All", count: list.length },
    { key: "new", label: "New", count: newCount },
    { key: "handled", label: "Handled", count: handledCount },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between px-5">
          <button
            type="button"
            onClick={() => navigate("/")}
            className="flex items-center gap-2.5"
          >
            <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-xs font-bold text-primary-foreground">
              SK
            </span>
            <span className="text-sm font-semibold tracking-tight">
              S&nbsp;K&nbsp;Furniture · Enquiries
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

      <main className="mx-auto w-full max-w-5xl px-5 py-8">
        {ownerState === "checking" ? (
          <div className="space-y-3">
            <Skeleton className="h-10 w-64 rounded-lg" />
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-28 w-full rounded-xl" />
          </div>
        ) : ownerState === "denied" ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/70 p-12 text-center">
            <span className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <Lock className="size-6" />
            </span>
            <h1 className="mt-4 text-lg font-semibold tracking-tight">
              This inbox is private
            </h1>
            <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">
              Customer enquiries are only visible to the account owner. Sign in
              with the owner account, or head back to the website.
            </p>
            <Button
              type="button"
              variant="outline"
              className="mt-5"
              onClick={() => navigate("/")}
            >
              Back to website
            </Button>
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <button
                  type="button"
                  onClick={() => navigate("/")}
                  className="mb-2 inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
                >
                  <ArrowLeft className="size-3.5" />
                  Back to website
                </button>
                <h1 className="text-2xl font-semibold tracking-tight">
                  Customer enquiries
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Every quote request submitted through the website lands here.
                </p>
              </div>
              <div className="flex gap-2">
                {filters.map((f) => (
                  <Button
                    key={f.key}
                    type="button"
                    variant={filter === f.key ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilter(f.key)}
                  >
                    {f.label}
                  </Button>
                ))}
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {filters.map((f) => (
                <Card key={f.key} className="border-border/70 shadow-none">
                  <CardContent className="p-4">
                    <p className="text-2xl font-semibold tracking-tight">
                      {f.count}
                    </p>
                    <p className="text-xs text-muted-foreground">{f.label}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="mt-6 space-y-3">
              {enquiries === undefined ? (
                <>
                  <Skeleton className="h-28 w-full rounded-xl" />
                  <Skeleton className="h-28 w-full rounded-xl" />
                </>
              ) : visible.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/70 p-12 text-center">
                  <span className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
                    <Inbox className="size-6" />
                  </span>
                  <h2 className="mt-4 text-base font-semibold">
                    {filter === "all"
                      ? "No enquiries yet"
                      : `No ${filter} enquiries`}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    New quote requests from the website will appear here.
                  </p>
                </div>
              ) : (
                visible.map((enq) => (
                  <Card key={enq._id} className="border-border/70 shadow-none">
                    <CardContent className="p-5">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-base font-semibold">
                              {enq.name}
                            </h3>
                            {enq.status === "new" ? (
                              <Badge className="border-transparent bg-primary/10 text-primary">
                                New
                              </Badge>
                            ) : (
                              <Badge
                                variant="outline"
                                className="text-muted-foreground"
                              >
                                Handled
                              </Badge>
                            )}
                            {enq.requirement && (
                              <Badge
                                variant="outline"
                                className="border-border/70"
                              >
                                {enq.requirement}
                              </Badge>
                            )}
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {timeAgo(enq.createdAt)}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          {enq.status === "new" ? (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="gap-1.5"
                              onClick={() => toggleStatus(enq._id, "handled")}
                            >
                              <Check className="size-4" />
                              Mark handled
                            </Button>
                          ) : (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="gap-1.5"
                              onClick={() => toggleStatus(enq._id, "new")}
                            >
                              <RotateCcw className="size-4" />
                              Reopen
                            </Button>
                          )}
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="text-muted-foreground hover:text-destructive"
                            onClick={() => handleDelete(enq._id)}
                            aria-label="Delete enquiry"
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </div>

                      <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-foreground/80">
                        {enq.message}
                      </p>

                      <div className="mt-4 flex flex-wrap gap-3 border-t border-border/60 pt-3 text-sm">
                        <a
                          href={`tel:${enq.phone}`}
                          className="inline-flex items-center gap-1.5 text-foreground/80 hover:text-primary"
                        >
                          <Phone className="size-4" />
                          {enq.phone}
                        </a>
                        {enq.email && (
                          <a
                            href={`mailto:${enq.email}`}
                            className="inline-flex items-center gap-1.5 text-foreground/80 hover:text-primary"
                          >
                            <Mail className="size-4" />
                            {enq.email}
                          </a>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
