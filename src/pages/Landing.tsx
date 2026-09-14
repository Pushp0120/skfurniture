import { EnquiryForm } from "@/components/EnquiryForm";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Check,
  Clock,
  CookingPot,
  DoorOpen,
  Hammer,
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

const fadeUp = {
  initial: { opacity: 0, y: 18 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.5 },
} as const;

const services = [
  {
    icon: CookingPot,
    title: "Modular Kitchens",
    copy: "Made-to-measure kitchen cabinets in modern finishes — L-shaped, straight or parallel layouts planned around your space.",
    points: ["Soft-close hardware", "Moisture-resistant carcass", "From ₹14,999"],
  },
  {
    icon: Ruler,
    title: "PVC Furniture",
    copy: "Rust, water and termite resistant PVC furniture built for real Indian homes — no swelling, no rotting, easy to clean.",
    points: ["100% waterproof", "Any size, any colour", "Indoor & outdoor"],
  },
  {
    icon: DoorOpen,
    title: "Wardrobes & Storage",
    copy: "Sliding and openable wardrobes, loft storage and utility cabinets designed to make every wall work harder.",
    points: ["Sliding or hinged", "Mirror & loft options", "Custom internals"],
  },
  {
    icon: Tv,
    title: "TV Units & Decor",
    copy: "TV units, study tables and wall décor that bring the room together — finished to match your existing interiors.",
    points: ["Wall-mounted units", "Study & console tables", "Matching finishes"],
  },
];

const work = [
  { label: "L-shaped modular kitchen", tone: "sage" as const },
  { label: "Sage-green wardrobe", tone: "sage" as const },
  { label: "PVC TV unit", tone: "wood" as const },
  { label: "Compact parallel kitchen", tone: "cream" as const },
  { label: "Loft & overhead storage", tone: "wood" as const },
  { label: "Utility & bathroom vanity", tone: "cream" as const },
];

const toneStyles: Record<string, string> = {
  sage: "bg-[linear-gradient(145deg,#9CAA93,#6E7C64)]",
  wood: "bg-[linear-gradient(145deg,#C79A6B,#9C6B3F)]",
  cream: "bg-[linear-gradient(145deg,#EFE7DA,#D8CCB8)]",
};

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
  {
    title: "Free design consultation",
    copy: "Share your room, budget and rough sizes — in the showroom or over a call.",
  },
  {
    title: "Site measurement",
    copy: "We visit, measure and finalise the layout, materials and colours with you.",
  },
  {
    title: "Build & finish",
    copy: "Your units are cut, finished and prepared so installation is quick and clean.",
  },
  {
    title: "On-site installation",
    copy: "We fit everything, align the shutters and hand over a ready-to-use kitchen.",
  },
];

const stats = [
  { value: "500+", label: "Homes fitted" },
  { value: "7 days", label: "Typical kitchen install" },
  { value: "100%", label: "Made to measure" },
  { value: "1 yr", label: "Fittings warranty" },
];

const testimonials = [
  {
    quote:
      "They measured first, designed the kitchen around our exact wall, and the price stayed where they said it would. No surprises.",
    name: "Hardik P.",
    place: "Bilimora",
  },
  {
    quote:
      "We wanted PVC furniture because of the humidity. Two years on, the wardrobes still look new and clean up in seconds.",
    name: "Nisha V.",
    place: "Chikhli",
  },
  {
    quote:
      "Kabinets and wardrobe both done in a week. The finish is neat and they respected our budget.",
    name: "Rakesh M.",
    place: "Gandevi",
  },
];

