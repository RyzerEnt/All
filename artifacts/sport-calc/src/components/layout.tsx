import React from "react";
import { Link, useLocation } from "wouter";
import { Activity, LayoutDashboard } from "lucide-react";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  return (
    <div className="min-h-screen flex flex-col w-full bg-background text-foreground font-sans">
      <header className="border-b border-border bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            <span className="font-bold tracking-tight uppercase">CalcSportif</span>
          </div>
          <nav className="flex items-center gap-1">
            <Link 
              href="/" 
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                location === "/" 
                  ? "bg-secondary text-foreground" 
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
              }`}
            >
              Calculator
            </Link>
            <Link 
              href="/admin" 
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                location === "/admin" 
                  ? "bg-secondary text-foreground" 
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
              }`}
            >
              <span className="flex items-center gap-2">
                <LayoutDashboard className="h-4 w-4" />
                Admin
              </span>
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
