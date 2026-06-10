import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  LogOut,
  Loader2,
  Plus,
  Trash2,
  Calendar as CalendarIcon,
  CheckCircle2,
  Clock,
  ListTodo,
  Flame,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Task = {
  id: string;
  title: string;
  category: string;
  priority: "Low" | "Medium" | "High";
  task_type: string;
  due_date: string | null;
  completed: boolean;
  created_at: string;
};

const CATEGORIES = ["General", "Work", "Personal", "Study", "Health", "Errands"];
const PRIORITIES = ["Low", "Medium", "High"] as const;
const TYPES = ["Personal", "Team", "Project", "Recurring"];

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
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filter, setFilter] = useState<"all" | "pending" | "completed">("all");
  const [search, setSearch] = useState("");

  // form
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("General");
  const [priority, setPriority] = useState<"Low" | "Medium" | "High">("Medium");
  const [taskType, setTaskType] = useState("Personal");
  const [dueDate, setDueDate] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
      if (!session) navigate({ to: "/auth" });
    });
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setLoading(false);
      if (!data.session) navigate({ to: "/auth" });
      else loadTasks();
    });
    return () => sub.subscription.unsubscribe();
  }, [navigate]);

  async function loadTasks() {
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) return toast.error(error.message);
    setTasks((data ?? []) as Task[]);
  }

  async function addTask(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return toast.error("Give your task a title");
    if (!user) return;
    setSubmitting(true);
    const { data, error } = await supabase
      .from("tasks")
      .insert({
        user_id: user.id,
        title: title.trim(),
        category,
        priority,
        task_type: taskType,
        due_date: dueDate || null,
      })
      .select()
      .single();
    setSubmitting(false);
    if (error) return toast.error(error.message);
    setTasks((t) => [data as Task, ...t]);
    setTitle("");
    setDueDate("");
    toast.success("Task added");
  }

  async function toggleTask(task: Task) {
    const next = !task.completed;
    setTasks((ts) => ts.map((t) => (t.id === task.id ? { ...t, completed: next } : t)));
    const { error } = await supabase
      .from("tasks")
      .update({ completed: next })
      .eq("id", task.id);
    if (error) {
      toast.error(error.message);
      setTasks((ts) => ts.map((t) => (t.id === task.id ? { ...t, completed: !next } : t)));
    }
  }

  async function deleteTask(id: string) {
    const prev = tasks;
    setTasks((ts) => ts.filter((t) => t.id !== id));
    const { error } = await supabase.from("tasks").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      setTasks(prev);
    } else toast.success("Task removed");
  }

  async function signOut() {
    await supabase.auth.signOut();
    toast.success("Signed out");
  }

  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter((t) => t.completed).length;
    const pending = total - completed;
    const today = new Date().toISOString().slice(0, 10);
    const dueToday = tasks.filter((t) => !t.completed && t.due_date === today).length;
    const progress = total ? Math.round((completed / total) * 100) : 0;
    return { total, completed, pending, dueToday, progress };
  }, [tasks]);

  const visible = useMemo(() => {
    return tasks
      .filter((t) =>
        filter === "all" ? true : filter === "completed" ? t.completed : !t.completed,
      )
      .filter((t) => t.title.toLowerCase().includes(search.toLowerCase()));
  }, [tasks, filter, search]);

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
      {/* Header */}
      <header className="border-b border-border/40 backdrop-blur-xl bg-background/40 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-[oklch(0.88_0.12_90)] to-[oklch(0.72_0.18_60)] flex items-center justify-center shadow-glow">
              <Sparkles className="h-4 w-4 text-[oklch(0.18_0.02_270)]" />
            </div>
            <span className="font-semibold tracking-tight text-gradient-gold text-lg">Taskflow</span>
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

      <main className="max-w-6xl mx-auto px-6 py-10 space-y-8">
        {/* Hero / greeting */}
        <section>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">
            Hey <span className="text-gradient-gold">{user.email?.split("@")[0]}</span> 👋
          </h1>
          <p className="text-muted-foreground mt-2">
            You have <span className="text-foreground font-medium">{stats.pending}</span> pending
            {stats.dueToday > 0 && (
              <>
                {" "}— <span className="text-[oklch(0.78_0.16_70)] font-medium">{stats.dueToday} due today</span>
              </>
            )}
            .
          </p>
        </section>

        {/* Stats */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={<ListTodo className="h-4 w-4" />} label="Total" value={stats.total} />
          <StatCard icon={<Clock className="h-4 w-4" />} label="Pending" value={stats.pending} accent="violet" />
          <StatCard icon={<CheckCircle2 className="h-4 w-4" />} label="Completed" value={stats.completed} accent="gold" />
          <StatCard icon={<Flame className="h-4 w-4" />} label="Due today" value={stats.dueToday} accent="rose" />
        </section>

        {/* Progress */}
        <section className="bg-card-glass border border-border/60 rounded-2xl p-6 shadow-elegant">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm text-muted-foreground">Overall progress</p>
              <p className="text-2xl font-semibold mt-1">
                <span className="text-gradient-gold">{stats.progress}%</span>{" "}
                <span className="text-sm text-muted-foreground font-normal">complete</span>
              </p>
            </div>
            <Badge variant="secondary" className="font-mono">
              {stats.completed}/{stats.total}
            </Badge>
          </div>
          <Progress value={stats.progress} className="h-2" />
        </section>

        {/* Add task */}
        <section className="bg-card-glass border border-border/60 rounded-2xl p-6 shadow-elegant">
          <div className="flex items-center gap-2 mb-4">
            <Plus className="h-4 w-4 text-[oklch(0.82_0.14_85)]" />
            <h2 className="font-semibold">Add a new task</h2>
          </div>
          <form onSubmit={addTask} className="grid grid-cols-1 md:grid-cols-12 gap-3">
            <div className="md:col-span-12">
              <Label htmlFor="title" className="text-xs text-muted-foreground">Title</Label>
              <Input
                id="title"
                placeholder="What needs to get done?"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="h-11 mt-1 bg-input/60 border-border/60"
              />
            </div>

            <div className="md:col-span-3">
              <Label className="text-xs text-muted-foreground">Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="mt-1 h-11 bg-input/60 border-border/60"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-3">
              <Label className="text-xs text-muted-foreground">Priority</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as typeof priority)}>
                <SelectTrigger className="mt-1 h-11 bg-input/60 border-border/60"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-3">
              <Label className="text-xs text-muted-foreground">Type</Label>
              <Select value={taskType} onValueChange={setTaskType}>
                <SelectTrigger className="mt-1 h-11 bg-input/60 border-border/60"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-3">
              <Label className="text-xs text-muted-foreground">Due date</Label>
              <div className="relative mt-1">
                <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="h-11 pl-9 bg-input/60 border-border/60"
                />
              </div>
            </div>

            <div className="md:col-span-12 flex justify-end">
              <Button
                type="submit"
                disabled={submitting}
                className="h-11 px-6 bg-gradient-to-r from-[oklch(0.88_0.12_90)] to-[oklch(0.78_0.16_70)] text-[oklch(0.18_0.02_270)] font-semibold shadow-glow hover:opacity-90"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Plus className="h-4 w-4" /> Add task</>}
              </Button>
            </div>
          </form>
        </section>

        {/* List */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="text-xl font-semibold tracking-tight">Your tasks</h2>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-9 pl-9 w-44 bg-input/60 border-border/60"
                />
              </div>
              <div className="inline-flex rounded-lg border border-border/60 bg-card-glass p-1">
                {(["all", "pending", "completed"] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={cn(
                      "px-3 h-7 text-xs rounded-md capitalize transition-colors",
                      filter === f
                        ? "bg-gradient-to-r from-[oklch(0.88_0.12_90)] to-[oklch(0.78_0.16_70)] text-[oklch(0.18_0.02_270)] font-semibold"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {visible.length === 0 ? (
            <div className="bg-card-glass border border-border/60 rounded-2xl p-12 text-center">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[oklch(0.88_0.12_90)] to-[oklch(0.72_0.18_60)] shadow-glow mb-3">
                <Sparkles className="h-5 w-5 text-[oklch(0.18_0.02_270)]" />
              </div>
              <p className="font-medium">All clear here</p>
              <p className="text-sm text-muted-foreground mt-1">
                {tasks.length === 0 ? "Add your first task to get started." : "No tasks match this view."}
              </p>
            </div>
          ) : (
            <ul className="space-y-3">
              {visible.map((t) => <TaskRow key={t.id} task={t} onToggle={toggleTask} onDelete={deleteTask} />)}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}

function StatCard({
  icon, label, value, accent,
}: { icon: React.ReactNode; label: string; value: number; accent?: "gold" | "violet" | "rose" }) {
  const ring =
    accent === "violet" ? "from-[oklch(0.55_0.2_295)] to-[oklch(0.65_0.22_295)]" :
    accent === "rose" ? "from-[oklch(0.6_0.2_15)] to-[oklch(0.7_0.2_15)]" :
    accent === "gold" ? "from-[oklch(0.88_0.12_90)] to-[oklch(0.72_0.18_60)]" :
    "from-[oklch(0.4_0.04_270)] to-[oklch(0.5_0.05_270)]";
  return (
    <div className="bg-card-glass border border-border/60 rounded-2xl p-5 shadow-elegant">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{label}</span>
        <div className={cn("h-8 w-8 rounded-lg bg-gradient-to-br flex items-center justify-center text-[oklch(0.18_0.02_270)]", ring)}>
          {icon}
        </div>
      </div>
      <p className="text-3xl font-semibold mt-3 tracking-tight">{value}</p>
    </div>
  );
}

function TaskRow({
  task, onToggle, onDelete,
}: { task: Task; onToggle: (t: Task) => void; onDelete: (id: string) => void }) {
  const overdue =
    !task.completed && task.due_date && new Date(task.due_date) < new Date(new Date().toDateString());

  const priorityStyles: Record<Task["priority"], string> = {
    High: "bg-[oklch(0.6_0.2_15_/0.15)] text-[oklch(0.78_0.18_20)] border-[oklch(0.6_0.2_15_/0.3)]",
    Medium: "bg-[oklch(0.65_0.22_295_/0.15)] text-[oklch(0.78_0.18_295)] border-[oklch(0.65_0.22_295_/0.3)]",
    Low: "bg-[oklch(0.5_0.05_270_/0.3)] text-muted-foreground border-border/60",
  };

  return (
    <li
      className={cn(
        "group bg-card-glass border border-border/60 rounded-xl p-4 shadow-elegant flex items-start gap-4 transition-all hover:border-[oklch(0.82_0.14_85_/0.4)]",
        task.completed && "opacity-60",
      )}
    >
      <Checkbox
        checked={task.completed}
        onCheckedChange={() => onToggle(task)}
        className="mt-1 data-[state=checked]:bg-[oklch(0.82_0.14_85)] data-[state=checked]:border-[oklch(0.82_0.14_85)] data-[state=checked]:text-[oklch(0.18_0.02_270)]"
      />
      <div className="flex-1 min-w-0">
        <p className={cn("font-medium truncate", task.completed && "line-through text-muted-foreground")}>
          {task.title}
        </p>
        <div className="flex flex-wrap items-center gap-2 mt-2">
          <Badge variant="outline" className={cn("text-xs border", priorityStyles[task.priority])}>
            {task.priority}
          </Badge>
          <Badge variant="outline" className="text-xs">{task.category}</Badge>
          <Badge variant="outline" className="text-xs">{task.task_type}</Badge>
          {task.due_date && (
            <span className={cn(
              "inline-flex items-center gap-1 text-xs",
              overdue ? "text-[oklch(0.78_0.18_20)]" : "text-muted-foreground",
            )}>
              <CalendarIcon className="h-3 w-3" />
              {new Date(task.due_date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
              {overdue && " · overdue"}
            </span>
          )}
        </div>
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onDelete(task.id)}
        className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-[oklch(0.78_0.18_20)]"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </li>
  );
}
