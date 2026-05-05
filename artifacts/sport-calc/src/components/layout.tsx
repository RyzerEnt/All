import React from "react";
import { Link, useLocation } from "wouter";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        fontFamily: "system-ui,-apple-system,'Segoe UI',Helvetica,Arial,sans-serif",
        background: "#08090f",
        color: "#fff",
      }}
    >
      {/* NAV */}
      <header style={{
        position: "sticky", top: 0, zIndex: 50,
        background: "rgba(8,9,15,0.9)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
      }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 1.25rem", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href="/">
            <img src="/logo-color.png" alt="Ryzer" style={{ height: "2rem", borderRadius: 8, objectFit: "contain", cursor: "pointer" }} />
          </Link>

          <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", background: "rgba(249,115,22,0.12)", border: "1px solid rgba(249,115,22,0.3)", borderRadius: 999, padding: "0.25rem 0.75rem" }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#f97316", display: "inline-block", boxShadow: "0 0 6px #f97316" }} />
            <span style={{ fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#f97316" }}>Calculateur sportif</span>
          </div>

          <nav style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
            <Link href="/">
              <span style={{
                padding: "0.5rem 1rem",
                borderRadius: 999,
                fontSize: "0.8rem",
                fontWeight: 700,
                cursor: "pointer",
                textDecoration: "none",
                transition: "all 0.2s",
                ...(location === "/"
                  ? { background: "rgba(37,99,235,0.18)", color: "#2563eb", border: "1px solid rgba(37,99,235,0.35)" }
                  : { background: "transparent", color: "rgba(255,255,255,0.5)", border: "1px solid transparent" }),
              }}>
                Calculateur
              </span>
            </Link>
            <Link href="/admin">
              <span style={{
                padding: "0.5rem 1rem",
                borderRadius: 999,
                fontSize: "0.8rem",
                fontWeight: 700,
                cursor: "pointer",
                textDecoration: "none",
                transition: "all 0.2s",
                ...(location === "/admin"
                  ? { background: "rgba(37,99,235,0.18)", color: "#2563eb", border: "1px solid rgba(37,99,235,0.35)" }
                  : { background: "transparent", color: "rgba(255,255,255,0.5)", border: "1px solid transparent" }),
              }}>
                Admin
              </span>
            </Link>
          </nav>
        </div>
      </header>

      <main style={{ flex: 1, display: "flex", flexDirection: "column" }}>{children}</main>

      <footer style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: "1.5rem 1.25rem", textAlign: "center" }}>
        <p style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.3)", fontWeight: 500, letterSpacing: "0.04em" }}>
          © {new Date().getFullYear()} Ryzer — Tous droits réservés
        </p>
      </footer>
    </div>
  );
}
