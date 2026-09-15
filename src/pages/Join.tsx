import { BrandLogo } from "@/components/BrandLogo";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiSend } from "@/lib/api";
import {
  ArrowRight,
  CheckCircle2,
  Info,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";

type Step = "details" | "otp" | "done";

export default function Join() {
  const [step, setStep] = useState<Step>("details");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  // OTP is generated in the browser with JavaScript
  const [generatedOtp, setGeneratedOtp] = useState("");
  const [enteredOtp, setEnteredOtp] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [alreadyRegistered, setAlreadyRegistered] = useState(false);

  const handleSendOtp = (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (name.trim().length < 2) {
      setError("Please enter your name.");
      return;
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) {
      setError("Please enter a valid email address.");
      return;
    }

    // Generated right here in the browser — no backend involved.
    const code = String(Math.floor(100000 + Math.random() * 900000));
    setGeneratedOtp(code);
    setEnteredOtp("");
    setStep("otp");
  };

  const handleVerify = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (enteredOtp.trim() !== generatedOtp) {
      setError("That code doesn't match. Please try again.");
      return;
    }

    setBusy(true);
    try {
      const result = await apiSend<{ alreadyRegistered: boolean }>(
        "/api/members",
        {
          body: {
            name,
            email,
            phone: phone.trim() || undefined,
          },
        },
      );
      setAlreadyRegistered(result.alreadyRegistered);
      setStep("done");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Couldn't create your account. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/60">
        <div className="mx-auto flex h-16 w-full max-w-3xl items-center justify-between px-5">
          <Link to="/" className="flex items-center gap-2.5">
            <BrandLogo />
            <span className="text-sm font-semibold tracking-tight">
              S KITCHEN POINT
            </span>
          </Link>
          <Button asChild variant="ghost" size="sm">
            <Link to="/">Back to site</Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-md flex-col px-5 py-12">
        <Card className="border-border/70 shadow-sm">
          <CardContent className="p-6">
            {step === "details" && (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div>
                  <h1 className="text-xl font-semibold tracking-tight">
                    Create your account
                  </h1>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Register to get quotes and save your favourite designs.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="join-name">Name</Label>
                  <Input
                    id="join-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="join-email">Email</Label>
                  <Input
                    id="join-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@email.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="join-phone">Phone (optional)</Label>
                  <Input
                    id="join-phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 ..."
                  />
                </div>

                {error && <p className="text-sm text-destructive">{error}</p>}

                <Button type="submit" className="w-full gap-2">
                  Send OTP
                  <ArrowRight className="size-4" />
                </Button>
              </form>
            )}

            {step === "otp" && (
              <form onSubmit={handleVerify} className="space-y-4">
                <div>
                  <h1 className="text-xl font-semibold tracking-tight">
                    Enter your OTP
                  </h1>
                  <p className="mt-1 text-sm text-muted-foreground">
                    We generated a code for {email}.
                  </p>
                </div>

                <div className="flex items-start gap-2 rounded-xl border border-primary/30 bg-primary/5 p-3 text-sm">
                  <Info className="mt-0.5 size-4 shrink-0 text-primary" />
                  <p className="text-foreground/80">
                    Demo OTP (generated in your browser):{" "}
                    <span className="font-mono text-base font-semibold tracking-widest text-foreground">
                      {generatedOtp}
                    </span>
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="join-otp">6-digit code</Label>
                  <Input
                    id="join-otp"
                    value={enteredOtp}
                    onChange={(e) => {
                      setEnteredOtp(e.target.value.replace(/\D/g, "").slice(0, 6));
                    }}
                    inputMode="numeric"
                    placeholder="••••••"
                    className="text-center font-mono text-lg tracking-[0.4em]"
                    maxLength={6}
                  />
                </div>

                {error && <p className="text-sm text-destructive">{error}</p>}

                <Button
                  type="submit"
                  className="w-full gap-2"
                  disabled={busy || enteredOtp.length !== 6}
                >
                  {busy ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Creating account…
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="size-4" />
                      Verify &amp; create account
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={() => {
                    setStep("details");
                    setError(null);
                  }}
                  disabled={busy}
                >
                  Use different details
                </Button>
              </form>
            )}

            {step === "done" && (
              <div className="flex flex-col items-center py-4 text-center">
                <span className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <CheckCircle2 className="size-6" />
                </span>
                <h1 className="mt-4 text-xl font-semibold tracking-tight">
                  {alreadyRegistered
                    ? "You're already registered"
                    : "Welcome to S KITCHEN POINT!"}
                </h1>
                <p className="mt-1.5 max-w-xs text-sm text-muted-foreground">
                  {alreadyRegistered
                    ? `We already had an account for ${email}.`
                    : `Your account for ${email} is ready. Explore our services and save your favourites.`}
                </p>
                <Button asChild className="mt-5 w-full">
                  <Link to="/">Browse services</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <p className="mt-4 flex items-start gap-2 text-xs text-muted-foreground">
          <Info className="mt-0.5 size-3.5 shrink-0" />
          This demo generates the OTP in the browser with JavaScript. In a live
          deployment, generate and deliver the OTP from a server instead.
        </p>
      </main>
    </div>
  );
}
