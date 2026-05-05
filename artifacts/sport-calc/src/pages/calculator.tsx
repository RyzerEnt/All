import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { AppLayout } from "@/components/layout";
import { 
  useListSports, 
  useComputeCalories, 
  getListSportsQueryKey 
} from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Flame, Activity, Timer, TrendingUp, Mountain, Dumbbell } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const calcSchema = z.object({
  sportId: z.coerce.number().min(1, "Sport is required"),
  durationMinutes: z.coerce.number().min(1, "Duration must be at least 1 minute"),
  heartRateBpm: z.coerce.number().min(40).max(220),
  vo2Max: z.coerce.number().min(20).max(90),
  elevationGainMeters: z.coerce.number().min(0).optional(),
  weightKg: z.coerce.number().min(30).max(250).optional(),
});

type CalcFormValues = z.infer<typeof calcSchema>;

export default function CalculatorPage() {
  const { data: sports, isLoading: isSportsLoading } = useListSports({
    query: { queryKey: getListSportsQueryKey() }
  });

  const computeCalories = useComputeCalories();

  const form = useForm<CalcFormValues>({
    resolver: zodResolver(calcSchema),
    defaultValues: {
      durationMinutes: 60,
      heartRateBpm: 140,
      vo2Max: 45,
      elevationGainMeters: 0,
      weightKg: 70,
    }
  });

  const sportId = form.watch("sportId");
  const selectedSport = sports?.find(s => s.id === sportId);

  const onSubmit = (data: CalcFormValues) => {
    computeCalories.mutate({
      data: {
        ...data,
        elevationGainMeters: selectedSport?.appliesElevation ? data.elevationGainMeters : undefined
      }
    });
  };

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="flex flex-col md:flex-row gap-8">
          
          <div className="flex-1">
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="text-2xl font-mono uppercase tracking-wider flex items-center gap-2">
                  <Activity className="h-6 w-6 text-primary" />
                  Performance Input
                </CardTitle>
                <CardDescription>
                  Enter your workout metrics to compute energy expenditure.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isSportsLoading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ) : (
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                      
                      <FormField
                        control={form.control}
                        name="sportId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-muted-foreground uppercase text-xs font-bold tracking-wider">Sport</FormLabel>
                            <Select 
                              onValueChange={(val) => field.onChange(Number(val))} 
                              value={field.value?.toString() || ""}
                            >
                              <FormControl>
                                <SelectTrigger className="font-mono text-sm h-12 bg-secondary/30 border-secondary">
                                  <SelectValue placeholder="Select a sport" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {sports?.map((sport) => (
                                  <SelectItem key={sport.id} value={sport.id.toString()} className="font-mono">
                                    <span className="flex items-center gap-2">
                                      <span>{sport.icon}</span>
                                      {sport.name} <span className="text-muted-foreground ml-2 text-xs">MET: {sport.baseMet}</span>
                                    </span>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="durationMinutes"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-muted-foreground uppercase text-xs font-bold tracking-wider flex items-center gap-1">
                                <Timer className="h-3 w-3" /> Duration (min)
                              </FormLabel>
                              <FormControl>
                                <Input type="number" className="font-mono h-12 bg-secondary/30 text-lg border-secondary" {...field} />
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
                                <Activity className="h-3 w-3" /> Avg HR (bpm)
                              </FormLabel>
                              <FormControl>
                                <Input type="number" className="font-mono h-12 bg-secondary/30 text-lg border-secondary" {...field} />
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
                                <Input type="number" className="font-mono h-12 bg-secondary/30 text-lg border-secondary" {...field} />
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
                                <Dumbbell className="h-3 w-3" /> Weight (kg)
                              </FormLabel>
                              <FormControl>
                                <Input type="number" className="font-mono h-12 bg-secondary/30 text-lg border-secondary" {...field} />
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
                              <FormLabel className="text-muted-foreground uppercase text-xs font-bold tracking-wider flex items-center gap-1 text-primary">
                                <Mountain className="h-3 w-3" /> Elevation Gain (m)
                              </FormLabel>
                              <FormControl>
                                <Input type="number" className="font-mono h-12 bg-primary/10 text-primary border-primary/50 text-lg" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}

                      <Button 
                        type="submit" 
                        size="lg" 
                        className="w-full font-mono uppercase tracking-widest text-sm"
                        disabled={computeCalories.isPending}
                      >
                        {computeCalories.isPending ? "Computing..." : "Compute Expenditure"}
                      </Button>
                    </form>
                  </Form>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="w-full md:w-[400px]">
            <Card className="h-full border-border bg-secondary/10 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5">
                <Activity className="h-48 w-48" />
              </div>
              
              <CardHeader>
                <CardTitle className="text-xl font-mono uppercase tracking-wider text-muted-foreground">
                  Result
                </CardTitle>
              </CardHeader>
              <CardContent className="relative z-10 flex flex-col justify-center h-[calc(100%-80px)]">
                {!computeCalories.data ? (
                  <div className="text-center text-muted-foreground opacity-50 flex flex-col items-center justify-center py-12">
                    <Flame className="h-16 w-16 mb-4" />
                    <p className="font-mono text-sm uppercase">Awaiting inputs</p>
                  </div>
                ) : (
                  <div className="animate-in zoom-in-95 duration-500 space-y-8">
                    <div className="text-center">
                      <div className="text-6xl md:text-8xl font-black text-primary font-mono tracking-tighter">
                        {Math.round(computeCalories.data.calories)}
                      </div>
                      <div className="text-sm font-mono uppercase tracking-widest text-muted-foreground mt-2">
                        Kcal Burned
                      </div>
                    </div>

                    <Separator className="bg-border" />

                    <div className="space-y-4">
                      <h4 className="text-xs font-mono uppercase font-bold text-muted-foreground tracking-wider mb-4">Factor Breakdown</h4>
                      
                      <div className="space-y-3 font-mono text-sm">
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Base (MET)</span>
                          <span className="font-bold">{computeCalories.data.breakdown.base.toFixed(1)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">HR Multiplier</span>
                          <span className="font-bold">x{computeCalories.data.breakdown.heartRateFactor.toFixed(3)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">VO2 Factor</span>
                          <span className="font-bold">x{computeCalories.data.breakdown.vo2Factor.toFixed(3)}</span>
                        </div>
                        {computeCalories.data.breakdown.elevationBonus > 0 && (
                          <div className="flex justify-between items-center text-primary">
                            <span>Elevation Bonus</span>
                            <span className="font-bold">+{computeCalories.data.breakdown.elevationBonus.toFixed(1)}</span>
                          </div>
                        )}
                        <Separator className="bg-border/50 my-2" />
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Duration (hrs)</span>
                          <span className="font-bold">{computeCalories.data.breakdown.durationHours.toFixed(2)}h</span>
                        </div>
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
