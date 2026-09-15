import { EnquiryForm } from "@/components/EnquiryForm";
import { BrandLogo } from "@/components/BrandLogo";
import { ReviewForm } from "@/components/ReviewForm";
import { Stars } from "@/components/Stars";
import { WishlistButton } from "@/components/WishlistButton";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useWishlist } from "@/hooks/use-wishlist";
import { useApi } from "@/lib/api";
import type { GalleryItem, Product, Review } from "@/lib/api";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Check,
  Clock,
  CookingPot,
  DoorOpen,
  Hammer,
  Heart,
  Instagram,
  MapPin,
  Quote,
  Ruler,
  ShieldCheck,
  Sofa,
  Sparkles,
  Star,
  Tv,
} from "lucide-react";
import { Link } from "react-router";

const INSTAGRAM_URL = "https://instagram.com/s_kitchen_point_bilimora";
const ADDRESS =
  "Shop No. 15, Ground Floor, Shree Vinayak Homes, Opp. ITI, Atalia, Bilimora 396321";
const MAP_SRC =
  "https://www.google.com/maps?q=Shree%20Vinayak%20Homes%2C%20Opp.%20ITI%2C%20Atalia%2C%20Bilimora%20396321&output=embed";

const fadeUp = {
  initial: { opacity: 0, y: 18 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.5 },
} as const;

const serviceIcon = [CookingPot, DoorOpen, Tv, Ruler];

const toneStyles: Record<string, string> = {
  sage: "bg-[linear-gradient(145deg,#9CAA93,#6E7C64)]",
  wood: "bg-[linear-gradient(145deg,#C79A6B,#9C6B3F)]",
  cream: "bg-[linear-gradient(145deg,#EFE7DA,#D8CCB8)]",
};

const fallbackTiles = [
  { label: "L-shaped modular kitchen", tone: "sage" as const },
  { label: "Sage-green wardrobe", tone: "sage" as const },
  { label: "PVC TV unit", tone: "wood" as const },
  { label: "Compact parallel kitchen", tone: "cream" as const },
  { label: "Loft & overhead storage", tone: "wood" as const },
  { label: "Utility & bathroom vanity", tone: "cream" as const },
];

const benefits = [
  {
    icon: Sparkles,
    title: "Quality, style, best price",
    copy: "Factory-finished modules at showroom quality, without the showroom markup.",
  },
  {
    icon: Ruler,
    title: "Made to your measurements",
    copy: "Every unit is built to your exact dimensions — no awkward gaps, no wasted space.",
  },
  {
    icon: ShieldCheck,
    title: "Rust & termite resistant",
    copy: "PVC and treated boards that survive kitchens, bathrooms and monsoon humidity.",
  },
  {
    icon: Hammer,
    title: "Local install team",
    copy: "Fitted by the same team that builds it, so the finish on site matches the design.",
  },
];

const steps = [
  { title: "Free consultation", copy: "Share your room, budget and rough sizes." },
  { title: "Site measurement", copy: "We visit, measure and finalise the design." },
  { title: "Build & finish", copy: "Your units are cut and finished in the workshop." },
  { title: "Installation", copy: "We fit everything and hand over a ready kitchen." },
];

const stats = [
  { value: "500+", label: "Homes fitted" },
  { value: "7 days", label: "Typical install" },
  { value: "100%", label: "Made to measure" },
  { value: "1 yr", label: "Fittings warranty" },
];

const faqs = [
  {
    q: "How much does a modular kitchen cost?",
    a: "Kitchen cabinets start from ₹14,999 and go up with size, finish and accessories. After a free measurement we give you a fixed, itemised quote — so you know the price before we build.",
  },
  {
    q: "Why PVC instead of plywood?",
    a: "PVC is waterproof, rust-free and termite-resistant, which makes it ideal for kitchens, bathrooms and humid areas. It cleans easily and holds its shape without swelling.",
  },
  {
    q: "How long does an installation take?",
    a: "Most kitchen and wardrobe jobs are fitted in about a week from finalising the design, depending on size and material availability.",
  },
  {
    q: "Do you come to my location?",
    a: "Yes. We are based in Bilimora and install across the surrounding towns and villages. Share your address in the enquiry form and we will confirm a visit slot.",
  },
];