const faqs = [
  {
    q: "How much does a modular kitchen cost?",
    a: "Kitchen cabinets start from ₹14,999 and go up with size, finish and accessories. After a free measurement we give you a fixed, itemised quote — so you know the price before we build.",
  },
  {
    q: "Why PVC instead of plywood?",
    a: "PVC is waterproof, rust-free and termite-resistant, which makes it ideal for kitchens, bathrooms and humid areas. It is also easy to clean and holds its shape without swelling.",
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

export default function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-5">
          <a href="#top" className="flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-sm font-bold text-primary-foreground">
              SK
            </span>
            <span className="flex flex-col leading-none">
              <span className="text-sm font-semibold tracking-tight">
                S K Furniture
              </span>
              <span className="mt-0.5 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                PVC · Modular Kitchen · Decor
              </span>
            </span>
          </a>
          <nav className="hidden items-center gap-7 text-sm text-muted-foreground lg:flex">
            <a href="#services" className="transition-colors hover:text-foreground">
              Services
            </a>
            <a href="#work" className="transition-colors hover:text-foreground">
              Our work
            </a>
            <a href="#why" className="transition-colors hover:text-foreground">
              Why us
            </a>
            <a href="#process" className="transition-colors hover:text-foreground">
              Process
            </a>
            <a href="#contact" className="transition-colors hover:text-foreground">
              Contact
            </a>
          </nav>
          <Button asChild size="sm" className="gap-1.5">
            <a href="#contact">
              Get a free quote
              <ArrowRight className="size-4" />
            </a>
          </Button>
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
              S K Furniture designs and builds modular kitchens, waterproof PVC
              furniture and storage that fit your walls, your budget and the way
              your family actually lives. <strong>Quality · Style · Best price.</strong>
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button asChild size="lg" className="gap-2">
                <a href="#contact">
                  Get a free quote
                  <ArrowRight className="size-4" />
                </a>
              </Button>
              <Button asChild size="lg" variant="outline" className="gap-2">
                <a href="#work">See our work</a>
              </Button>
            </div>
            <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <Check className="size-4 text-primary" />
                Free design consultation
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Check className="size-4 text-primary" />
                Made to your measurements
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Check className="size-4 text-primary" />
                Kitchen cabinets from ₹14,999
              </span>
            </div>
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
                <KitchenPanel />
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

      {/* Feature strip */}
      <section className="border-y border-border/60 bg-primary text-primary-foreground">
        <div className="mx-auto grid w-full max-w-6xl grid-cols-2 gap-6 px-5 py-7 text-sm sm:grid-cols-4">
          {[
            "Waterproof PVC",
            "Made to measure",
            "18mm boards",
            "Free site visit",
          ].map((item) => (
            <div key={item} className="flex items-center gap-2">
              <Check className="size-4 shrink-0 text-primary-foreground/80" />
              <span className="font-medium">{item}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Services */}
      <section id="services" className="mx-auto w-full max-w-6xl scroll-mt-20 px-5 py-16 lg:py-20">
        <motion.div {...fadeUp} className="max-w-2xl">
          <Badge variant="outline" className="border-border/70">
            What we do
          </Badge>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
            Furniture built around your space
          </h2>
          <p className="mt-3 text-muted-foreground">
            From a single kitchen to a full home fit-out — every job is measured,
            planned and built to your rooms.
          </p>
        </motion.div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {services.map((service, index) => (
            <motion.div
              key={service.title}
              {...fadeUp}
              transition={{ duration: 0.45, delay: index * 0.05 }}
            >
              <Card className="h-full border-border/70 shadow-none transition-colors hover:border-primary/40">
                <CardContent className="p-6">
                  <span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <service.icon className="size-5" />
                  </span>
                  <h3 className="mt-4 text-lg font-semibold tracking-tight">
                    {service.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {service.copy}
                  </p>
                  <ul className="mt-4 flex flex-wrap gap-2">
                    {service.points.map((point) => (
                      <li
                        key={point}
                        className="rounded-full border border-border/70 bg-muted/50 px-3 py-1 text-xs font-medium text-foreground/80"
                      >
                        {point}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Work */}
      <section id="work" className="scroll-mt-20 border-y border-border/60 bg-muted/30">
        <div className="mx-auto w-full max-w-6xl px-5 py-16 lg:py-20">
          <motion.div {...fadeUp} className="max-w-2xl">
            <Badge variant="outline" className="border-border/70 bg-background">
              Our work
            </Badge>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
              A few finishes we love
            </h2>
            <p className="mt-3 text-muted-foreground">
              Sage, walnut and bright cream are our most-requested looks. Every
              unit is finished to match the kitchen or room it lives in.
            </p>
          </motion.div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {work.map((item, index) => (
              <motion.div
                key={item.label}
                {...fadeUp}
                transition={{ duration: 0.45, delay: index * 0.04 }}
                className="group overflow-hidden rounded-2xl border border-border/70 bg-card"
              >
                <div
                  className={`relative flex aspect-[4/3] items-end ${toneStyles[item.tone]}`}
                >
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
        </div>
      </section>

      {/* Why us */}
      <section id="why" className="mx-auto w-full max-w-6xl scroll-mt-20 px-5 py-16 lg:py-20">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <motion.div {...fadeUp}>
            <Badge variant="outline" className="border-border/70">
              Why S K Furniture
            </Badge>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
              Showroom quality, local price
            </h2>
            <p className="mt-3 text-muted-foreground">
              We are a Bilimora workshop, not a chain. You deal with the people
              who measure, build and fit your furniture — which is why the finish
              on site matches the plan, and the price stays honest.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild className="gap-2">
                <a href="#contact">
                  Book a free measurement
                  <ArrowRight className="size-4" />
                </a>
              </Button>
              <Button asChild variant="outline" className="gap-2">
                <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer">
                  <Instagram className="size-4" />
                  See the feed
                </a>
              </Button>
            </div>
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

      {/* Testimonials */}
      <section className="border-y border-border/60 bg-muted/30">
        <div className="mx-auto w-full max-w-6xl px-5 py-16 lg:py-20">
          <motion.div {...fadeUp} className="max-w-2xl">
            <Badge variant="outline" className="border-border/70 bg-background">
              Happy homes
            </Badge>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
              What customers say
            </h2>
          </motion.div>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {testimonials.map((item, index) => (
              <motion.div
                key={item.name}
                {...fadeUp}
                transition={{ duration: 0.45, delay: index * 0.05 }}
              >
                <Card className="h-full border-border/70 shadow-none">
                  <CardContent className="flex h-full flex-col p-6">
                    <Quote className="size-6 text-primary/50" />
                    <p className="mt-3 flex-1 text-sm leading-6 text-foreground/80">
                      {item.quote}
                    </p>
                    <div className="mt-5 flex items-center gap-3 border-t border-border/60 pt-4">
                      <span className="flex size-9 items-center justify-center rounded-full bg-accent text-sm font-semibold text-accent-foreground">
                        {item.name.charAt(0)}
                      </span>
                      <div>
                        <p className="text-sm font-medium">{item.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.place}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
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

      {/* Contact */}
      <section id="contact" className="scroll-mt-20 border-t border-border/60 bg-muted/30">
        <div className="mx-auto grid w-full max-w-6xl gap-10 px-5 py-16 lg:grid-cols-2 lg:py-20">
          <motion.div {...fadeUp}>
            <Badge variant="outline" className="border-border/70 bg-background">
              Get a quote
            </Badge>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
              Let's plan your kitchen or wardrobe
            </h2>
            <p className="mt-3 text-muted-foreground">
              Send your details and we'll call you back to arrange a free
              measurement and an itemised quote. No obligation.
            </p>

            <div className="mt-8 space-y-4">
              <div className="flex items-start gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-card text-primary shadow-sm">
                  <MapPin className="size-5" />
                </span>
                <div>
                  <p className="text-sm font-medium">Visit the showroom</p>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    Shop No. 15, Ground Floor, Shree Vinayak Homes,
                    <br />
                    Opp. ITI, Atalia, Bilimora — 396321
                  </p>
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
              <div className="flex items-start gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-card text-primary shadow-sm">
                  <Instagram className="size-5" />
                </span>
                <div>
                  <p className="text-sm font-medium">Message us on Instagram</p>
                  <a
                    href={INSTAGRAM_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-0.5 inline-flex text-sm text-primary underline-offset-4 hover:underline"
                  >
                    @s_kitchen_point_bilimora
                  </a>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            {...fadeUp}
            transition={{ duration: 0.45, delay: 0.1 }}
            id="quote-form"
          >
            <EnquiryForm />
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/60">
        <div className="mx-auto grid w-full max-w-6xl gap-8 px-5 py-12 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2">
            <div className="flex items-center gap-2.5">
              <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-sm font-bold text-primary-foreground">
                SK
              </span>
              <span className="text-sm font-semibold tracking-tight">
                S K Furniture
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
                  Services
                </a>
              </li>
              <li>
                <a href="#work" className="hover:text-foreground">
                  Our work
                </a>
              </li>
              <li>
                <a href="#why" className="hover:text-foreground">
                  Why us
                </a>
              </li>
              <li>
                <a href="#contact" className="hover:text-foreground">
                  Contact
                </a>
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
                <Link
                  to="/auth?returnTo=/dashboard"
                  className="text-xs text-muted-foreground/70 underline-offset-4 hover:text-foreground hover:underline"
                >
                  Owner login
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-border/60">
          <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-2 px-5 py-5 text-xs text-muted-foreground sm:flex-row">
            <p>© {new Date().getFullYear()} S K Furniture, Bilimora.</p>
            <p>Quality · Style · Best price</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
