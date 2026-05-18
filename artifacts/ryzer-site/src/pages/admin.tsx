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

interface WaitlistEntry {
  id: number;
  email: string;
  createdAt: string;
}

interface Feature {
  id: number;
  title: string;
  description: string;
  emoji: string;
  sortOrder: number;
}

interface Challenge {
  id: number;
  title: string;
  description: string;
  category: string;
  icon: string;
  metricType: string;
  targetValue: number;
  targetUnit: string;
  xpReward: number;
  accent: string;
  isCalisthenics: boolean;
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
  const [tab, setTab] = useState<"roadmap" | "features" | "waitlist" | "defis">("roadmap");
  const [items, setItems] = useState<RoadmapItem[]>([]);
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([]);
  const [waitlistLoading, setWaitlistLoading] = useState(false);
  const [features, setFeatures] = useState<Feature[]>([]);
  const [featuresLoading, setFeaturesLoading] = useState(false);
  const [editingFeature, setEditingFeature] = useState<Feature | null>(null);
  const [showFeatureForm, setShowFeatureForm] = useState(false);
  const [featureForm, setFeatureForm] = useState({ title: "", description: "", emoji: "✨", sortOrder: 0 });
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [challengesLoading, setChallengesLoading] = useState(false);
  const [editingChallenge, setEditingChallenge] = useState<Challenge | null>(null);
  const [showChallengeForm, setShowChallengeForm] = useState(false);
  const [challengeForm, setChallengeForm] = useState({
    title: "", description: "", category: "POINTS", icon: "trophy",
    metricType: "points", targetValue: 100, targetUnit: "pts",
    xpReward: 50, accent: "blue", isCalisthenics: false, sortOrder: 0,
  });
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

