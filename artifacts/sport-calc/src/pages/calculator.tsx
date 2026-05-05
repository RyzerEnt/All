import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { AppLayout } from "@/components/layout";
import { DEFAULT_SPORTS, loadMultipliers, computeCalories } from "@/lib/calc-store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Flame, Activity, Timer, TrendingUp, Mountain, Dumbbell } from "lucide-react";
import type { CalcResult } from "@/lib/calc-store";

const calcSchema = z.object({
  sportId: z.coerce.number().min(1, "Sport requis"),
  durationMinutes: z.coerce.number().min(1, "Durée minimum 1 min"),
  heartRateBpm: z.coerce.number().min(40).max(220),
  vo2Max: z.coerce.number().min(20).max(90),
  elevationGainMeters: z.coerce.number().min(0).optional(),
  weightKg: z.coerce.number().min(30).max(250),
});

type CalcFormValues = z.infer<typeof calcSchema>;

export default function CalculatorPage() {
  const [result, setResult] = React.useState<CalcResult | null>(null);

  const form = useForm<CalcFormValues>({
    resolver: zodResolver(calcSchema),
    defaultValues: {
      durationMinutes: 60,
      heartRateBpm: 140,
      vo2Max: 45,
      elevationGainMeters: 0,
      weightKg: 70,
    },
  });

  const sportId = form.watch("sportId");
  const selectedSport = DEFAULT_SPORTS.find((s) => s.id === sportId);

  const onSubmit = (data: CalcFormValues) => {
    const sport = DEFAULT_SPORTS.find((s) => s.id === data.sportId);
    if (!sport) return;
    const multipliers = loadMultipliers();
    const res = computeCalories(
      {
        sport,
        durationMinutes: data.durationMinutes,
        heartRateBpm: data.heartRateBpm,
        vo2Max: data.vo2Max,
        weightKg: data.weightKg,
        elevationGainMeters: sport.appliesElevation ? data.elevationGainMeters : undefined,
      },
      multipliers
    );
    setResult(res);
  };

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-6 max-w-5xl">
        <div className="flex flex-col lg:flex-row gap-6">

          {/* FORM */}
          <div className="flex-1 min-w-0">
            <Card className="border-border">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl font-mono uppercase tracking-wider flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary shrink-0" />
                  Performance Input
                </CardTitle>
                <CardDescription>
                  Renseignez vos métriques pour calculer la dépense énergétique.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">

                    <FormField
                      control={form.control}
                      name="sportId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-muted-foreground uppercase text-xs font-bold tracking-wider">
                            Sport
                          </FormLabel>
                          <FormControl>
                            <select
                              className="w-full h-14 rounded-md border border-secondary bg-secondary/30 px-3 font-mono text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
                              value={field.value?.toString() || ""}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                            >
                              <option value="" disabled>-- Sélectionner un sport --</option>
                              {DEFAULT_SPORTS.map((sport) => (
                                <option key={sport.id} value={sport.id.toString()}>
                                  {sport.icon} {sport.name} — MET {sport.baseMet}
                                </option>
                              ))}
                            </select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="durationMinutes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-muted-foreground uppercase text-xs font-bold tracking-wider flex items-center gap-1">
                              <Timer className="h-3 w-3" /> Durée (min)
                            </FormLabel>
                            <FormControl>
                              <Input type="number" inputMode="numeric" className="font-mono h-14 bg-secondary/30 text-lg border-secondary" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="heartRateBpm"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-muted-foreground uppercase text-xs font-bold tracking-wider flex items-center gap-1">
                              <Activity className="h-3 w-3" /> FC (bpm)
                            </FormLabel>
                            <FormControl>
                              <Input type="number" inputMode="numeric" className="font-mono h-14 bg-secondary/30 text-lg border-secondary" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="vo2Max"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-muted-foreground uppercase text-xs font-bold tracking-wider flex items-center gap-1">
                              <TrendingUp className="h-3 w-3" /> VO2 Max
                            </FormLabel>
                            <FormControl>
                              <Input type="number" inputMode="decimal" className="font-mono h-14 bg-secondary/30 text-lg border-secondary" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="weightKg"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-muted-foreground uppercase text-xs font-bold tracking-wider flex items-center gap-1">
                              <Dumbbell className="h-3 w-3" /> Poids (kg)
                            </FormLabel>
                            <FormControl>
                              <Input type="number" inputMode="decimal" className="font-mono h-14 bg-secondary/30 text-lg border-secondary" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {selectedSport?.appliesElevation && (
                      <FormField
                        control={form.control}
                        name="elevationGainMeters"
                        render={({ field }) => (
                          <FormItem className="animate-in fade-in slide-in-from-top-4 duration-300">
                            <FormLabel className="text-primary uppercase text-xs font-bold tracking-wider flex items-center gap-1">
                              <Mountain className="h-3 w-3" /> Dénivelé (m)
                            </FormLabel>
                            <FormControl>
                              <Input type="number" inputMode="numeric" className="font-mono h-14 bg-primary/10 text-primary border-primary/50 text-lg" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    {/* Résultat inline — mobile only */}
                    {result && (
                      <div className="lg:hidden animate-in zoom-in-95 duration-500 rounded-lg border border-primary/30 bg-primary/5 p-4 space-y-3">
                        <div className="text-center">
                          <div className="text-5xl font-black text-primary font-mono tracking-tighter">
                            {result.calories}
                          </div>
                          <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground mt-1">
                            Kcal brûlées
                          </div>
                        </div>
                        <Separator className="bg-border/50" />
                        <div className="grid grid-cols-2 gap-2 font-mono text-xs">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Base</span>
                            <span className="font-bold">{result.breakdown.base}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">FC ×</span>
                            <span className="font-bold">{result.breakdown.heartRateFactor}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">VO2 ×</span>
                            <span className="font-bold">{result.breakdown.vo2Factor}</span>
                          </div>
                          {result.breakdown.elevationBonus > 0 && (
                            <div className="flex justify-between text-primary col-span-2">
                              <span>Dénivelé +</span>
                              <span className="font-bold">{result.breakdown.elevationBonus}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    <Button
                      type="submit"
                      size="lg"
                      className="w-full h-14 font-mono uppercase tracking-widest text-sm"
                    >
                      Calculer la dépense
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>

          {/* RESULT PANEL — desktop */}
          <div className="hidden lg:block w-[380px] shrink-0">
            <Card className="h-full border-border bg-secondary/10 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                <Activity className="h-48 w-48" />
              </div>
              <CardHeader>
                <CardTitle className="text-xl font-mono uppercase tracking-wider text-muted-foreground">
                  Résultat
                </CardTitle>
              </CardHeader>
              <CardContent className="relative z-10 flex flex-col justify-center min-h-[300px]">
                {!result ? (
                  <div className="text-center text-muted-foreground opacity-50 flex flex-col items-center justify-center py-12">
                    <Flame className="h-16 w-16 mb-4" />
                    <p className="font-mono text-sm uppercase">En attente</p>
                  </div>
                ) : (
                  <div className="animate-in zoom-in-95 duration-500 space-y-8">
                    <div className="text-center">
                      <div className="text-8xl font-black text-primary font-mono tracking-tighter">
                        {result.calories}
                      </div>
                      <div className="text-sm font-mono uppercase tracking-widest text-muted-foreground mt-2">
                        Kcal brûlées
                      </div>
                    </div>
                    <Separator className="bg-border" />
                    <div className="space-y-3 font-mono text-sm">
                      <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">
                        Détail des facteurs
                      </h4>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Base (MET × poids × temps)</span>
                        <span className="font-bold">{result.breakdown.base}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Facteur FC</span>
                        <span className="font-bold">×{result.breakdown.heartRateFactor}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Facteur VO2</span>
                        <span className="font-bold">×{result.breakdown.vo2Factor}</span>
                      </div>
                      {result.breakdown.elevationBonus > 0 && (
                        <div className="flex justify-between items-center text-primary">
                          <span>Bonus dénivelé</span>
                          <span className="font-bold">+{result.breakdown.elevationBonus}</span>
                        </div>
                      )}
                      <Separator className="bg-border/50 my-2" />
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Durée</span>
                        <span className="font-bold">{result.breakdown.durationHours}h</span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

        </div>
      </div>
    </AppLayout>
  );
}
