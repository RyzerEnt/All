import React from "react";
import { AppLayout } from "@/components/layout";
import {
  useGetCalcSummary,
  useListSports,
  useListMultipliers,
  useCreateSport,
  useUpdateSport,
  useDeleteSport,
  useUpdateMultiplier,
  getGetCalcSummaryQueryKey,
  getListSportsQueryKey,
  getListMultipliersQueryKey,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Switch } from "@/components/ui/switch";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Activity, Dumbbell, Settings, Edit, Trash2, Plus, Mountain } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const sportSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  baseMet: z.coerce.number().min(0.1),
  icon: z.string().min(1),
  appliesElevation: z.boolean(),
});

type SportFormValues = z.infer<typeof sportSchema>;

function SportFormDialog({
  sport,
  open,
  setOpen,
}: {
  sport?: any;
  open: boolean;
  setOpen: (v: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const createSport = useCreateSport();
  const updateSport = useUpdateSport();

  const form = useForm<SportFormValues>({
    resolver: zodResolver(sportSchema),
    defaultValues: sport || {
      name: "",
      slug: "",
      baseMet: 5,
      icon: "🏃",
      appliesElevation: false,
    },
  });

  const onSubmit = (data: SportFormValues) => {
    if (sport) {
      updateSport.mutate(
        { id: sport.id, data },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getListSportsQueryKey() });
            queryClient.invalidateQueries({ queryKey: getGetCalcSummaryQueryKey() });
            toast({ title: "Sport mis à jour" });
            setOpen(false);
          },
        }
      );
    } else {
      createSport.mutate(
        { data },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getListSportsQueryKey() });
            queryClient.invalidateQueries({ queryKey: getGetCalcSummaryQueryKey() });
            toast({ title: "Sport créé" });
            setOpen(false);
            form.reset();
          },
        }
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="font-mono bg-card border-border w-[calc(100vw-2rem)] max-w-md rounded-xl">
        <DialogHeader>
          <DialogTitle className="uppercase tracking-wider">
            {sport ? "Modifier le sport" : "Nouveau sport"}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem>
                <FormLabel>Nom</FormLabel>
                <FormControl>
                  <Input className="bg-secondary/50 border-secondary h-12" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="slug" render={({ field }) => (
              <FormItem>
                <FormLabel>Slug</FormLabel>
                <FormControl>
                  <Input className="bg-secondary/50 border-secondary h-12" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="baseMet" render={({ field }) => (
                <FormItem>
                  <FormLabel>MET base</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.1" inputMode="decimal" className="bg-secondary/50 border-secondary h-12" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="icon" render={({ field }) => (
                <FormItem>
                  <FormLabel>Icône</FormLabel>
                  <FormControl>
                    <Input className="bg-secondary/50 border-secondary h-12 text-xl" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <FormField control={form.control} name="appliesElevation" render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border border-border p-4">
                <div>
                  <FormLabel className="text-sm">Dénivelé applicable</FormLabel>
                  <p className="text-xs text-muted-foreground mt-0.5">Course, vélo, randonnée…</p>
                </div>
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
              </FormItem>
            )} />
            <div className="flex justify-end pt-2">
              <Button
                type="submit"
                size="lg"
                className="uppercase tracking-widest text-xs w-full"
                disabled={createSport.isPending || updateSport.isPending}
              >
                Enregistrer
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function MultiplierCard({ multiplier }: { multiplier: any }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const updateMultiplier = useUpdateMultiplier();
  const [val, setVal] = React.useState(multiplier.value.toString());

  const handleSave = () => {
    const num = parseFloat(val);
    if (isNaN(num)) return;
    updateMultiplier.mutate(
      { id: multiplier.id, data: { value: num } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListMultipliersQueryKey() });
          toast({ title: "Multiplicateur mis à jour" });
        },
      }
    );
  };

  return (
    <div className="p-4 border-b border-border/50 last:border-0">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <div className="font-mono font-bold text-sm text-foreground">{multiplier.label}</div>
          <div className="text-xs text-muted-foreground mt-0.5">{multiplier.description}</div>
          <div className="text-xs text-muted-foreground/60 font-mono mt-1">{multiplier.paramKey}</div>
        </div>
        <div className="text-xs text-muted-foreground font-mono shrink-0 mt-1">
          [{multiplier.minValue} – {multiplier.maxValue}]
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Input
          type="number"
          step="0.001"
          inputMode="decimal"
          className="flex-1 font-mono h-11 text-right bg-secondary/50 border-secondary text-lg"
          value={val}
          onChange={(e) => setVal(e.target.value)}
        />
        <span className="text-xs text-muted-foreground font-mono w-14 shrink-0">{multiplier.unit}</span>
        <Button
          size="sm"
          variant="secondary"
          className="h-11 px-4 uppercase text-[10px] tracking-wider shrink-0"
          onClick={handleSave}
          disabled={updateMultiplier.isPending}
        >
          {updateMultiplier.isPending ? "…" : "Sauv."}
        </Button>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const { data: summary, isLoading: isLoadingSummary } = useGetCalcSummary({
    query: { queryKey: getGetCalcSummaryQueryKey() },
  });
  const { data: sports } = useListSports({ query: { queryKey: getListSportsQueryKey() } });
  const { data: multipliers } = useListMultipliers({ query: { queryKey: getListMultipliersQueryKey() } });

  const deleteSport = useDeleteSport();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [createOpen, setCreateOpen] = React.useState(false);
  const [editSport, setEditSport] = React.useState<any>(null);

  const handleDeleteSport = (id: number) => {
    if (confirm("Supprimer ce sport ?")) {
      deleteSport.mutate(
        { id },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getListSportsQueryKey() });
            queryClient.invalidateQueries({ queryKey: getGetCalcSummaryQueryKey() });
            toast({ title: "Sport supprimé" });
          },
        }
      );
    }
  };

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-6 max-w-6xl space-y-6">

        {/* STATS */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="border-border bg-card">
            <CardHeader className="pb-1 pt-3 px-3">
              <CardTitle className="text-[10px] font-mono uppercase text-muted-foreground tracking-wider flex items-center gap-1.5">
                <Dumbbell className="h-3 w-3" /> Sports
              </CardTitle>
            </CardHeader>
            <CardContent className="px-3 pb-3">
              <div className="text-3xl font-bold font-mono text-primary">
                {isLoadingSummary ? "-" : summary?.totalSports}
              </div>
            </CardContent>
          </Card>
          <Card className="border-border bg-card">
            <CardHeader className="pb-1 pt-3 px-3">
              <CardTitle className="text-[10px] font-mono uppercase text-muted-foreground tracking-wider flex items-center gap-1.5">
                <Settings className="h-3 w-3" /> Params
              </CardTitle>
            </CardHeader>
            <CardContent className="px-3 pb-3">
              <div className="text-3xl font-bold font-mono text-primary">
                {isLoadingSummary ? "-" : summary?.totalMultipliers}
              </div>
            </CardContent>
          </Card>
          <Card className="border-border bg-card">
            <CardHeader className="pb-1 pt-3 px-3">
              <CardTitle className="text-[10px] font-mono uppercase text-muted-foreground tracking-wider flex items-center gap-1.5">
                <Activity className="h-3 w-3" /> MET moy.
              </CardTitle>
            </CardHeader>
            <CardContent className="px-3 pb-3">
              <div className="text-3xl font-bold font-mono text-primary">
                {isLoadingSummary ? "-" : summary?.avgMet.toFixed(1)}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* SPORTS */}
          <Card className="border-border bg-card overflow-hidden">
            <CardHeader className="border-b border-border/50 bg-secondary/10 flex flex-row items-center justify-between py-3 px-4">
              <div>
                <CardTitle className="font-mono uppercase tracking-wider text-base">Sports</CardTitle>
                <CardDescription className="text-xs">Activités et valeurs MET</CardDescription>
              </div>
              <Button
                size="sm"
                onClick={() => setCreateOpen(true)}
                className="uppercase font-mono text-[10px] tracking-wider h-10 px-3"
              >
                <Plus className="h-3 w-3 mr-1" /> Ajouter
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border/50">
                {sports?.map((sport) => (
                  <div key={sport.id} className="flex items-center gap-3 px-4 py-3">
                    <span className="text-2xl shrink-0">{sport.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="font-mono font-medium text-sm truncate">{sport.name}</div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-muted-foreground font-mono">MET {sport.baseMet}</span>
                        {sport.appliesElevation && (
                          <Badge variant="outline" className="text-[9px] text-primary border-primary/50 py-0 px-1 h-4">
                            <Mountain className="h-2.5 w-2.5 mr-0.5" /> dénivelé
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10 text-muted-foreground hover:text-primary"
                        onClick={() => setEditSport(sport)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10 text-muted-foreground hover:text-destructive"
                        onClick={() => handleDeleteSport(sport.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                {sports?.length === 0 && (
                  <div className="text-center py-10 text-muted-foreground font-mono text-xs uppercase">
                    Aucun sport défini
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* MULTIPLIERS */}
          <Card className="border-border bg-card overflow-hidden">
            <CardHeader className="border-b border-border/50 bg-secondary/10 py-3 px-4">
              <CardTitle className="font-mono uppercase tracking-wider text-base">Multiplicateurs</CardTitle>
              <CardDescription className="text-xs">Paramètres de l'algorithme calorique</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {multipliers?.map((m) => (
                <MultiplierCard key={m.id} multiplier={m} />
              ))}
              {multipliers?.length === 0 && (
                <div className="text-center py-10 text-muted-foreground font-mono text-xs uppercase">
                  Aucun multiplicateur
                </div>
              )}
            </CardContent>
          </Card>

        </div>
      </div>

      {createOpen && <SportFormDialog open={createOpen} setOpen={setCreateOpen} />}
      {editSport && (
        <SportFormDialog
          open={!!editSport}
          setOpen={(v) => !v && setEditSport(null)}
          sport={editSport}
        />
      )}
    </AppLayout>
  );
}
