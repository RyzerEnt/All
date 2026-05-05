import React from "react";
import { AppLayout } from "@/components/layout";
import {
  DEFAULT_SPORTS,
  loadMultipliers,
  saveMultipliers,
  resetMultipliers,
  type Multiplier,
} from "@/lib/calc-store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Activity, Dumbbell, Settings, Mountain, RotateCcw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

function MultiplierCard({
  multiplier,
  onChange,
}: {
  multiplier: Multiplier;
  onChange: (key: string, value: number) => void;
}) {
  const [val, setVal] = React.useState(multiplier.value.toString());

  React.useEffect(() => {
    setVal(multiplier.value.toString());
  }, [multiplier.value]);

  const handleBlur = () => {
    const num = parseFloat(val);
    if (!isNaN(num) && num >= multiplier.min && num <= multiplier.max) {
      onChange(multiplier.key, num);
    } else {
      setVal(multiplier.value.toString());
    }
  };

  return (
    <div className="p-4 border-b border-border/50 last:border-0">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <div className="font-mono font-bold text-sm text-foreground">{multiplier.label}</div>
          <div className="text-xs text-muted-foreground mt-0.5">{multiplier.description}</div>
        </div>
        <div className="text-xs text-muted-foreground font-mono shrink-0 mt-1">
          [{multiplier.min} – {multiplier.max}]
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Input
          type="number"
          step={multiplier.step}
          inputMode="decimal"
          min={multiplier.min}
          max={multiplier.max}
          className="flex-1 font-mono h-11 text-right bg-secondary/50 border-secondary text-lg"
          value={val}
          onChange={(e) => setVal(e.target.value)}
          onBlur={handleBlur}
        />
        <span className="text-xs text-muted-foreground font-mono w-20 shrink-0 text-right">
          {multiplier.unit}
        </span>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const { toast } = useToast();
  const [multipliers, setMultipliers] = React.useState<Multiplier[]>(loadMultipliers);

  const handleChange = (key: string, value: number) => {
    setMultipliers((prev) => {
      const updated = prev.map((m) => (m.key === key ? { ...m, value } : m));
      saveMultipliers(updated);
      return updated;
    });
    toast({ title: "Paramètre mis à jour", description: `${key} = ${value}` });
  };

  const handleReset = () => {
    resetMultipliers();
    setMultipliers(loadMultipliers());
    toast({ title: "Réinitialisé", description: "Valeurs par défaut restaurées" });
  };

  const avgMet = DEFAULT_SPORTS.reduce((s, sp) => s + sp.baseMet, 0) / DEFAULT_SPORTS.length;

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
              <div className="text-3xl font-bold font-mono text-primary">{DEFAULT_SPORTS.length}</div>
            </CardContent>
          </Card>
          <Card className="border-border bg-card">
            <CardHeader className="pb-1 pt-3 px-3">
              <CardTitle className="text-[10px] font-mono uppercase text-muted-foreground tracking-wider flex items-center gap-1.5">
                <Settings className="h-3 w-3" /> Params
              </CardTitle>
            </CardHeader>
            <CardContent className="px-3 pb-3">
              <div className="text-3xl font-bold font-mono text-primary">{multipliers.length}</div>
            </CardContent>
          </Card>
          <Card className="border-border bg-card">
            <CardHeader className="pb-1 pt-3 px-3">
              <CardTitle className="text-[10px] font-mono uppercase text-muted-foreground tracking-wider flex items-center gap-1.5">
                <Activity className="h-3 w-3" /> MET moy.
              </CardTitle>
            </CardHeader>
            <CardContent className="px-3 pb-3">
              <div className="text-3xl font-bold font-mono text-primary">{avgMet.toFixed(1)}</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* SPORTS LIST (lecture seule) */}
          <Card className="border-border bg-card overflow-hidden">
            <CardHeader className="border-b border-border/50 bg-secondary/10 py-3 px-4">
              <CardTitle className="font-mono uppercase tracking-wider text-base">Sports disponibles</CardTitle>
              <CardDescription className="text-xs">Liste fixe — modifiable dans le code source</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border/50">
                {DEFAULT_SPORTS.map((sport) => (
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
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* MULTIPLIERS (modifiables, sauvegardés en localStorage) */}
          <Card className="border-border bg-card overflow-hidden">
            <CardHeader className="border-b border-border/50 bg-secondary/10 py-3 px-4 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="font-mono uppercase tracking-wider text-base">Multiplicateurs</CardTitle>
                <CardDescription className="text-xs">Sauvegardés dans le navigateur</CardDescription>
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="h-9 text-muted-foreground hover:text-foreground text-xs"
                onClick={handleReset}
              >
                <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                Reset
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {multipliers.map((m) => (
                <MultiplierCard key={m.key} multiplier={m} onChange={handleChange} />
              ))}
            </CardContent>
          </Card>

        </div>
      </div>
    </AppLayout>
  );
}
