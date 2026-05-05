import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

const API = "/api";

const loginSchema = z.object({
  email: z.string().email({ message: "Email invalide." }),
  password: z.string().min(1, { message: "Mot de passe requis." }),
});

const itemSchema = z.object({
  title: z.string().min(1, { message: "Titre requis." }),
  description: z.string().default(""),
  status: z.enum(["planned", "in-progress", "done"]),
  quarter: z.string().default(""),
  sortOrder: z.coerce.number().default(0),
});

type LoginValues = z.infer<typeof loginSchema>;
type ItemValues = z.infer<typeof itemSchema>;

interface RoadmapItem {
  id: number;
  title: string;
  description: string;
  status: string;
  quarter: string;
  sortOrder: number;
}

const STATUS_LABELS: Record<string, string> = {
  planned: "Planifie",
  "in-progress": "En cours",
  done: "Termine",
};

const STATUS_COLORS: Record<string, string> = {
  planned: "#2563eb",
  "in-progress": "#f97316",
  done: "#16a34a",
};

export default function Admin() {
  const { toast } = useToast();
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("admin_token"));
  const [items, setItems] = useState<RoadmapItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<RoadmapItem | null>(null);
  const [showForm, setShowForm] = useState(false);

  const loginForm = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const itemForm = useForm<ItemValues>({
    resolver: zodResolver(itemSchema),
    defaultValues: { title: "", description: "", status: "planned", quarter: "", sortOrder: 0 },
  });

  async function onLogin(data: LoginValues) {
    setLoading(true);
    try {
      const res = await fetch(`${API}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Identifiants invalides");
      const { token: t } = await res.json() as { token: string };
      localStorage.setItem("admin_token", t);
      setToken(t);
    } catch (e) {
      toast({ title: "Erreur", description: (e as Error).message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    localStorage.removeItem("admin_token");
    setToken(null);
  }

  async function fetchItems() {
    const res = await fetch(`${API}/roadmap`);
    const data = await res.json() as RoadmapItem[];
    setItems(data);
  }

  useEffect(() => {
    if (token) fetchItems();
  }, [token]);

  async function onSubmitItem(data: ItemValues) {
    setLoading(true);
    try {
      const url = editing ? `${API}/roadmap/${editing.id}` : `${API}/roadmap`;
      const method = editing ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Echec de l'operation");
      toast({ title: editing ? "Element mis a jour" : "Element ajoute" });
      setEditing(null);
      setShowForm(false);
      itemForm.reset({ title: "", description: "", status: "planned", quarter: "", sortOrder: 0 });
      await fetchItems();
    } catch (e) {
      toast({ title: "Erreur", description: (e as Error).message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  async function deleteItem(id: number) {
    if (!confirm("Supprimer cet element ?")) return;
    await fetch(`${API}/roadmap/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    await fetchItems();
  }

  function startEdit(item: RoadmapItem) {
    setEditing(item);
    setShowForm(true);
    itemForm.reset({
      title: item.title,
      description: item.description,
      status: item.status as "planned" | "in-progress" | "done",
      quarter: item.quarter,
      sortOrder: item.sortOrder,
    });
  }

  function cancelForm() {
    setEditing(null);
    setShowForm(false);
    itemForm.reset({ title: "", description: "", status: "planned", quarter: "", sortOrder: 0 });
  }

  if (!token) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 selection:bg-primary/30">
        <div className="absolute top-8 left-8">
          <Link href="/" className="opacity-70 hover:opacity-100 transition-opacity">
            <img src="/logo-bw.png" alt="Ryzer" className="h-8 object-contain rounded-xl" />
          </Link>
        </div>
        <div className="w-full max-w-md space-y-8 bg-card/50 p-8 sm:p-12 rounded-2xl border border-white/5 backdrop-blur-xl shadow-2xl">
          <div className="space-y-2 text-center">
            <h1 className="text-2xl font-bold tracking-tight text-white">Connexion au portail</h1>
            <p className="text-sm text-muted-foreground">Acces reserve a l'equipe d'administration Ryzer</p>
          </div>
          <Form {...loginForm}>
            <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-6">
              <FormField control={loginForm.control} name="email" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white/80">Email</FormLabel>
                  <FormControl>
                    <Input data-testid="input-email" placeholder="admin@ryzer.app" type="email" className="bg-background/50 border-white/10 focus-visible:ring-primary text-white" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={loginForm.control} name="password" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white/80">Mot de passe</FormLabel>
                  <FormControl>
                    <Input data-testid="input-password" placeholder="••••••••" type="password" autoComplete="current-password" className="bg-background/50 border-white/10 focus-visible:ring-primary text-white" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <Button data-testid="button-submit" type="submit" disabled={loading} className="w-full bg-primary hover:bg-primary/90 text-white font-semibold tracking-wide py-6 rounded-xl transition-all shadow-[0_0_20px_rgba(37,99,235,0.2)] hover:shadow-[0_0_30px_rgba(37,99,235,0.4)]">
                {loading ? "Connexion..." : "Se connecter"}
              </Button>
            </form>
          </Form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Admin Nav */}
      <header className="border-b border-white/5 bg-card/40 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/">
              <img src="/logo-color.png" alt="Ryzer" className="h-8 object-contain rounded-xl" />
            </Link>
            <span className="text-white/40 text-sm hidden sm:block">/ Administration</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/" className="text-sm text-white/60 hover:text-white transition-colors">Voir le site</Link>
            <Button variant="outline" size="sm" onClick={logout} className="border-white/10 text-white/70 hover:text-white">
              Deconnexion
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Roadmap</h1>
            <p className="text-white/50 text-sm mt-1">{items.length} element{items.length !== 1 ? "s" : ""}</p>
          </div>
          {!showForm && (
            <Button data-testid="button-add-item" onClick={() => setShowForm(true)} className="bg-primary hover:bg-primary/90 text-white rounded-xl">
              + Ajouter
            </Button>
          )}
        </div>

        {/* Form */}
        {showForm && (
          <div className="bg-card/50 border border-white/5 rounded-2xl p-6 mb-8">
            <h2 className="text-lg font-semibold text-white mb-6">{editing ? "Modifier l'element" : "Nouvel element"}</h2>
            <Form {...itemForm}>
              <form onSubmit={itemForm.handleSubmit(onSubmitItem)} className="space-y-5">
                <div className="grid sm:grid-cols-2 gap-5">
                  <FormField control={itemForm.control} name="title" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white/80">Titre</FormLabel>
                      <FormControl>
                        <Input data-testid="input-title" placeholder="Nom de la fonctionnalite" className="bg-background/50 border-white/10 text-white focus-visible:ring-primary" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={itemForm.control} name="quarter" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white/80">Periode</FormLabel>
                      <FormControl>
                        <Input data-testid="input-quarter" placeholder="ex: Q1 2026" className="bg-background/50 border-white/10 text-white focus-visible:ring-primary" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
                <FormField control={itemForm.control} name="description" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white/80">Description</FormLabel>
                    <FormControl>
                      <Textarea data-testid="input-description" placeholder="Description de la fonctionnalite..." className="bg-background/50 border-white/10 text-white focus-visible:ring-primary resize-none" rows={3} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <div className="grid sm:grid-cols-2 gap-5">
                  <FormField control={itemForm.control} name="status" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white/80">Statut</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-status" className="bg-background/50 border-white/10 text-white focus:ring-primary">
                            <SelectValue placeholder="Choisir un statut" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-card border-white/10">
                          <SelectItem value="planned">Planifie</SelectItem>
                          <SelectItem value="in-progress">En cours</SelectItem>
                          <SelectItem value="done">Termine</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={itemForm.control} name="sortOrder" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white/80">Ordre</FormLabel>
                      <FormControl>
                        <Input data-testid="input-sort-order" type="number" placeholder="0" className="bg-background/50 border-white/10 text-white focus-visible:ring-primary" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
                <div className="flex gap-3 pt-2">
                  <Button data-testid="button-save-item" type="submit" disabled={loading} className="bg-primary hover:bg-primary/90 text-white rounded-xl">
                    {loading ? "Enregistrement..." : editing ? "Mettre a jour" : "Ajouter"}
                  </Button>
                  <Button type="button" variant="outline" onClick={cancelForm} className="border-white/10 text-white/70 hover:text-white rounded-xl">
                    Annuler
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        )}

        {/* Items list */}
        {items.length === 0 ? (
          <div className="text-center py-20 text-white/30">
            <p className="text-lg">Aucun element dans la roadmap.</p>
            <p className="text-sm mt-1">Cliquez sur "+ Ajouter" pour commencer.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {items.map((item) => (
              <div key={item.id} data-testid={`card-roadmap-${item.id}`} className="bg-card/40 border border-white/5 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center gap-4 hover:border-white/10 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-white font-semibold truncate">{item.title}</span>
                    <span
                      className="text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                      style={{ background: `${STATUS_COLORS[item.status]}20`, color: STATUS_COLORS[item.status] }}
                    >
                      {STATUS_LABELS[item.status] ?? item.status}
                    </span>
                  </div>
                  {item.description && <p className="text-white/50 text-sm truncate">{item.description}</p>}
                  {item.quarter && <p className="text-white/30 text-xs mt-1">{item.quarter}</p>}
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <Button data-testid={`button-edit-${item.id}`} size="sm" variant="outline" onClick={() => startEdit(item)} className="border-white/10 text-white/70 hover:text-white rounded-lg text-xs">
                    Modifier
                  </Button>
                  <Button data-testid={`button-delete-${item.id}`} size="sm" variant="outline" onClick={() => deleteItem(item.id)} className="border-red-500/20 text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-lg text-xs">
                    Supprimer
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
