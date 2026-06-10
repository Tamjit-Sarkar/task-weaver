import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Loader2, Mail, Lock, Sparkles, ArrowRight, Eye, EyeOff, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — Taskflow" },
      { name: "description", content: "Sign in or create your Taskflow account to organize your work." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<"signin" | "signup" | "forgot">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/" });
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session) navigate({ to: "/" });
    });
    return () => sub.subscription.unsubscribe();
  }, [navigate]);

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) toast.error(error.message);
    else toast.success("Welcome back");
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6) return toast.error("Password must be at least 6 characters");
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/` },
    });
    setLoading(false);
    if (error) toast.error(error.message);
    else toast.success("Account created — you're in");
  }

  async function handleForgot(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) toast.error(error.message);
    else {
      setSent(true);
      toast.success("Reset link sent");
    }
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 py-12 overflow-hidden">
      {/* Floating ambient orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-[oklch(0.55_0.22_295/0.25)] blur-3xl animate-float" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-[oklch(0.7_0.18_25/0.2)] blur-3xl animate-float" style={{ animationDelay: "3s" }} />
        <div className="absolute top-1/3 right-1/4 w-72 h-72 rounded-full bg-[oklch(0.82_0.14_85/0.15)] blur-3xl animate-float" style={{ animationDelay: "6s" }} />
      </div>

      <div className="relative w-full max-w-md">
        {/* Brand */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative mb-4">
            <div className="absolute inset-0 blur-xl bg-[oklch(0.82_0.14_85/0.5)] rounded-full" />
            <div className="relative h-14 w-14 rounded-2xl bg-gradient-to-br from-[oklch(0.88_0.12_90)] to-[oklch(0.72_0.18_60)] flex items-center justify-center shadow-glow">
              <Sparkles className="h-7 w-7 text-[oklch(0.18_0.02_270)]" />
            </div>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight">
            <span className="text-gradient-gold">Taskflow</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Organize your work. Beautifully.</p>
        </div>

        {/* Card */}
        <div className="bg-card-glass border border-border/60 rounded-2xl shadow-elegant p-8">
          <Tabs value={tab} onValueChange={(v) => { setTab(v as typeof tab); setSent(false); }}>
            <TabsList className="grid grid-cols-2 w-full mb-6 bg-secondary/40">
              <TabsTrigger value="signin">Sign in</TabsTrigger>
              <TabsTrigger value="signup">Create account</TabsTrigger>
            </TabsList>

            {/* SIGN IN */}
            <TabsContent value="signin" className="space-y-4">
              {tab === "forgot" ? null : (
                <form onSubmit={handleSignIn} className="space-y-4">
                  <FieldEmail value={email} onChange={setEmail} />
                  <FieldPassword value={password} onChange={setPassword} show={showPw} toggle={() => setShowPw(!showPw)} />
                  <div className="flex justify-end -mt-2">
                    <button
                      type="button"
                      onClick={() => setTab("forgot")}
                      className="text-xs text-muted-foreground hover:text-primary transition-colors"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <SubmitButton loading={loading} label="Sign in" />
                </form>
              )}
            </TabsContent>

            {/* SIGN UP */}
            <TabsContent value="signup" className="space-y-4">
              <form onSubmit={handleSignUp} className="space-y-4">
                <FieldEmail value={email} onChange={setEmail} />
                <FieldPassword value={password} onChange={setPassword} show={showPw} toggle={() => setShowPw(!showPw)} />
                <p className="text-xs text-muted-foreground">At least 6 characters.</p>
                <SubmitButton loading={loading} label="Create account" />
              </form>
            </TabsContent>
          </Tabs>

          {/* FORGOT (separate panel) */}
          {tab === "forgot" && (
            <div className="space-y-4 -mt-2">
              <div>
                <h2 className="text-lg font-semibold">Reset your password</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Enter your email and we'll send you a link to set a new one.
                </p>
              </div>
              {sent ? (
                <div className="rounded-lg border border-border/60 bg-secondary/30 p-4 flex gap-3">
                  <CheckCircle2 className="h-5 w-5 text-[oklch(0.75_0.18_150)] shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium">Check your inbox</p>
                    <p className="text-muted-foreground mt-1">We sent a reset link to {email}.</p>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleForgot} className="space-y-4">
                  <FieldEmail value={email} onChange={setEmail} />
                  <SubmitButton loading={loading} label="Send reset link" />
                </form>
              )}
              <button
                type="button"
                onClick={() => { setTab("signin"); setSent(false); }}
                className="text-sm text-muted-foreground hover:text-primary transition-colors w-full text-center"
              >
                ← Back to sign in
              </button>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          By continuing you agree to our terms and privacy policy.
        </p>
      </div>
    </div>
  );
}

function FieldEmail({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-2">
      <Label htmlFor="email">Email</Label>
      <div className="relative">
        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          id="email"
          type="email"
          required
          autoComplete="email"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="you@domain.com"
          className="pl-9 h-11 bg-input/60 border-border/60 focus-visible:ring-primary"
        />
      </div>
    </div>
  );
}

function FieldPassword({ value, onChange, show, toggle }: { value: string; onChange: (v: string) => void; show: boolean; toggle: () => void }) {
  return (
    <div className="space-y-2">
      <Label htmlFor="password">Password</Label>
      <div className="relative">
        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          id="password"
          type={show ? "text" : "password"}
          required
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="••••••••"
          className="pl-9 pr-10 h-11 bg-input/60 border-border/60 focus-visible:ring-primary"
        />
        <button
          type="button"
          onClick={toggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          aria-label={show ? "Hide password" : "Show password"}
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}

function SubmitButton({ loading, label }: { loading: boolean; label: string }) {
  return (
    <Button
      type="submit"
      disabled={loading}
      className="w-full h-11 bg-gradient-to-r from-[oklch(0.88_0.12_90)] to-[oklch(0.78_0.16_70)] text-[oklch(0.18_0.02_270)] font-semibold hover:opacity-95 shadow-glow group"
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <>
          {label}
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </>
      )}
    </Button>
  );
}
