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
  getListMultipliersQueryKey
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
import { Activity, Dumbbell, Settings, Edit, Trash2, Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const sportSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  baseMet: z.coerce.number().min(1),
  icon: z.string().min(1),
  appliesElevation: z.boolean()
});

type SportFormValues = z.infer<typeof sportSchema>;

function SportFormDialog({ 
  sport, 
  open, 
  setOpen 
}: { 
  sport?: any, 
  open: boolean, 
  setOpen: (v: boolean) => void 
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
      appliesElevation: false
    }
  });

  const onSubmit = (data: SportFormValues) => {
    if (sport) {
      updateSport.mutate(
        { id: sport.id, data },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getListSportsQueryKey() });
            queryClient.invalidateQueries({ queryKey: getGetCalcSummaryQueryKey() });
            toast({ title: "Sport updated" });
            setOpen(false);
          }
        }
      );
    } else {
      createSport.mutate(
        { data },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getListSportsQueryKey() });
            queryClient.invalidateQueries({ queryKey: getGetCalcSummaryQueryKey() });
            toast({ title: "Sport created" });
            setOpen(false);
            form.reset();
          }
        }
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="font-mono bg-card border-border">
        <DialogHeader>
          <DialogTitle className="uppercase tracking-wider">{sport ? "Edit Sport" : "New Sport"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="name" render={({field}) => (
              <FormItem><FormLabel>Name</FormLabel><FormControl><Input className="bg-secondary/50 border-secondary" {...field} /></FormControl><FormMessage/></FormItem>
            )} />
            <FormField control={form.control} name="slug" render={({field}) => (
              <FormItem><FormLabel>Slug</FormLabel><FormControl><Input className="bg-secondary/50 border-secondary" {...field} /></FormControl><FormMessage/></FormItem>
            )} />
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="baseMet" render={({field}) => (
                <FormItem><FormLabel>Base MET</FormLabel><FormControl><Input type="number" step="0.1" className="bg-secondary/50 border-secondary" {...field} /></FormControl><FormMessage/></FormItem>
              )} />
              <FormField control={form.control} name="icon" render={({field}) => (
                <FormItem><FormLabel>Icon/Emoji</FormLabel><FormControl><Input className="bg-secondary/50 border-secondary" {...field} /></FormControl><FormMessage/></FormItem>
              )} />
            </div>
            <FormField control={form.control} name="appliesElevation" render={({field}) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border border-border p-3">
                <div className="space-y-0.5">
                  <FormLabel>Applies Elevation</FormLabel>
                </div>
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
              </FormItem>
            )} />
            <div className="flex justify-end pt-4">
              <Button type="submit" className="uppercase tracking-widest text-xs" disabled={createSport.isPending || updateSport.isPending}>
                Save Sport
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function MultiplierItem({ multiplier }: { multiplier: any }) {
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
          toast({ title: "Multiplier updated" });
        }
      }
    );
  };

  return (
    <TableRow>
      <TableCell className="font-mono">
        <div className="font-bold text-foreground">{multiplier.label}</div>
        <div className="text-xs text-muted-foreground truncate max-w-[200px]">{multiplier.description}</div>
      </TableCell>
      <TableCell className="font-mono text-xs text-muted-foreground">{multiplier.paramKey}</TableCell>
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-2">
          <Input 
            type="number" 
            step="0.001" 
            className="w-24 font-mono h-8 text-right bg-secondary/50 border-secondary" 
            value={val} 
            onChange={(e) => setVal(e.target.value)} 
          />
          <span className="text-xs text-muted-foreground w-8">{multiplier.unit}</span>
          <Button size="sm" variant="secondary" className="h-8 uppercase text-[10px] tracking-wider" onClick={handleSave} disabled={updateMultiplier.isPending}>
            Save
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

export default function AdminDashboard() {
  const { data: summary, isLoading: isLoadingSummary } = useGetCalcSummary({ query: { queryKey: getGetCalcSummaryQueryKey() }});
  const { data: sports } = useListSports({ query: { queryKey: getListSportsQueryKey() }});
  const { data: multipliers } = useListMultipliers({ query: { queryKey: getListMultipliersQueryKey() }});
  
  const deleteSport = useDeleteSport();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [createOpen, setCreateOpen] = React.useState(false);
  const [editSport, setEditSport] = React.useState<any>(null);

  const handleDeleteSport = (id: number) => {
    if (confirm("Are you sure?")) {
      deleteSport.mutate(
        { id },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getListSportsQueryKey() });
            queryClient.invalidateQueries({ queryKey: getGetCalcSummaryQueryKey() });
            toast({ title: "Sport deleted" });
          }
        }
      );
    }
  };

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8 max-w-6xl space-y-8">
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-border bg-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-mono uppercase text-muted-foreground tracking-wider flex items-center gap-2">
                <Dumbbell className="h-4 w-4" /> Total Sports
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold font-mono text-primary">{isLoadingSummary ? "-" : summary?.totalSports}</div>
            </CardContent>
          </Card>
          <Card className="border-border bg-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-mono uppercase text-muted-foreground tracking-wider flex items-center gap-2">
                <Settings className="h-4 w-4" /> Active Multipliers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold font-mono text-primary">{isLoadingSummary ? "-" : summary?.totalMultipliers}</div>
            </CardContent>
          </Card>
          <Card className="border-border bg-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-mono uppercase text-muted-foreground tracking-wider flex items-center gap-2">
                <Activity className="h-4 w-4" /> Avg MET Base
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold font-mono text-primary">{isLoadingSummary ? "-" : summary?.avgMet.toFixed(1)}</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* SPORTS MANAGER */}
          <Card className="border-border bg-card overflow-hidden">
            <CardHeader className="border-b border-border/50 bg-secondary/10 flex flex-row items-center justify-between pb-4">
              <div>
                <CardTitle className="font-mono uppercase tracking-wider text-lg">Sports Dictionary</CardTitle>
                <CardDescription>Manage activities and base METs</CardDescription>
              </div>
              <Button size="sm" onClick={() => setCreateOpen(true)} className="uppercase font-mono text-[10px] tracking-wider">
                <Plus className="h-3 w-3 mr-1" /> New Sport
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-secondary/20">
                  <TableRow>
                    <TableHead className="font-mono text-xs uppercase">Sport</TableHead>
                    <TableHead className="font-mono text-xs uppercase text-right">Base MET</TableHead>
                    <TableHead className="font-mono text-xs uppercase text-center">Elev.</TableHead>
                    <TableHead className="text-right"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sports?.map(sport => (
                    <TableRow key={sport.id}>
                      <TableCell className="font-mono font-medium">
                        <span className="mr-2">{sport.icon}</span>
                        {sport.name}
                      </TableCell>
                      <TableCell className="text-right font-mono">{sport.baseMet}</TableCell>
                      <TableCell className="text-center">
                        {sport.appliesElevation ? (
                          <Badge variant="outline" className="text-[10px] text-primary border-primary">YES</Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px] text-muted-foreground">NO</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => setEditSport(sport)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleDeleteSport(sport.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {sports?.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground font-mono text-sm uppercase">
                        No sports defined
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* MULTIPLIERS MANAGER */}
          <Card className="border-border bg-card overflow-hidden">
            <CardHeader className="border-b border-border/50 bg-secondary/10 pb-4">
              <CardTitle className="font-mono uppercase tracking-wider text-lg">System Multipliers</CardTitle>
              <CardDescription>Tune the underlying calorie algorithm</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-secondary/20">
                  <TableRow>
                    <TableHead className="font-mono text-xs uppercase">Parameter</TableHead>
                    <TableHead className="font-mono text-xs uppercase">Key</TableHead>
                    <TableHead className="font-mono text-xs uppercase text-right">Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {multipliers?.map(m => (
                    <MultiplierItem key={m.id} multiplier={m} />
                  ))}
                  {multipliers?.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-8 text-muted-foreground font-mono text-sm uppercase">
                        No multipliers defined
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {createOpen && <SportFormDialog open={createOpen} setOpen={setCreateOpen} />}
      {editSport && <SportFormDialog open={!!editSport} setOpen={(v) => !v && setEditSport(null)} sport={editSport} />}

    </AppLayout>
  );
}
