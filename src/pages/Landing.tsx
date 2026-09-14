import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import {
  ArrowRight,
  FileText,
  Instagram,
  Link2,
  MessageSquare,
  Package,
  Palette,
  Sparkles,
  Target,
  Users,
  Wand2,
} from "lucide-react";
import { Link } from "react-router";

const IG_BAR =
  "linear-gradient(90deg, #FEDA75 0%, #FA7E1E 28%, #D62976 58%, #962FBF 80%, #4F5BD5 100%)";

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.5 },
} as const;

const deliverables = [
  {
    number: "01",
    icon: Sparkles,
    title: "Brand Personality",
    copy: "The overall tone and feel — bold, minimal, warm, playful or professional — read straight from the feed.",
  },
  {
    number: "02",
    icon: Users,
    title: "Target Audience",
    copy: "Who they're really talking to: age, profession, pain points and what that audience wants.",
  },
  {
    number: "03",
    icon: Package,
    title: "Core Offer",
    copy: "The main product or service the business is actually selling, stripped of the noise.",
  },
  {
    number: "04",
    icon: Palette,
    title: "Brand Colours",
    copy: "Dominant feed colours with hex codes, ready to drop into a design system or moodboard.",
  },
  {
    number: "05",
    icon: MessageSquare,
    title: "Content Style",
    copy: "Formal or casual, and the exact kind of language and hooks they use in captions.",
  },
  {
    number: "06",
    icon: Target,
    title: "Website Goal",
    copy: "What the website should primarily do — generate leads, sell, build credibility or book calls.",
  },
  {
    number: "07",
    icon: FileText,
    title: "Key Message",
    copy: "One homepage headline that speaks directly to their audience and is ready to ship.",
  },
];

const steps = [
  {
    icon: Link2,
    title: "Paste the Instagram link",
    copy: "Drop in any public profile URL — or just the @handle. No spreadsheets, no manual research.",
  },
  {
    icon: Wand2,
    title: "We read the profile",
    copy: "Brand Pulse AI pulls the visible signals — bio, captions, category, counts and colours.",
  },
  {
    icon: FileText,
    title: "Get a 7-part report",
    copy: "A specific, client-ready brand analysis you can present, refine and hand over.",
  },
];

