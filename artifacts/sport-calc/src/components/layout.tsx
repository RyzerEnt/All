import React from "react";
import { Link, useLocation } from "wouter";
import { Activity, LayoutDashboard, Calculator } from "lucide-react";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  return (
    <div className="min-h-screen flex flex-col w-full bg-background text-foreground font-sans">
      <header className="border-b border-border bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary shrink-0" />
            <span className="font-bold tracking-tight uppercase text-sm">CalcSportif</span>
          </div>
          <nav className="flex items-center gap-1">
            <Link
              href="/"
              className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-md transition-colors min-h-[44px] ${
                location === "/"
                  ? "bg-secondary text-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
              }`}
            >
              <Calculator className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline">Calculateur</span>
            </Link>
            <Link
              href="/admin"
              className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-md transition-colors min-h-[44px] ${
                location === "/admin"
                  ? "bg-secondary text-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
              }`}
            >
              <LayoutDashboard className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline">Admin</span>
            </Link>
          </nav>
        </div>
      </header>
      <main className="flex-1 flex flex-col">
        {children}
      </main>
    </div>
  );
}
