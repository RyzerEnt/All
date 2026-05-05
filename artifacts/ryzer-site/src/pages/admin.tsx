import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  email: z.string().email({
    message: "Veuillez entrer une adresse email valide.",
  }),
  password: z.string().min(6, {
    message: "Le mot de passe doit contenir au moins 6 caractères.",
  }),
});

type FormValues = z.infer<typeof formSchema>;

export default function Admin() {
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  function onSubmit(data: FormValues) {
    console.log(data);
    toast({
      title: "Connexion réussie",
      description: "Bienvenue dans l'espace d'administration Ryzer.",
    });
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 selection:bg-primary/30">
      <div className="absolute top-8 left-8">
        <Link href="/" className="opacity-70 hover:opacity-100 transition-opacity">
          <img src="/logo-bw.png" alt="Ryzer" className="h-8 object-contain" />
        </Link>
      </div>

      <div className="w-full max-w-md space-y-8 bg-card/50 p-8 sm:p-12 rounded-2xl border border-white/5 backdrop-blur-xl shadow-2xl">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Connexion au portail
          </h1>
          <p className="text-sm text-muted-foreground">
            Accès réservé à l'équipe d'administration Ryzer
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white/80">Email</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="admin@ryzer.app" 
                      type="email" 
                      className="bg-background/50 border-white/10 focus-visible:ring-primary text-white" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage className="text-destructive" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white/80">Mot de passe</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="••••••••" 
                      type="password" 
                      className="bg-background/50 border-white/10 focus-visible:ring-primary text-white" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage className="text-destructive" />
                </FormItem>
              )}
            />
            <Button 
              type="submit" 
              className="w-full bg-primary hover:bg-primary/90 text-white font-semibold tracking-wide py-6 rounded-xl transition-all shadow-[0_0_20px_rgba(37,99,235,0.2)] hover:shadow-[0_0_30px_rgba(37,99,235,0.4)]"
            >
              Se connecter
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}