const sampleColours = [
  { name: "Sage", hex: "#7C8A72" },
  { name: "Ink", hex: "#1E1B18" },
  { name: "Cream", hex: "#F3EDE3" },
  { name: "Amber", hex: "#D98B4A" },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-5">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-xl bg-foreground text-background">
              <Instagram className="size-5" />
            </span>
            <span className="text-sm font-semibold tracking-tight">
              Brand&nbsp;Pulse&nbsp;AI
            </span>
          </Link>
          <nav className="hidden items-center gap-7 text-sm text-muted-foreground md:flex">
            <a href="#deliverables" className="transition-colors hover:text-foreground">
              What you get
            </a>
            <a href="#how" className="transition-colors hover:text-foreground">
              How it works
            </a>
            <a href="#audience" className="transition-colors hover:text-foreground">
              Who it's for
            </a>
          </nav>
          <Button asChild size="sm" className="gap-1.5">
            <Link to="/auth?returnTo=/dashboard">
              Sign in
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-[3px]"
          style={{ backgroundImage: IG_BAR }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -left-40 -top-32 size-[28rem] rounded-full bg-primary/10 blur-3xl"
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
              <Sparkles className="mr-1.5 size-3.5 text-primary" />
              Instagram brand analysis for agencies
            </Badge>
            <h1 className="mt-5 text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
              Turn any Instagram page into a
              <span className="bg-[linear-gradient(90deg,#D62976,#962FBF)] bg-clip-text text-transparent">
                {" "}
                client-ready brand report
              </span>
              .
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
              Paste an Instagram link and get a specific, 7-part brand analysis
              in seconds — personality, audience, offer, colours, content style,
              website goal and a homepage headline. No generic advice.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button asChild size="lg" className="gap-2">
                <Link to="/auth?returnTo=/dashboard">
                  Start free analysis
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <a href="#deliverables">See what you get</a>
              </Button>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              7 focused sections · hex-code palettes · ready to hand to clients
            </p>
          </motion.div>

          {/* Sample report preview */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="relative"
          >
            <div className="absolute -inset-3 -z-10 rounded-[2rem] bg-[linear-gradient(135deg,#FEDA75,#D62976,#4F5BD5)] opacity-15 blur-2xl" />
            <Card className="overflow-hidden border-border/70 shadow-xl shadow-black/5">
              <div className="h-1.5 w-full" style={{ backgroundImage: IG_BAR }} />
              <CardContent className="space-y-4 p-5">
                <div className="flex items-center gap-3">
                  <span className="flex size-10 items-center justify-center rounded-full bg-[linear-gradient(135deg,#D62976,#962FBF)] text-white">
                    <Instagram className="size-5" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold">@s_kitchen_point_bilimora</p>
                    <p className="text-xs text-muted-foreground">
                      Furniture store · PVC &amp; modular kitchens
                    </p>
                  </div>
                </div>
                <div className="rounded-lg border border-border/70 bg-muted/40 p-3">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    Key message
                  </p>
                  <p className="mt-1 text-sm font-semibold leading-snug">
                    Smart kitchens and PVC furniture built to your measurements —
                    premium style at Bilimora's best price.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-lg border border-border/70 p-3">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                      Personality
                    </p>
                    <p className="mt-1 text-xs leading-5 text-foreground/80">
                      Practical, warm and value-driven with a local, hands-on feel.
                    </p>
                  </div>
                  <div className="rounded-lg border border-border/70 p-3">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                      Website goal
                    </p>
                    <p className="mt-1 text-xs leading-5 text-foreground/80">
                      Generate enquiries &amp; booked showroom visits.
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    Brand colours
                  </p>
                  <div className="mt-2 flex gap-2">
                    {sampleColours.map((c) => (
                      <div key={c.hex} className="flex flex-col items-center gap-1">
                        <span
                          className="size-8 rounded-lg border border-black/10"
                          style={{ backgroundColor: c.hex }}
                        />
                        <span className="font-mono text-[9px] uppercase text-muted-foreground">
                          {c.hex}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Deliverables */}
      <section id="deliverables" className="border-t border-border/60 bg-muted/30">
        <div className="mx-auto w-full max-w-6xl px-5 py-16 lg:py-20">
          <motion.div {...fadeUp} className="max-w-2xl">
            <Badge variant="outline" className="border-border/70 bg-background">
              The report
            </Badge>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
              Seven answers your clients actually ask for
            </h2>
            <p className="mt-3 text-muted-foreground">
              Every analysis covers the same seven sections, so reports stay
              consistent, comparable and easy to present.
            </p>
          </motion.div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {deliverables.map((item, index) => (
              <motion.div
                key={item.number}
                {...fadeUp}
                transition={{ duration: 0.45, delay: index * 0.04 }}
              >
                <Card className="h-full border-border/70 shadow-none transition-colors hover:border-primary/40">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between">
                      <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <item.icon className="size-4" />
                      </span>
                      <span className="text-xs font-medium text-muted-foreground">
                        {item.number}
                      </span>
                    </div>
                    <h3 className="mt-4 text-base font-semibold tracking-tight">
                      {item.title}
                    </h3>
                    <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
                      {item.copy}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how">
        <div className="mx-auto w-full max-w-6xl px-5 py-16 lg:py-20">
          <motion.div {...fadeUp} className="max-w-2xl">
            <Badge variant="outline" className="border-border/70">
              How it works
            </Badge>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
              Three steps, one link
            </h2>
          </motion.div>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {steps.map((step, index) => (
              <motion.div
                key={step.title}
                {...fadeUp}
                transition={{ duration: 0.45, delay: index * 0.08 }}
                className="relative"
              >
                <div className="flex items-center gap-3">
                  <span className="flex size-10 items-center justify-center rounded-xl bg-foreground text-background">
                    <step.icon className="size-5" />
                  </span>
                  <span className="font-mono text-sm text-muted-foreground">
                    Step {index + 1}
                  </span>
                </div>
                <h3 className="mt-4 text-lg font-semibold tracking-tight">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {step.copy}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Audience */}
      <section id="audience" className="border-y border-border/60 bg-muted/30">
        <div className="mx-auto grid w-full max-w-6xl gap-10 px-5 py-16 lg:grid-cols-2 lg:py-20">
          <motion.div {...fadeUp}>
            <Badge variant="outline" className="border-border/70 bg-background">
              Who it's for
            </Badge>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
              Built for the people who pitch on Instagram
            </h2>
            <p className="mt-3 text-muted-foreground">
              If you run a studio, agency or freelance practice, you turn
              profiles into briefs every day. Brand Pulse AI compresses that
              first research pass into a minute.
            </p>
            <ul className="mt-6 space-y-3 text-sm">
              {[
                "Brand & design studios preparing client pitches",
                "Social media managers auditing a new account",
                "Freelance strategists scoping a website brief",
                "Agencies onboarding a prospect before the first call",
              ].map((line) => (
                <li key={line} className="flex items-start gap-3">
                  <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Sparkles className="size-3" />
                  </span>
                  <span className="text-foreground/80">{line}</span>
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div {...fadeUp} transition={{ duration: 0.45, delay: 0.1 }}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Card className="border-border/70 shadow-none">
                <CardContent className="p-6">
                  <p className="text-3xl font-semibold tracking-tight">7</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    sections in every report
                  </p>
                </CardContent>
              </Card>
              <Card className="border-border/70 shadow-none">
                <CardContent className="p-6">
                  <p className="text-3xl font-semibold tracking-tight">1</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    link is all it takes
                  </p>
                </CardContent>
              </Card>
              <Card className="border-border/70 shadow-none sm:col-span-2">
                <CardContent className="p-6">
                  <p className="text-sm font-medium">Saved to your workspace</p>
                  <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
                    Every analysis is stored against your account, so you can
                    reopen, compare and reuse a report for any client at any
                    time.
                  </p>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto w-full max-w-6xl px-5 py-16 lg:py-24">
        <motion.div
          {...fadeUp}
          className="relative overflow-hidden rounded-3xl border border-border/70 bg-foreground px-6 py-12 text-background sm:px-12"
        >
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-1.5"
            style={{ backgroundImage: IG_BAR }}
          />
          <div className="max-w-2xl">
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Your next client brief is one link away
            </h2>
            <p className="mt-3 text-background/70">
              Sign in, paste an Instagram profile, and walk away with a brand
              report you can present with confidence.
            </p>
            <Button
              asChild
              size="lg"
              variant="secondary"
              className="mt-7 gap-2 bg-background text-foreground hover:bg-background/90"
            >
              <Link to="/auth?returnTo=/dashboard">
                Analyse a profile free
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </motion.div>
      </section>

      <footer className="border-t border-border/60">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-3 px-5 py-8 text-sm text-muted-foreground sm:flex-row">
          <div className="flex items-center gap-2">
            <Instagram className="size-4" />
            <span>Brand Pulse AI</span>
          </div>
          <p>Instagram brand analysis for agencies and studios.</p>
        </div>
      </footer>
    </div>
  );
}
