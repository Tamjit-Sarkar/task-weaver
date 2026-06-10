import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Sparkles, LogOut, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Taskflow — Your beautiful task dashboard" },
      { name: "description", content: "Organize work and never miss a deadline with Taskflow." },
    ],
  }),
  component: Home,
});

function Home() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
      if (!session) navigate({ to: "/auth" });
    });
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setLoading(false);
      if (!data.session) navigate({ to: "/auth" });
    });
    return () => sub.subscription.unsubscribe();
  }, [navigate]);

  async function signOut() {
    await supabase.auth.signOut();
    toast.success("Signed out");
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!user) return null;

  return (
    <div className="min-h-screen">
      <header className="border-b border-border/40 backdrop-blur-xl bg-background/40 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-[oklch(0.88_0.12_90)] to-[oklch(0.72_0.18_60)] flex items-center justify-center shadow-glow">
              <Sparkles className="h-4 w-4 text-[oklch(0.18_0.02_270)]" />
            </div>
            <span className="font-semibold tracking-tight text-gradient-gold">Taskflow</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground hidden sm:block">{user.email}</span>
            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut className="h-4 w-4" />
              Sign out
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-16">
        <div className="bg-card-glass border border-border/60 rounded-2xl p-10 shadow-elegant">
          <h1 className="text-4xl font-semibold tracking-tight">
            Welcome back, <span className="text-gradient-gold">{user.email?.split("@")[0]}</span>
          </h1>
          <p className="text-muted-foreground mt-3 max-w-xl">
            You're signed in. Drop your task UI in here — the auth layer, gorgeous design system,
            and protected route are wired and ready.
          </p>
        </div>
      </main>
    </div>
  );
}
