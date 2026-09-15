import { BrandLogo } from "@/components/BrandLogo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  mutate,
  apiSend,
  useApi,
} from "@/lib/api";
import type {
  AdminStats,
  Enquiry,
  GalleryItem,
  Member,
  Product,
  Review,
} from "@/lib/api";
import {
  Check,
  ImagePlus,
  Inbox,
  IndianRupee,
  Loader2,
  Lock,
  LogOut,
  MessageSquare,
  RotateCcw,
  Star,
  Trash2,
  Upload,
  Users,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { toast } from "sonner";

const TOKEN_KEY = "skf-admin-token";

type Tab = "overview" | "images" | "rates" | "reviews" | "enquiries" | "members";

function readToken(): string | null {
  try {
    return window.localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export default function Admin() {
  const [token, setToken] = useState<string | null>(() => readToken());
  const [tab, setTab] = useState<Tab>("overview");
  const [sessionExpired, setSessionExpired] = useState(false);

  const stats = useApi<AdminStats>("/api/admin/stats", {
    token,
    enabled: !!token && !sessionExpired,
    pollMs: 20000,
    onError: (error) => {
      if (error instanceof Error && error.message.includes("sign-in")) {
        setSessionExpired(true);
      }
    },
  });
  const gallery = useApi<GalleryItem[]>("/api/gallery");
  const products = useApi<Product[]>("/api/products");

  const reviews = useApi<Review[]>("/api/admin/reviews", {
    token,
    enabled: !!token && !sessionExpired,
  });
  const enquiries = useApi<Enquiry[]>("/api/admin/enquiries", {
    token,
    enabled: !!token && !sessionExpired,
  });
  const members = useApi<Member[]>("/api/admin/members", {
    token,
    enabled: !!token && !sessionExpired,
  });

  // Drop a rejected token from storage (no state set inside the effect).
  useEffect(() => {
    if (!sessionExpired) return;
    try {
      window.localStorage.removeItem(TOKEN_KEY);
    } catch {
      // ignore
    }
    toast.error("Your admin session expired. Please sign in again.");
  }, [sessionExpired]);

  // Login form state
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loggingIn, setLoggingIn] = useState(false);

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoginError(null);
    setLoggingIn(true);
    try {
      const result = await apiSend<{ token: string }>("/api/admin/login", {
        body: { username, password },
      });
      try {
        window.localStorage.setItem(TOKEN_KEY, result.token);
      } catch {
        // ignore storage failures
      }
      setToken(result.token);
      setSessionExpired(false);
      setUsername("");
      setPassword("");
      toast.success("Welcome back");
    } catch (err) {
      setLoginError(
        err instanceof Error ? err.message : "Couldn't sign in.",
      );
    } finally {
      setLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    if (token) {
      try {
        await apiSend("/api/admin/logout", { method: "POST", token });
      } catch {
        // ignore
      }
    }
    try {
      window.localStorage.removeItem(TOKEN_KEY);
    } catch {
      // ignore
    }
    setToken(null);
    setTab("overview");
  };

  const authedSend = (path: string, options: { method?: string; body?: unknown }) =>
    apiSend(path, { ...options, token });

  if (!token || sessionExpired) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-5 text-foreground">
        <Card className="w-full max-w-sm border-border/70 shadow-lg">
          <CardContent className="p-7">
            <div className="flex flex-col items-center text-center">
              <span className="flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
                <Lock className="size-6" />
              </span>
              <h1 className="mt-4 text-xl font-semibold tracking-tight">
                Admin sign in
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                S KITCHEN POINT control panel
              </p>
            </div>

            <form onSubmit={handleLogin} className="mt-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="admin-username">Username</Label>
                <Input
                  id="admin-username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="admin-password">Password</Label>
                <Input
                  id="admin-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
              </div>

              {loginError && (
                <p className="text-sm text-destructive">{loginError}</p>
              )}

              <Button type="submit" className="w-full gap-2" disabled={loggingIn}>
                {loggingIn ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Signing in…
                  </>
                ) : (
                  "Sign in"
                )}
              </Button>
            </form>

            <div className="mt-5 text-center">
              <Button asChild variant="ghost" size="sm">
                <Link to="/">Back to website</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const tabs: { key: Tab; label: string; icon: typeof Inbox; badge?: number }[] = [
    { key: "overview", label: "Overview", icon: Star },
    { key: "images", label: "Images", icon: ImagePlus, badge: stats?.images },
    { key: "rates", label: "Rates", icon: IndianRupee, badge: stats?.products },
    {
      key: "reviews",
      label: "Reviews",
      icon: MessageSquare,
      badge: stats?.pendingReviews,
    },
    {
      key: "enquiries",
      label: "Enquiries",
      icon: Inbox,
      badge: stats?.newEnquiries,
    },
    { key: "members", label: "Members", icon: Users, badge: stats?.members },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-5">
          <div className="flex min-w-0 items-center gap-2.5">
            <BrandLogo />
            <span className="truncate text-sm font-semibold tracking-tight sm:text-base">
              S KITCHEN POINT · Admin
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link to="/">View site</Link>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={handleLogout}
            >
              <LogOut className="size-4" />
              Sign out
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-5 py-8">
        <div className="flex flex-wrap gap-2">
          {tabs.map((item) => {
            const active = tab === item.key;
            return (
              <Button
                key={item.key}
                type="button"
                variant={active ? "default" : "outline"}
                size="sm"
                className="gap-2"
                onClick={() => setTab(item.key)}
              >
                <item.icon className="size-4" />
                {item.label}
                {item.badge ? (
                  <span
                    className={`ml-0.5 rounded-full px-1.5 text-[10px] font-semibold ${
                      active
                        ? "bg-primary-foreground/20"
                        : "bg-primary/10 text-primary"
                    }`}
                  >
                    {item.badge}
                  </span>
                ) : null}
              </Button>
            );
          })}
        </div>

        <div className="mt-6">
          {tab === "overview" && (
            <Overview stats={stats} />
          )}

          {tab === "images" && (
            <ImagesTab
              token={token}
              gallery={gallery}
              onRefresh={() => mutate("/api/gallery")}
            />
          )}

          {tab === "rates" && (
            <RatesTab token={token} products={products} authedSend={authedSend} />
          )}

          {tab === "reviews" && (
            <ReviewsTab
              reviews={reviews}
              onStatus={async (id, status) => {
                try {
                  await authedSend(`/api/admin/reviews/${id}`, {
                    method: "PATCH",
                    body: { status },
                  });
                  mutate("/api/admin/reviews");
                  mutate("/api/admin/stats");
                } catch {
                  toast.error("Couldn't update the review");
                }
              }}
              onDelete={async (id) => {
                try {
                  await authedSend(`/api/admin/reviews/${id}`, {
                    method: "DELETE",
                  });
                  mutate("/api/admin/reviews");
                  mutate("/api/admin/stats");
                  toast.success("Review deleted");
                } catch {
                  toast.error("Couldn't delete the review");
                }
              }}
            />
          )}

          {tab === "enquiries" && (
            <EnquiriesTab
              enquiries={enquiries}
              onStatus={async (id, status) => {
                try {
                  await authedSend(`/api/admin/enquiries/${id}`, {
                    method: "PATCH",
                    body: { status },
                  });
                  mutate("/api/admin/enquiries");
                  mutate("/api/admin/stats");
                } catch {
                  toast.error("Couldn't update the enquiry");
                }
              }}
              onDelete={async (id) => {
                try {
                  await authedSend(`/api/admin/enquiries/${id}`, {
                    method: "DELETE",
                  });
                  mutate("/api/admin/enquiries");
                  mutate("/api/admin/stats");
                  toast.success("Enquiry deleted");
                } catch {
                  toast.error("Couldn't delete the enquiry");
                }
              }}
            />
          )}

          {tab === "members" && <MembersTab members={members} />}
        </div>
      </main>
    </div>
  );
}

// ---------------------------------------------------------------------------

function Overview({
  stats,
}: {
  stats: AdminStats | null | undefined;
}) {
  if (stats === undefined) {
    return (
      <div className="grid gap-3 sm:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full rounded-xl" />
        ))}
      </div>
    );
  }
  if (!stats) return null;

  const items = [
    { label: "Images", value: stats.images },
    { label: "Services", value: stats.products },
    { label: "Pending reviews", value: stats.pendingReviews },
    { label: "Approved reviews", value: stats.approvedReviews },
    { label: "New enquiries", value: stats.newEnquiries },
    { label: "Members", value: stats.members },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {items.map((item) => (
        <Card key={item.label} className="border-border/70 shadow-none">
          <CardContent className="p-5">
            <p className="text-3xl font-semibold tracking-tight">{item.value}</p>
            <p className="mt-1 text-sm text-muted-foreground">{item.label}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function ImagesTab({
  token,
  gallery,
  onRefresh,
}: {
  token: string;
  gallery: GalleryItem[] | undefined;
  onRefresh: () => void;
}) {
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file.");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      toast.error("Images must be under 8 MB.");
      return;
    }

    setBusy(true);
    try {
      const body = new FormData();
      body.append("title", title.trim() || file.name);
      body.append("file", file);
      await apiSend("/api/admin/images", { method: "POST", body, token });
      setTitle("");
      if (fileRef.current) fileRef.current.value = "";
      onRefresh();
      toast.success("Image uploaded");
    } catch {
      toast.error("Couldn't upload the image.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-border/70 shadow-none">
        <CardContent className="p-6">
          <h2 className="text-base font-semibold tracking-tight">
            Upload an image
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Images appear in the homepage hero and gallery straight away.
          </p>
          <div className="mt-4 space-y-2">
            <Label htmlFor="image-title">Caption (optional)</Label>
            <Input
              id="image-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Sage-green wardrobe, Bilimora"
            />
          </div>
          <div className="mt-4">
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={handleFile}
              disabled={busy}
              className="block w-full cursor-pointer rounded-lg border border-dashed border-border/80 bg-muted/30 p-4 text-sm file:mr-4 file:rounded-md file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-medium file:text-primary-foreground hover:border-primary/50"
            />
          </div>
          {busy && (
            <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Uploading…
            </p>
          )}
        </CardContent>
      </Card>

      <div>
        <h3 className="mb-3 text-sm font-semibold tracking-tight">
          Uploaded images ({gallery?.length ?? 0})
        </h3>
        {gallery === undefined ? (
          <Skeleton className="h-40 w-full rounded-xl" />
        ) : gallery.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border/70 p-6 text-sm text-muted-foreground">
            No images yet. Upload your first project photo above.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-3">
            {gallery.map((image) => (
              <div
                key={image._id}
                className="group relative overflow-hidden rounded-xl border border-border/70 bg-card"
              >
                {image.url && (
                  <img
                    src={image.url}
                    alt={image.title}
                    className="aspect-[4/3] w-full object-cover"
                  />
                )}
                <div className="flex items-center justify-between gap-2 p-3">
                  <p className="truncate text-xs font-medium">{image.title}</p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-destructive"
                    aria-label="Delete image"
                    onClick={async () => {
                      try {
                        await apiSend(`/api/admin/images/${image._id}`, {
                          method: "DELETE",
                          token,
                        });
                        onRefresh();
                        toast.success("Image deleted");
                      } catch {
                        toast.error("Couldn't delete the image");
                      }
                    }}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function RatesTab({
  token,
  products,
  authedSend,
}: {
  token: string;
  products: Product[] | undefined;
  authedSend: (
    path: string,
    options: { method?: string; body?: unknown },
  ) => Promise<unknown>;
}) {
  if (products === undefined) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-40 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Update the name, description and starting rate for each service. Changes
        appear on the website instantly.
      </p>
      {products.map((product) => (
        <ProductRow
          key={product._id}
          product={product}
          onSave={async (args) => {
            await authedSend(`/api/admin/products/${product._id}`, {
              method: "PATCH",
              body: args,
            });
            mutate("/api/products");
            mutate("/api/admin/stats");
            toast.success("Rate updated");
          }}
        />
      ))}
    </div>
  );
}

function ProductRow({
  product,
  onSave,
}: {
  product: Product;
  onSave: (args: {
    name: string;
    description?: string;
    price: number;
  }) => Promise<void>;
}) {
  const [name, setName] = useState(product.name);
  const [description, setDescription] = useState(product.description ?? "");
  const [price, setPrice] = useState(String(product.price));
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave({
        name,
        description: description.trim() || undefined,
        price: Number(price) || 0,
      });
    } catch {
      toast.error("Couldn't update the rate");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="border-border/70 shadow-none">
      <CardContent className="grid gap-4 p-5 sm:grid-cols-[1.4fr_1fr_auto] sm:items-end">
        <div className="space-y-3">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Rate (₹)</Label>
          <Input
            type="number"
            min={0}
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
        </div>
        <Button
          type="button"
          className="gap-2"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Upload className="size-4" />
          )}
          Save
        </Button>
      </CardContent>
    </Card>
  );
}

function ReviewsTab({
  reviews,
  onStatus,
  onDelete,
}: {
  reviews: Review[] | undefined;
  onStatus: (id: string, status: "pending" | "approved") => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  if (reviews === undefined) {
    return <Skeleton className="h-32 w-full rounded-xl" />;
  }
  if (reviews.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border/70 p-6 text-sm text-muted-foreground">
        No reviews yet.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {reviews.map((review) => (
        <Card key={review._id} className="border-border/70 shadow-none">
          <CardContent className="p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-base font-semibold">{review.name}</p>
                  {review.status === "pending" ? (
                    <Badge className="border-transparent bg-amber-500/15 text-amber-700">
                      Pending
                    </Badge>
                  ) : (
                    <Badge className="border-transparent bg-primary/10 text-primary">
                      Approved
                    </Badge>
                  )}
                </div>
                <div className="mt-1 flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`size-3.5 ${
                        i < review.rating
                          ? "fill-primary text-primary"
                          : "text-muted-foreground/40"
                      }`}
                    />
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-1">
                {review.status === "pending" ? (
                  <Button
                    type="button"
                    size="sm"
                    className="gap-1.5"
                    onClick={() => onStatus(review._id, "approved")}
                  >
                    <Check className="size-4" />
                    Approve
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    onClick={() => onStatus(review._id, "pending")}
                  >
                    <RotateCcw className="size-4" />
                    Unapprove
                  </Button>
                )}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-destructive"
                  aria-label="Delete review"
                  onClick={() => onDelete(review._id)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>
            <p className="mt-3 text-sm leading-6 text-foreground/80">
              {review.text}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function EnquiriesTab({
  enquiries,
  onStatus,
  onDelete,
}: {
  enquiries: Enquiry[] | undefined;
  onStatus: (id: string, status: "new" | "handled") => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  if (enquiries === undefined) {
    return <Skeleton className="h-32 w-full rounded-xl" />;
  }
  if (enquiries.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border/70 p-6 text-sm text-muted-foreground">
        No enquiries yet.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {enquiries.map((enq) => (
        <Card key={enq._id} className="border-border/70 shadow-none">
          <CardContent className="p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-base font-semibold">{enq.name}</p>
                  {enq.status === "new" ? (
                    <Badge className="border-transparent bg-primary/10 text-primary">
                      New
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-muted-foreground">
                      Handled
                    </Badge>
                  )}
                  {enq.requirement && (
                    <Badge variant="outline" className="border-border/70">
                      {enq.requirement}
                    </Badge>
                  )}
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {enq.phone}
                  {enq.email ? ` · ${enq.email}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-1">
                {enq.status === "new" ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    onClick={() => onStatus(enq._id, "handled")}
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
                    onClick={() => onStatus(enq._id, "new")}
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
                  aria-label="Delete enquiry"
                  onClick={() => onDelete(enq._id)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-foreground/80">
              {enq.message}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function MembersTab({
  members,
}: {
  members: Member[] | undefined;
}) {
  if (members === undefined) {
    return <Skeleton className="h-32 w-full rounded-xl" />;
  }
  if (members.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border/70 p-6 text-sm text-muted-foreground">
        No registered members yet.
      </p>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border/70">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            <th className="px-4 py-3 font-medium">Name</th>
            <th className="px-4 py-3 font-medium">Email</th>
            <th className="px-4 py-3 font-medium">Phone</th>
          </tr>
        </thead>
        <tbody>
          {members.map((member) => (
            <tr key={member._id} className="border-t border-border/60">
              <td className="px-4 py-3 font-medium">{member.name}</td>
              <td className="px-4 py-3 text-muted-foreground">
                {member.email}
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                {member.phone || "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