function KitchenPanel() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-black/5 bg-[linear-gradient(160deg,#F4EEE3,#E4D9C6)] p-5">
      <div className="grid grid-cols-4 gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-14 rounded-md bg-[linear-gradient(160deg,#9CAA93,#75856A)] shadow-inner sm:h-16"
          />
        ))}
      </div>
      <div className="mt-3 h-3 rounded-full bg-[#2C2A27]" />
      <div className="mt-3 grid grid-cols-3 gap-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="flex h-24 flex-col justify-end rounded-md border border-black/5 bg-[#F6F1E8] p-2 sm:h-28"
          >
            <div className="mx-auto mb-1 h-1.5 w-8 rounded-full bg-[#C79A6B]" />
            <div className="h-16 rounded-sm bg-[linear-gradient(160deg,#EFE7DA,#DCD0BC)] sm:h-20" />
          </div>
        ))}
      </div>
    </div>
  );
}

function formatPrice(value: number) {
  return `₹${value.toLocaleString("en-IN")}`;
}

export default function Landing() {
  const gallery = useApi<GalleryItem[]>("/api/gallery");
  const products = useApi<Product[]>("/api/products");
  const reviews = useApi<Review[]>("/api/reviews", { pollMs: 30000 });
  const { count: wishlistCount } = useWishlist();

  const heroImages = (gallery ?? [])
    .filter((image) => image.url)
    .slice(0, 3);

  const avgRating =
    reviews && reviews.length > 0
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
      : 0;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-5">
          <a href="#top" className="flex items-center gap-2.5">
            <BrandLogo />
            <span className="flex flex-col leading-none">
              <span className="text-sm font-semibold tracking-tight">
                S KITCHEN POINT
              </span>
              <span className="mt-0.5 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                PVC · Modular Kitchen · Decor
              </span>
            </span>
          </a>
          <nav className="hidden items-center gap-6 text-sm text-muted-foreground lg:flex">
            <a href="#services" className="transition-colors hover:text-foreground">
              Services
            </a>
            <a href="#gallery" className="transition-colors hover:text-foreground">
              Gallery
            </a>
            <a href="#reviews" className="transition-colors hover:text-foreground">
              Reviews
            </a>
            <a href="#location" className="transition-colors hover:text-foreground">
              Location
            </a>
            <a href="#contact" className="transition-colors hover:text-foreground">
              Contact
            </a>
          </nav>
          <div className="flex items-center gap-2">
            <Button
              asChild
              variant="outline"
              size="icon"
              className="relative"
              aria-label="Wishlist"
            >
              <Link to="/wishlist">
                <Heart className="size-4" />
                {wishlistCount > 0 && (
                  <span className="absolute -right-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground">
                    {wishlistCount}
                  </span>
                )}
              </Link>
            </Button>
            <Button asChild variant="outline" size="icon" aria-label="Instagram">
              <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer">
                <Instagram className="size-4" />
              </a>
            </Button>
            <Button asChild size="sm" className="gap-1.5">
              <a href="#contact">
                Get a quote
                <ArrowRight className="size-4" />
              </a>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section id="top" className="relative scroll-mt-20 overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-32 -top-24 size-[30rem] rounded-full bg-accent/60 blur-3xl"
        />
        <div className="mx-auto grid w-full max-w-6xl items-center gap-12 px-5 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:py-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Badge
              variant="outline"
              className="border-border/70 bg-card/60 text-muted-foreground"
            >
              <MapPin className="mr-1.5 size-3.5 text-primary" />
              Bilimora · PVC furniture &amp; modular kitchens
            </Badge>
            <h1 className="mt-5 text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
              Smart kitchens &amp; PVC furniture,
              <span className="text-primary"> made to fit your home</span>.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
              S KITCHEN POINT designs and builds modular kitchens, waterproof PVC
              furniture and storage that fit your walls, your budget and the way
              your family lives.{" "}
              <strong>Quality · Style · Best price.</strong>
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button asChild size="lg" className="gap-2">
                <a href="#contact">
                  Get a free quote
                  <ArrowRight className="size-4" />
                </a>
              </Button>
              <Button asChild size="lg" variant="outline" className="gap-2">
                <a href="#gallery">See our work</a>
              </Button>
              <Button asChild size="lg" variant="outline" className="gap-2">
                <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer">
                  <Instagram className="size-4" />
                  Instagram
                </a>
              </Button>
            </div>
            {reviews && reviews.length > 0 && (
              <div className="mt-6 flex items-center gap-3 text-sm text-muted-foreground">
                <Stars value={avgRating} />
                <span>
                  {avgRating.toFixed(1)} from {reviews.length} review
                  {reviews.length > 1 ? "s" : ""}
                </span>
              </div>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="relative"
          >
            <div className="absolute -inset-4 -z-10 rounded-[2rem] bg-[radial-gradient(60%_60%_at_70%_20%,rgba(199,154,107,0.35),transparent)] blur-2xl" />
            <Card className="overflow-hidden border-border/70 shadow-xl shadow-black/5">
              <CardContent className="p-3">
                {heroImages.length > 0 ? (
                  <div className="grid grid-cols-2 gap-3">
                    {heroImages[0].url && (
                      <img
                        src={heroImages[0].url}
                        alt={heroImages[0].title}
                        className="col-span-2 h-48 w-full rounded-xl object-cover sm:h-56"
                        loading="eager"
                      />
                    )}
                    {heroImages.slice(1, 3).map((image) =>
                      image.url ? (
                        <img
                          key={image._id}
                          src={image.url}
                          alt={image.title}
                          className="h-28 w-full rounded-xl object-cover sm:h-32"
                          loading="lazy"
                        />
                      ) : null,
                    )}
                  </div>
                ) : (
                  <KitchenPanel />
                )}
              </CardContent>
            </Card>
            <div className="absolute -bottom-4 -left-3 rounded-xl border border-border/70 bg-card px-4 py-3 shadow-lg sm:-left-6">
              <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                Kitchen cabinets
              </p>
              <p className="text-lg font-semibold tracking-tight">from ₹14,999</p>
            </div>
            <div className="absolute -top-3 right-2 flex items-center gap-1.5 rounded-full border border-border/70 bg-card px-3 py-1.5 shadow-md">
              <Star className="size-3.5 fill-primary text-primary" />
              <span className="text-xs font-medium">Built in Bilimora</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Trust strip */}
      <section className="border-y border-border/60 bg-primary text-primary-foreground">
        <div className="mx-auto grid w-full max-w-6xl grid-cols-2 gap-6 px-5 py-7 text-sm sm:grid-cols-4">
          {["Waterproof PVC", "Made to measure", "18mm boards", "Free site visit"].map(
            (item) => (
              <div key={item} className="flex items-center gap-2">
                <Check className="size-4 shrink-0 text-primary-foreground/80" />
                <span className="font-medium">{item}</span>
              </div>
            ),
          )}
        </div>
      </section>

      {/* Services & rates */}
      <section id="services" className="mx-auto w-full max-w-6xl scroll-mt-20 px-5 py-16 lg:py-20">
        <motion.div {...fadeUp} className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <Badge variant="outline" className="border-border/70">
              Services &amp; rates
            </Badge>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
              What we build &amp; what it costs
            </h2>
            <p className="mt-3 text-muted-foreground">
              Transparent starting rates. Tap the heart on anything you like to
              save it to your wishlist.
            </p>
          </div>
          <Button asChild variant="outline" className="gap-2 self-start sm:self-auto">
            <Link to="/wishlist">
              <Heart className="size-4" />
              My wishlist{wishlistCount > 0 ? ` (${wishlistCount})` : ""}
            </Link>
          </Button>
        </motion.div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {products === undefined
            ? Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-44 w-full rounded-xl" />
              ))
            : products.map((product, index) => {
                const Icon = serviceIcon[index % serviceIcon.length];
                return (
                  <motion.div
                    key={product._id}
                    {...fadeUp}
                    transition={{ duration: 0.45, delay: index * 0.04 }}
                  >
                    <Card className="h-full border-border/70 shadow-none transition-colors hover:border-primary/40">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                              <Icon className="size-5" />
                            </span>
                            <h3 className="text-lg font-semibold tracking-tight">
                              {product.name}
                            </h3>
                          </div>
                          <WishlistButton
                            item={{
                              id: product._id,
                              name: product.name,
                              price: product.price,
                              priceNote: product.priceNote,
                            }}
                          />
                        </div>
                        {product.description && (
                          <p className="mt-3 text-sm leading-6 text-muted-foreground">
                            {product.description}
                          </p>
                        )}
                        <div className="mt-4 flex items-baseline gap-2">
                          <span className="text-2xl font-semibold tracking-tight">
                            {formatPrice(product.price)}
                          </span>
                          {product.priceNote && (
                            <span className="text-sm text-muted-foreground">
                              {product.priceNote}
                            </span>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
        </div>
      </section>

      {/* Gallery */}
      <section id="gallery" className="scroll-mt-20 border-y border-border/60 bg-muted/30">
        <div className="mx-auto w-full max-w-6xl px-5 py-16 lg:py-20">
          <motion.div {...fadeUp} className="max-w-2xl">
            <Badge variant="outline" className="border-border/70 bg-background">
              Our work
            </Badge>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
              Recent kitchens &amp; furniture
            </h2>
            <p className="mt-3 text-muted-foreground">
              Sage, walnut and bright cream are our most-requested looks. Every
              unit is finished to match the room it lives in.
            </p>
          </motion.div>

          {gallery && gallery.length > 0 ? (
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {gallery.map((image, index) => (
                <motion.div
                  key={image._id}
                  {...fadeUp}
                  transition={{ duration: 0.45, delay: index * 0.03 }}
                  className="group relative overflow-hidden rounded-2xl border border-border/70 bg-card"
                >
                  {image.url && (
                    <img
                      src={image.url}
                      alt={image.title}
                      className="aspect-[4/3] w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                  )}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                    <p className="text-sm font-medium text-white">
                      {image.title}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {fallbackTiles.map((item, index) => (
                <motion.div
                  key={item.label}
                  {...fadeUp}
                  transition={{ duration: 0.45, delay: index * 0.04 }}
                  className="group overflow-hidden rounded-2xl border border-border/70 bg-card"
                >
                  <div className={`relative flex aspect-[4/3] items-end ${toneStyles[item.tone]}`}>
                    <div
                      aria-hidden
                      className="absolute inset-0 opacity-25 [background-image:repeating-linear-gradient(90deg,rgba(255,255,255,0.4)_0_1px,transparent_1px_22px)]"
                    />
                    <div className="relative m-3 rounded-lg bg-black/35 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm">
                      {item.label}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Why us */}
      <section id="why" className="mx-auto w-full max-w-6xl scroll-mt-20 px-5 py-16 lg:py-20">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <motion.div {...fadeUp}>
            <Badge variant="outline" className="border-border/70">
              Why S KITCHEN POINT
            </Badge>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
              Showroom quality, local price
            </h2>
            <p className="mt-3 text-muted-foreground">
              We are a Bilimora workshop, not a chain. You deal with the people
              who measure, build and fit your furniture — which is why the finish
              on site matches the plan, and the price stays honest.
            </p>
          </motion.div>

          <div className="grid gap-4 sm:grid-cols-2">
            {benefits.map((benefit, index) => (
              <motion.div
                key={benefit.title}
                {...fadeUp}
                transition={{ duration: 0.45, delay: index * 0.05 }}
              >
                <Card className="h-full border-border/70 shadow-none">
                  <CardContent className="p-5">
                    <span className="flex size-10 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                      <benefit.icon className="size-5" />
                    </span>
                    <h3 className="mt-3.5 text-base font-semibold tracking-tight">
                      {benefit.title}
                    </h3>
                    <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
                      {benefit.copy}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-border/60 bg-foreground text-background">
        <div className="mx-auto grid w-full max-w-6xl grid-cols-2 gap-8 px-5 py-12 sm:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label}>
              <p className="text-3xl font-semibold tracking-tight sm:text-4xl">
                {stat.value}
              </p>
              <p className="mt-1 text-sm text-background/70">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Process */}
      <section id="process" className="mx-auto w-full max-w-6xl scroll-mt-20 px-5 py-16 lg:py-20">
        <motion.div {...fadeUp} className="max-w-2xl">
          <Badge variant="outline" className="border-border/70">
            How it works
          </Badge>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
            From idea to installed, in four steps
          </h2>
        </motion.div>
        <div className="mt-10 grid gap-6 md:grid-cols-4">
          {steps.map((step, index) => (
            <motion.div
              key={step.title}
              {...fadeUp}
              transition={{ duration: 0.45, delay: index * 0.06 }}
            >
              <div className="flex items-center gap-3">
                <span className="flex size-9 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                  {index + 1}
                </span>
                <span className="h-px flex-1 bg-border" />
              </div>
              <h3 className="mt-4 text-base font-semibold tracking-tight">
                {step.title}
              </h3>
              <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
                {step.copy}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Reviews */}
      <section id="reviews" className="scroll-mt-20 border-y border-border/60 bg-muted/30">
        <div className="mx-auto w-full max-w-6xl px-5 py-16 lg:py-20">
          <motion.div {...fadeUp} className="max-w-2xl">
            <Badge variant="outline" className="border-border/70 bg-background">
              Reviews
            </Badge>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
              What customers say
            </h2>
          </motion.div>

          <div className="mt-10 grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="grid gap-4 sm:grid-cols-2">
              {reviews === undefined ? (
                Array.from({ length: 2 }).map((_, i) => (
                  <Skeleton key={i} className="h-40 w-full rounded-xl" />
                ))
              ) : reviews.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border/70 p-8 text-center text-sm text-muted-foreground sm:col-span-2">
                  No reviews yet — be the first to share your experience.
                </div>
              ) : (
                reviews.map((review, index) => (
                  <motion.div
                    key={review._id}
                    {...fadeUp}
                    transition={{ duration: 0.45, delay: index * 0.04 }}
                  >
                    <Card className="h-full border-border/70 shadow-none">
                      <CardContent className="flex h-full flex-col p-6">
                        <Quote className="size-6 text-primary/50" />
                        <Stars value={review.rating} className="mt-3" />
                        <p className="mt-3 flex-1 text-sm leading-6 text-foreground/80">
                          {review.text}
                        </p>
                        <div className="mt-5 flex items-center gap-3 border-t border-border/60 pt-4">
                          <span className="flex size-9 items-center justify-center rounded-full bg-accent text-sm font-semibold text-accent-foreground">
                            {review.name.charAt(0).toUpperCase()}
                          </span>
                          <p className="text-sm font-medium">{review.name}</p>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))
              )}
            </div>

            <motion.div {...fadeUp} transition={{ duration: 0.45, delay: 0.1 }}>
              <h3 className="mb-3 text-base font-semibold tracking-tight">
                Leave a review
              </h3>
              <ReviewForm />
            </motion.div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto w-full max-w-3xl px-5 py-16 lg:py-20">
        <motion.div {...fadeUp} className="text-center">
          <Badge variant="outline" className="border-border/70">
            FAQ
          </Badge>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
            Questions, answered
          </h2>
        </motion.div>
        <motion.div {...fadeUp} className="mt-8">
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={faq.q} value={`item-${index}`}>
                <AccordionTrigger className="text-left text-base">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-sm leading-6 text-muted-foreground">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </section>

      {/* Location + map */}
      <section id="location" className="scroll-mt-20 border-y border-border/60 bg-muted/30">
        <div className="mx-auto grid w-full max-w-6xl gap-10 px-5 py-16 lg:grid-cols-2 lg:py-20">
          <motion.div {...fadeUp}>
            <Badge variant="outline" className="border-border/70 bg-background">
              Find us
            </Badge>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
              Visit the showroom
            </h2>
            <div className="mt-6 space-y-5">
              <div className="flex items-start gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-card text-primary shadow-sm">
                  <MapPin className="size-5" />
                </span>
                <div>
                  <p className="text-sm font-medium">Address</p>
                  <p className="mt-0.5 text-sm text-muted-foreground">{ADDRESS}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-card text-primary shadow-sm">
                  <Clock className="size-5" />
                </span>
                <div>
                  <p className="text-sm font-medium">Opening hours</p>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    Mon–Sat, 9:30am – 8:30pm · Sunday by appointment
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-3 pt-1">
                <Button asChild className="gap-2">
                  <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer">
                    <Instagram className="size-4" />
                    Message on Instagram
                  </a>
                </Button>
                <Button asChild variant="outline" className="gap-2">
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ADDRESS)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <MapPin className="size-4" />
                    Open in Google Maps
                  </a>
                </Button>
              </div>
            </div>
          </motion.div>

          <motion.div
            {...fadeUp}
            transition={{ duration: 0.45, delay: 0.1 }}
            className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm"
          >
            <iframe
              title="S KITCHEN POINT location on Google Maps"
              src={MAP_SRC}
              className="h-80 w-full border-0 lg:h-full lg:min-h-[22rem]"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </motion.div>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="scroll-mt-20">
        <div className="mx-auto grid w-full max-w-6xl gap-10 px-5 py-16 lg:grid-cols-2 lg:py-20">
          <motion.div {...fadeUp}>
            <Badge variant="outline" className="border-border/70">
              Get a quote
            </Badge>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
              Let's plan your kitchen or wardrobe
            </h2>
            <p className="mt-3 text-muted-foreground">
              Send your details and we'll call you back to arrange a free
              measurement and an itemised quote. No obligation.
            </p>
            <ul className="mt-6 space-y-3 text-sm">
              {[
                "Free design consultation and site measurement",
                "Fixed, itemised quote before we build",
                "Waterproof PVC and treated boards",
                "Local installation by our own team",
              ].map((line) => (
                <li key={line} className="flex items-start gap-3">
                  <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Check className="size-3" />
                  </span>
                  <span className="text-foreground/80">{line}</span>
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div {...fadeUp} transition={{ duration: 0.45, delay: 0.1 }}>
            <EnquiryForm />
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/60">
        <div className="mx-auto grid w-full max-w-6xl gap-8 px-5 py-12 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2">
            <div className="flex items-center gap-2.5">
              <BrandLogo />
              <span className="text-sm font-semibold tracking-tight">
                S KITCHEN POINT
              </span>
            </div>
            <p className="mt-3 max-w-sm text-sm leading-6 text-muted-foreground">
              Modular kitchens, waterproof PVC furniture and custom storage,
              built to measure in Bilimora and fitted across the surrounding
              towns.
            </p>
          </div>
          <div>
            <p className="text-sm font-semibold">Explore</p>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li>
                <a href="#services" className="hover:text-foreground">
                  Services &amp; rates
                </a>
              </li>
              <li>
                <a href="#gallery" className="hover:text-foreground">
                  Gallery
                </a>
              </li>
              <li>
                <a href="#reviews" className="hover:text-foreground">
                  Reviews
                </a>
              </li>
              <li>
                <Link to="/wishlist" className="hover:text-foreground">
                  Wishlist
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="text-sm font-semibold">Contact</p>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li>
                <a
                  href={INSTAGRAM_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 hover:text-foreground"
                >
                  <Instagram className="size-3.5" />
                  Instagram
                </a>
              </li>
              <li className="flex items-start gap-1.5">
                <Sofa className="mt-0.5 size-3.5 shrink-0" />
                <span>Atalia, Bilimora 396321</span>
              </li>
              <li>
                <Link to="/join" className="hover:text-foreground">
                  Create an account
                </Link>
              </li>
              <li>
                <Link
                  to="/admin"
                  className="text-xs text-muted-foreground/70 underline-offset-4 hover:text-foreground hover:underline"
                >
                  Admin login
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-border/60">
          <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-2 px-5 py-5 text-xs text-muted-foreground sm:flex-row">
            <p>© {new Date().getFullYear()} S KITCHEN POINT, Bilimora.</p>
            <p>Quality · Style · Best price</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