  async function fetchWaitlist() {
    setWaitlistLoading(true);
    try {
      const res = await fetch(`${API}/waitlist`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json() as WaitlistEntry[];
      setWaitlist(data);
    } catch {
      toast({ title: "Erreur", description: "Impossible de charger la waitlist", variant: "destructive" });
    } finally {
      setWaitlistLoading(false);
    }
  }

  useEffect(() => {
    if (token) fetchItems();
  }, [token]);

  useEffect(() => {
    if (token && tab === "waitlist") fetchWaitlist();
    if (token && tab === "features") fetchFeatures();
    if (token && tab === "defis") fetchChallenges();
  }, [token, tab]);

  async function fetchChallenges() {
    setChallengesLoading(true);
    try {
      const res = await fetch(`${API}/challenges`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json() as Challenge[];
      setChallenges(data);
    } catch {
      toast({ title: "Erreur", description: "Impossible de charger les défis", variant: "destructive" });
    } finally {
      setChallengesLoading(false);
    }
  }

  async function saveChallenge() {
    setLoading(true);
    try {
      const url = editingChallenge ? `${API}/challenges/${editingChallenge.id}` : `${API}/challenges`;
      const method = editingChallenge ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(challengeForm),
      });
      if (!res.ok) throw new Error("Echec");
      toast({ title: editingChallenge ? "Défi mis à jour" : "Défi ajouté" });
      setShowChallengeForm(false);
      setEditingChallenge(null);
      setChallengeForm({ title: "", description: "", category: "POINTS", icon: "trophy", metricType: "points", targetValue: 100, targetUnit: "pts", xpReward: 50, accent: "blue", isCalisthenics: false, sortOrder: 0 });
      await fetchChallenges();
    } catch {
      toast({ title: "Erreur", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  async function deleteChallenge(id: number) {
    if (!confirm("Supprimer ce défi ?")) return;
    await fetch(`${API}/challenges/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
    await fetchChallenges();
  }

  function startEditChallenge(c: Challenge) {
    setEditingChallenge(c);
    setChallengeForm({
      title: c.title, description: c.description, category: c.category, icon: c.icon,
      metricType: c.metricType, targetValue: c.targetValue, targetUnit: c.targetUnit,
      xpReward: c.xpReward, accent: c.accent, isCalisthenics: c.isCalisthenics, sortOrder: c.sortOrder,
    });
    setShowChallengeForm(true);
  }

  async function fetchFeatures() {
    setFeaturesLoading(true);
    try {
      const res = await fetch(`${API}/features`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json() as Feature[];
      setFeatures(data);
    } catch {
      toast({ title: "Erreur", description: "Impossible de charger les fonctionnalités", variant: "destructive" });
    } finally {
      setFeaturesLoading(false);
    }
  }

  async function saveFeature() {
    setLoading(true);
    try {
      const url = editingFeature ? `${API}/features/${editingFeature.id}` : `${API}/features`;
      const method = editingFeature ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(featureForm),
      });
      if (!res.ok) throw new Error("Echec");
      toast({ title: editingFeature ? "Fonctionnalité mise à jour" : "Fonctionnalité ajoutée" });
      setShowFeatureForm(false);
      setEditingFeature(null);
      setFeatureForm({ title: "", description: "", emoji: "✨", sortOrder: 0 });
      await fetchFeatures();
    } catch {
      toast({ title: "Erreur", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  async function deleteFeature(id: number) {
    if (!confirm("Supprimer cette fonctionnalité ?")) return;
    await fetch(`${API}/features/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
    await fetchFeatures();
  }

  function startEditFeature(f: Feature) {
    setEditingFeature(f);
    setFeatureForm({ title: f.title, description: f.description, emoji: f.emoji, sortOrder: f.sortOrder });
    setShowFeatureForm(true);
  }

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
        {/* Tabs */}
        <div className="flex gap-1 mb-8 bg-white/5 rounded-xl p-1 w-fit flex-wrap">
          <button
            onClick={() => { setTab("roadmap"); setShowForm(false); setEditing(null); }}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${tab === "roadmap" ? "bg-primary text-white shadow" : "text-white/50 hover:text-white"}`}
          >Roadmap ({items.length})</button>
          <button
            onClick={() => { setTab("features"); setShowFeatureForm(false); setEditingFeature(null); }}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${tab === "features" ? "bg-primary text-white shadow" : "text-white/50 hover:text-white"}`}
          >Fonctionnalités ({features.length})</button>
          <button
            onClick={() => setTab("waitlist")}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${tab === "waitlist" ? "bg-primary text-white shadow" : "text-white/50 hover:text-white"}`}
          >Waitlist ({waitlist.length})</button>
          <button
            onClick={() => { setTab("defis"); setShowChallengeForm(false); setEditingChallenge(null); }}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${tab === "defis" ? "bg-primary text-white shadow" : "text-white/50 hover:text-white"}`}
          >Défis ({challenges.length})</button>
        </div>

        {tab === "roadmap" && (<>
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
        </>)}

        {tab === "features" && (
          <div>
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-2xl font-bold text-white">Fonctionnalités</h1>
                <p className="text-white/50 text-sm mt-1">{features.length} fonctionnalité{features.length !== 1 ? "s" : ""}</p>
              </div>
              {!showFeatureForm && (
                <Button onClick={() => { setEditingFeature(null); setFeatureForm({ title: "", description: "", emoji: "✨", sortOrder: features.length }); setShowFeatureForm(true); }} className="bg-primary hover:bg-primary/90 text-white rounded-xl">
                  + Ajouter
                </Button>
              )}
            </div>

            {showFeatureForm && (
              <div className="bg-card/50 border border-white/5 rounded-2xl p-6 mb-8">
                <h2 className="text-lg font-semibold text-white mb-6">{editingFeature ? "Modifier" : "Nouvelle fonctionnalité"}</h2>
                <div className="space-y-5">
                  <div className="grid sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm text-white/80 mb-1.5 font-medium">Titre</label>
                      <Input
                        value={featureForm.title}
                        onChange={e => setFeatureForm(f => ({ ...f, title: e.target.value }))}
                        placeholder="Ex: Analyse de performance"
                        className="bg-background/50 border-white/10 text-white focus-visible:ring-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-white/80 mb-1.5 font-medium">Emoji</label>
                      <Input
                        value={featureForm.emoji}
                        onChange={e => setFeatureForm(f => ({ ...f, emoji: e.target.value }))}
                        placeholder="✨"
                        className="bg-background/50 border-white/10 text-white focus-visible:ring-primary"
                        maxLength={4}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-white/80 mb-1.5 font-medium">Description</label>
                    <Textarea
                      value={featureForm.description}
                      onChange={e => setFeatureForm(f => ({ ...f, description: e.target.value }))}
                      placeholder="Décrivez la fonctionnalité..."
                      className="bg-background/50 border-white/10 text-white focus-visible:ring-primary resize-none"
                      rows={3}
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-white/80 mb-1.5 font-medium">Ordre d'affichage</label>
                    <Input
                      type="number"
                      value={featureForm.sortOrder}
                      onChange={e => setFeatureForm(f => ({ ...f, sortOrder: Number(e.target.value) }))}
                      className="bg-background/50 border-white/10 text-white focus-visible:ring-primary w-32"
                    />
                  </div>
                  <div className="flex gap-3 pt-2">
                    <Button onClick={saveFeature} disabled={loading || !featureForm.title} className="bg-primary hover:bg-primary/90 text-white rounded-xl">
                      {loading ? "Enregistrement..." : editingFeature ? "Mettre à jour" : "Ajouter"}
                    </Button>
                    <Button variant="outline" onClick={() => { setShowFeatureForm(false); setEditingFeature(null); }} className="border-white/10 text-white/70 hover:text-white rounded-xl">
                      Annuler
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {featuresLoading ? (
              <div className="text-center py-20 text-white/30">Chargement...</div>
            ) : features.length === 0 ? (
              <div className="text-center py-20 text-white/30">
                <p className="text-lg">Aucune fonctionnalité pour le moment.</p>
                <p className="text-sm mt-1">Cliquez sur "Ajouter" pour créer la première.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {features.map(f => (
                  <div key={f.id} className="flex items-center gap-4 bg-card/40 border border-white/5 rounded-xl px-5 py-4 hover:bg-white/5 transition-colors">
                    <span className="text-2xl flex-shrink-0">{f.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <span className="text-white font-semibold">{f.title}</span>
                      {f.description && <p className="text-white/50 text-sm truncate mt-0.5">{f.description}</p>}
                    </div>
                    <span className="text-white/20 text-xs flex-shrink-0">#{f.sortOrder}</span>
                    <div className="flex gap-2 flex-shrink-0">
                      <Button size="sm" variant="outline" onClick={() => startEditFeature(f)} className="border-white/10 text-white/70 hover:text-white rounded-lg text-xs">
                        Modifier
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => deleteFeature(f.id)} className="border-red-500/20 text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-lg text-xs">
                        Supprimer
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === "defis" && (
          <div>
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-2xl font-bold text-white">Défis</h1>
                <p className="text-white/50 text-sm mt-1">{challenges.length} défi{challenges.length !== 1 ? "s" : ""}</p>
              </div>
              {!showChallengeForm && (
                <Button onClick={() => { setEditingChallenge(null); setChallengeForm({ title: "", description: "", category: "POINTS", icon: "trophy", metricType: "points", targetValue: 100, targetUnit: "pts", xpReward: 50, accent: "blue", isCalisthenics: false, sortOrder: challenges.length }); setShowChallengeForm(true); }} className="bg-primary hover:bg-primary/90 text-white rounded-xl">
                  + Ajouter
                </Button>
              )}
            </div>

            {showChallengeForm && (
              <div className="bg-card/50 border border-white/5 rounded-2xl p-6 mb-8">
                <h2 className="text-lg font-semibold text-white mb-6">{editingChallenge ? "Modifier le défi" : "Nouveau défi"}</h2>
                <div className="space-y-5">
                  <div className="grid sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm text-white/80 mb-1.5 font-medium">Titre</label>
                      <Input value={challengeForm.title} onChange={e => setChallengeForm(f => ({ ...f, title: e.target.value }))} placeholder="Ex: Premier kilomètre" className="bg-background/50 border-white/10 text-white focus-visible:ring-primary" />
                    </div>
                    <div>
                      <label className="block text-sm text-white/80 mb-1.5 font-medium">Icône (MaterialCommunityIcons)</label>
                      <Input value={challengeForm.icon} onChange={e => setChallengeForm(f => ({ ...f, icon: e.target.value }))} placeholder="Ex: run, trophy, fire…" className="bg-background/50 border-white/10 text-white focus-visible:ring-primary" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-white/80 mb-1.5 font-medium">Description</label>
                    <Input value={challengeForm.description} onChange={e => setChallengeForm(f => ({ ...f, description: e.target.value }))} placeholder="Description du défi" className="bg-background/50 border-white/10 text-white focus-visible:ring-primary" />
                  </div>
                  <div className="grid sm:grid-cols-3 gap-5">
                    <div>
                      <label className="block text-sm text-white/80 mb-1.5 font-medium">Catégorie</label>
                      <select value={challengeForm.category} onChange={e => setChallengeForm(f => ({ ...f, category: e.target.value }))} className="w-full rounded-lg bg-background/50 border border-white/10 text-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary">
                        <option value="DISTANCE">DISTANCE</option>
                        <option value="RÉGULARITÉ">RÉGULARITÉ</option>
                        <option value="MULTI-SPORTS">MULTI-SPORTS</option>
                        <option value="POINTS">POINTS</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-white/80 mb-1.5 font-medium">Métrique</label>
                      <select value={challengeForm.metricType} onChange={e => setChallengeForm(f => ({ ...f, metricType: e.target.value }))} className="w-full rounded-lg bg-background/50 border border-white/10 text-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary">
                        <option value="distance">distance (km)</option>
                        <option value="streak">streak (jours consécutifs)</option>
                        <option value="sessions">sessions (total)</option>
                        <option value="sports">sports (sports différents)</option>
                        <option value="points">points (Ryzer Points)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-white/80 mb-1.5 font-medium">Couleur</label>
                      <select value={challengeForm.accent} onChange={e => setChallengeForm(f => ({ ...f, accent: e.target.value }))} className="w-full rounded-lg bg-background/50 border border-white/10 text-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary">
                        <option value="blue">Bleu</option>
                        <option value="orange">Orange</option>
                        <option value="green">Vert</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-4 gap-5">
                    <div>
                      <label className="block text-sm text-white/80 mb-1.5 font-medium">Objectif</label>
                      <Input type="number" value={challengeForm.targetValue} onChange={e => setChallengeForm(f => ({ ...f, targetValue: Number(e.target.value) }))} className="bg-background/50 border-white/10 text-white focus-visible:ring-primary" />
                    </div>
                    <div>
                      <label className="block text-sm text-white/80 mb-1.5 font-medium">Unité</label>
                      <Input value={challengeForm.targetUnit} onChange={e => setChallengeForm(f => ({ ...f, targetUnit: e.target.value }))} placeholder="km, jours, pts…" className="bg-background/50 border-white/10 text-white focus-visible:ring-primary" />
                    </div>
                    <div>
                      <label className="block text-sm text-white/80 mb-1.5 font-medium">XP</label>
                      <Input type="number" value={challengeForm.xpReward} onChange={e => setChallengeForm(f => ({ ...f, xpReward: Number(e.target.value) }))} className="bg-background/50 border-white/10 text-white focus-visible:ring-primary" />
                    </div>
                    <div>
                      <label className="block text-sm text-white/80 mb-1.5 font-medium">Ordre</label>
                      <Input type="number" value={challengeForm.sortOrder} onChange={e => setChallengeForm(f => ({ ...f, sortOrder: Number(e.target.value) }))} className="bg-background/50 border-white/10 text-white focus-visible:ring-primary" />
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <input type="checkbox" id="is-calisthenics" checked={challengeForm.isCalisthenics} onChange={e => setChallengeForm(f => ({ ...f, isCalisthenics: e.target.checked }))} className="w-4 h-4 accent-primary" />
                    <label htmlFor="is-calisthenics" className="text-sm text-white/80 font-medium cursor-pointer">Défi de callisthénie</label>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <Button onClick={saveChallenge} disabled={loading || !challengeForm.title} className="bg-primary hover:bg-primary/90 text-white rounded-xl">
                      {loading ? "Enregistrement..." : editingChallenge ? "Mettre à jour" : "Ajouter"}
                    </Button>
                    <Button variant="outline" onClick={() => { setShowChallengeForm(false); setEditingChallenge(null); }} className="border-white/10 text-white/70 hover:text-white rounded-xl">
                      Annuler
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {challengesLoading ? (
              <div className="text-center py-20 text-white/30">Chargement...</div>
            ) : challenges.length === 0 ? (
              <div className="text-center py-20 text-white/30">
                <p className="text-lg">Aucun défi pour le moment.</p>
                <p className="text-sm mt-1">Cliquez sur "+ Ajouter" pour créer le premier.</p>
              </div>
            ) : (() => {
              const CATEGORY_ORDER = ["DISTANCE", "RÉGULARITÉ", "MULTI-SPORTS", "POINTS"];
              const grouped = challenges.reduce<Record<string, Challenge[]>>((acc, c) => {
                const cat = c.category || "AUTRE";
                if (!acc[cat]) acc[cat] = [];
                acc[cat].push(c);
                return acc;
              }, {});
              const sortedCategories = [
                ...CATEGORY_ORDER.filter(cat => grouped[cat]),
                ...Object.keys(grouped).filter(cat => !CATEGORY_ORDER.includes(cat)),
              ];
              return (
                <div className="space-y-8">
                  {sortedCategories.map(category => (
                    <div key={category}>
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-xs font-bold tracking-widest uppercase text-white/40">{category}</span>
                        <span className="text-xs text-white/20">{grouped[category].length} défi{grouped[category].length !== 1 ? "s" : ""}</span>
                        <div className="flex-1 h-px bg-white/5" />
                      </div>
                      <div className="space-y-2">
                        {grouped[category].map(c => {
                          const accentColor = c.accent === "orange" ? "#f97316" : c.accent === "green" ? "#22c55e" : "#2563eb";
                          return (
                            <div key={c.id} className="flex items-center gap-4 bg-card/40 border border-white/5 rounded-xl px-5 py-4 hover:bg-white/5 transition-colors">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-0.5">
                                  <span className="text-white font-semibold">{c.title}</span>
                                  {c.isCalisthenics && (
                                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400">callisthénie</span>
                                  )}
                                </div>
                                {c.description && <p className="text-white/50 text-sm truncate">{c.description}</p>}
                                <p className="text-white/30 text-xs mt-0.5">
                                  {c.metricType} · objectif {c.targetValue} {c.targetUnit} · {c.xpReward} XP
                                </p>
                              </div>
                              <div className="flex gap-2 flex-shrink-0">
                                <Button size="sm" variant="outline" onClick={() => startEditChallenge(c)} className="border-white/10 text-white/70 hover:text-white rounded-lg text-xs">
                                  Modifier
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => deleteChallenge(c.id)} className="border-red-500/20 text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-lg text-xs">
                                  Supprimer
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        )}

        {tab === "waitlist" && (
          <div>
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-2xl font-bold text-white">Waitlist</h1>
                <p className="text-white/50 text-sm mt-1">{waitlist.length} inscription{waitlist.length !== 1 ? "s" : ""}</p>
              </div>
              <Button variant="outline" size="sm" onClick={fetchWaitlist} disabled={waitlistLoading} className="border-white/10 text-white/70 hover:text-white rounded-xl text-xs">
                {waitlistLoading ? "Chargement..." : "↻ Actualiser"}
              </Button>
            </div>

            {waitlistLoading ? (
              <div className="text-center py-20 text-white/30">Chargement...</div>
            ) : waitlist.length === 0 ? (
              <div className="text-center py-20 text-white/30">
                <p className="text-lg">Aucune inscription pour le moment.</p>
                <p className="text-sm mt-1">Les emails apparaîtront ici dès qu'un visiteur s'inscrit.</p>
              </div>
            ) : (
              <div className="bg-card/40 border border-white/5 rounded-2xl overflow-hidden">
                <div className="grid grid-cols-[auto_1fr_auto] gap-0 text-xs font-semibold text-white/30 uppercase tracking-widest px-5 py-3 border-b border-white/5">
                  <span className="w-10">#</span>
                  <span>Email</span>
                  <span>Date d'inscription</span>
                </div>
                {waitlist.map((entry, i) => (
                  <div
                    key={entry.id}
                    className="grid grid-cols-[auto_1fr_auto] gap-0 items-center px-5 py-3.5 border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors"
                  >
                    <span className="w-10 text-white/20 text-sm font-mono">{i + 1}</span>
                    <span className="text-white text-sm font-medium truncate">{entry.email}</span>
                    <span className="text-white/40 text-xs ml-4 whitespace-nowrap">
                      {new Date(entry.createdAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
