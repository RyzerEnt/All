import { useState, useEffect } from "react";
import heroImg from "@assets/pexels-slimmars-13-197677686-13685489_1777999561622.jpg";

interface RoadmapItem {
  id: number;
  title: string;
  description?: string;
  status: "planned" | "in-progress" | "done";
  quarter?: string;
  sortOrder?: number;
}

const BADGE: Record<string, { bg: string; color: string; label: string }> = {
  planned: { bg: "rgba(37,99,235,0.12)", color: "#2563eb", label: "Planifié" },
  "in-progress": { bg: "rgba(249,115,22,0.12)", color: "#f97316", label: "En cours" },
  done: { bg: "rgba(22,163,74,0.12)", color: "#16a34a", label: "Terminé" },
};

export default function Home() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [roadmap, setRoadmap] = useState<RoadmapItem[]>([]);
  const [roadmapLoading, setRoadmapLoading] = useState(true);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  useEffect(() => {
    fetch("/api/roadmap")
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setRoadmap(data); })
      .catch(() => {})
      .finally(() => setRoadmapLoading(false));
  }, []);

  const [email, setEmail] = useState("");
  const [waitlistStatus, setWaitlistStatus] = useState<"idle" | "loading" | "success" | "error" | "duplicate">("idle");
  const [waitlistMsg, setWaitlistMsg] = useState("");

  const handleWaitlist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setWaitlistStatus("loading");
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json() as { message?: string; error?: string };
      if (res.ok) {
        setWaitlistStatus("success");
        setWaitlistMsg(data.message ?? "Inscription confirmée !");
        setEmail("");
      } else if (res.status === 409) {
        setWaitlistStatus("duplicate");
        setWaitlistMsg("Cet email est déjà inscrit !");
      } else {
        setWaitlistStatus("error");
        setWaitlistMsg(data.error ?? "Une erreur est survenue.");
      }
    } catch {
      setWaitlistStatus("error");
      setWaitlistMsg("Impossible de se connecter au serveur.");
    }
  };

  const close = () => setMenuOpen(false);

  const navLinkStyle = (base: string): React.CSSProperties => ({
    fontSize: "0.875rem", fontWeight: 500,
    color: scrolled ? "rgba(15,23,42,0.65)" : "rgba(255,255,255,0.88)",
    textDecoration: "none", transition: "color 0.2s",
  });

  return (
    <div style={{ fontFamily: "system-ui,-apple-system,'Segoe UI',Helvetica,Arial,sans-serif", overflowX: "hidden", background: "#08090f" }}>

      {/* ═══ NAV ═══ */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 200,
        padding: scrolled ? "0.875rem 0" : "1.25rem 0",
        background: scrolled ? "rgba(255,255,255,0.96)" : "transparent",
        backdropFilter: scrolled ? "blur(16px)" : "none",
        WebkitBackdropFilter: scrolled ? "blur(16px)" : "none",
        borderBottom: scrolled ? "1px solid rgba(15,23,42,0.1)" : "1px solid transparent",
        transition: "all 0.3s",
      }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 1.25rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <a href="/"><img src="/logo-color.png" alt="Ryzer" style={{ height: "2.25rem", borderRadius: 10, objectFit: "contain" }} /></a>

          {/* Desktop links */}
          <ul style={{ display: "flex", alignItems: "center", gap: "2rem", listStyle: "none", margin: 0, padding: 0 }}>
            {[["#features","Fonctionnalités"],["#roadmap","Roadmap"],["#stats","Performance"]].map(([href, label]) => (
              <li key={href} style={{ display: "none" }} className="md-show">
                <a href={href} style={navLinkStyle("")}>{label}</a>
              </li>
            ))}
          </ul>

          <a href="#roadmap" style={{
            background: scrolled ? "#2563eb" : "#fff",
            color: scrolled ? "#fff" : "#0f172a",
            fontWeight: 700, fontSize: "0.8rem",
            padding: "0.55rem 1.25rem", borderRadius: 999,
            textDecoration: "none", transition: "all 0.3s",
            display: "none",
          }} className="md-show">Roadmap</a>

          {/* Hamburger */}
          <button
            onClick={() => setMenuOpen(true)}
            aria-label="Ouvrir le menu"
            style={{ background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", gap: 5, padding: 4 }}
            className="md-hide"
          >
            {[0,1,2].map(i => (
              <span key={i} style={{ display: "block", width: 22, height: 2, background: scrolled ? "#0f172a" : "#fff", borderRadius: 2, transition: "background 0.3s" }} />
            ))}
          </button>
        </div>
      </nav>

      {/* ═══ MOBILE DRAWER ═══ */}
      <div style={{
        position: "fixed", inset: 0, zIndex: 300,
        background: "rgba(7,8,15,0.98)",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", gap: "2rem",
        opacity: menuOpen ? 1 : 0,
        pointerEvents: menuOpen ? "auto" : "none",
        transition: "opacity 0.25s",
      }}>
        <button onClick={close} aria-label="Fermer" style={{ position: "absolute", top: "1.5rem", right: "1.5rem", background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.6)", fontSize: "1.75rem", lineHeight: 1 }}>✕</button>
        {[["#features","Fonctionnalités"],["#roadmap","Roadmap"],["#stats","Performance"]].map(([href, label]) => (
          <a key={href} href={href} onClick={close} style={{ fontSize: "1.75rem", fontWeight: 800, color: "rgba(255,255,255,0.88)", textDecoration: "none", letterSpacing: "-0.02em" }}>{label}</a>
        ))}
        <a href="#cta" onClick={close} style={{ background: "#2563eb", color: "#fff", fontWeight: 700, fontSize: "1rem", padding: "0.9rem 2.5rem", borderRadius: 999, textDecoration: "none", marginTop: "0.5rem" }}>Télécharger</a>
      </div>

      {/* ═══ HERO ═══ */}
      <section style={{
        position: "relative", width: "100%", height: "100vh", minHeight: 560,
        display: "flex", alignItems: "center",
        background: "#08090f", overflow: "hidden",
      }}>
        <img
          src={heroImg}
          alt="Alpiniste au sommet en montagne"
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center center", display: "block", zIndex: 0 }}
        />
        <div style={{ position: "absolute", inset: 0, zIndex: 1, background: "linear-gradient(to top, #f1f5f9 0%, rgba(7,8,15,0.45) 50%, rgba(7,8,15,0.2) 100%)" }} />
        <div style={{ position: "relative", zIndex: 2, maxWidth: 1200, margin: "0 auto", padding: "5rem 1.25rem 0", width: "100%" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", background: "rgba(249,115,22,0.15)", border: "1px solid rgba(249,115,22,0.35)", borderRadius: 999, padding: "0.3rem 0.9rem", marginBottom: "1.5rem" }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#f97316", display: "inline-block", boxShadow: "0 0 8px #f97316" }} />
            <span style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#f97316" }}>En développement — bientôt disponible</span>
          </div>
          <h1 style={{ fontSize: "clamp(2.8rem,9vw,6.5rem)", fontWeight: 900, letterSpacing: "-0.035em", lineHeight: 1, textTransform: "uppercase", color: "#fff", marginBottom: "1.25rem" }}>
            ATTEINS<br />
            <span style={{ background: "linear-gradient(90deg,#2563eb,#f97316)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>LES SOMMETS.</span>
          </h1>
          <p style={{ fontSize: "clamp(0.95rem,2.2vw,1.2rem)", color: "rgba(255,255,255,0.78)", fontWeight: 300, maxWidth: 480, marginBottom: "2rem", lineHeight: 1.65 }}>
            Le tracker de performance définitif pour les athlètes de trail et de montagne. En cours de développement — sois parmi les premiers à le découvrir.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.875rem" }}>
            <a href="#cta" style={{ background: "#2563eb", color: "#fff", fontWeight: 700, fontSize: "1rem", padding: "0.875rem 2rem", borderRadius: 999, textDecoration: "none", boxShadow: "0 0 28px rgba(37,99,235,0.3)", display: "inline-block" }}>Être notifié en premier</a>
            <a href="#roadmap" style={{ background: "transparent", color: "#fff", fontWeight: 600, fontSize: "1rem", padding: "0.875rem 2rem", borderRadius: 999, border: "1px solid rgba(255,255,255,0.28)", textDecoration: "none", display: "inline-block" }}>Voir la roadmap</a>
          </div>
        </div>
      </section>

      {/* ═══ STATS ═══ */}
      <section id="stats" style={{ padding: "4.5rem 0", background: "#f1f5f9", borderTop: "1px solid rgba(15,23,42,0.08)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 1.25rem" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: "2rem" }} className="stats-grid">
            {[{v:"Bêta",l:"Phase actuelle"},{v:"2025",l:"Lancement visé"},{v:"Trail",l:"Sport cible principal"},{v:"iOS & Android",l:"Plateformes prévues"}].map(s => (
              <div key={s.l} style={{ borderLeft: "2px solid rgba(37,99,235,0.3)", paddingLeft: "1.25rem" }}>
                <div style={{ fontSize: "clamp(1.4rem,3vw,2rem)", fontWeight: 900, letterSpacing: "-0.02em", lineHeight: 1, marginBottom: "0.35rem", color: "#0f172a" }}>{s.v}</div>
                <div style={{ fontSize: "0.7rem", fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", color: "rgba(15,23,42,0.5)" }}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ FEATURES ═══ */}
      <section id="features" style={{ padding: "5rem 0", background: "#fff" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 1.25rem" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "3rem", alignItems: "center" }} className="feature-row">
            <div>
              <span style={{ display: "inline-flex", padding: "0.25rem 0.8rem", borderRadius: 999, fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", background: "rgba(37,99,235,0.1)", border: "1px solid rgba(37,99,235,0.2)", color: "#2563eb", marginBottom: "1.25rem" }}>Intégration seamless</span>
              <h2 style={{ fontSize: "clamp(1.75rem,4vw,3rem)", fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.1, marginBottom: "1rem", color: "#0f172a" }}>Vos données<br />sur votre poignet.</h2>
              <p style={{ fontSize: "1rem", color: "rgba(15,23,42,0.55)", fontWeight: 300, marginBottom: "1.5rem", lineHeight: 1.7 }}>Laissez votre téléphone dans votre sac. L'appli montre Ryzer vous livre les métriques de performance essentielles au bon moment, sans latence.</p>
              <button style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", color: "#2563eb", fontWeight: 700, fontSize: "0.95rem", background: "none", border: "none", cursor: "pointer", padding: 0 }}>Voir les appareils compatibles →</button>
            </div>
            <div style={{ position: "relative", textAlign: "center" }}>
              <img src="/smartwatch-stats.png" alt="Interface montre connectée" loading="lazy" style={{ width: "100%", maxWidth: 360, margin: "0 auto", borderRadius: "1.5rem", border: "1px solid rgba(15,23,42,0.08)", boxShadow: "0 20px 60px rgba(0,0,0,0.1)" }} />
            </div>
          </div>
        </div>
      </section>

      {/* ═══ ROADMAP ═══ */}
      <section id="roadmap" style={{ padding: "5rem 0", background: "#f1f5f9", borderTop: "1px solid rgba(15,23,42,0.08)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 1.25rem" }}>
          <p style={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#2563eb", marginBottom: "0.6rem" }}>Ce qui arrive</p>
          <h2 style={{ fontSize: "clamp(1.75rem,4vw,2.75rem)", fontWeight: 900, letterSpacing: "-0.03em", marginBottom: "0.6rem", color: "#0f172a" }}>Roadmap</h2>
          <p style={{ fontSize: "1rem", color: "rgba(15,23,42,0.55)", fontWeight: 300, maxWidth: 500, marginBottom: "3rem", lineHeight: 1.7 }}>Découvrez les fonctionnalités en cours de développement et celles qui arrivent prochainement.</p>
          {roadmapLoading ? (
            <div style={{ textAlign: "center", padding: "3rem", color: "rgba(15,23,42,0.4)" }}>Chargement...</div>
          ) : roadmap.length === 0 ? (
            <div style={{ textAlign: "center", padding: "3rem", color: "rgba(15,23,42,0.4)" }}>Aucun élément pour le moment.</div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: "1rem" }}>
              {roadmap.map(item => {
                const b = BADGE[item.status] ?? BADGE.planned;
                return (
                  <div key={item.id} style={{ background: "#fff", border: "1px solid rgba(15,23,42,0.08)", borderRadius: "1.25rem", padding: "1.4rem", boxShadow: "0 2px 10px rgba(0,0,0,0.04)" }}>
                    <span style={{ display: "inline-flex", padding: "0.2rem 0.65rem", borderRadius: 999, fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "0.9rem", background: b.bg, color: b.color }}>{b.label}</span>
                    {item.quarter && <div style={{ fontSize: "0.72rem", color: "rgba(15,23,42,0.4)", marginBottom: "0.4rem" }}>{item.quarter}</div>}
                    <div style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "0.35rem", color: "#0f172a" }}>{item.title}</div>
                    {item.description && <div style={{ fontSize: "0.85rem", color: "rgba(15,23,42,0.55)", lineHeight: 1.55 }}>{item.description}</div>}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ═══ CTA ═══ */}
      <section id="cta" style={{ padding: "6rem 1.25rem", textAlign: "center", borderTop: "1px solid rgba(15,23,42,0.08)", position: "relative", overflow: "hidden", background: "#fff" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at center,rgba(37,99,235,0.05) 0%,transparent 70%)", pointerEvents: "none" }} />
        <div style={{ position: "relative", display: "inline-flex", alignItems: "center", gap: "0.5rem", background: "rgba(37,99,235,0.08)", border: "1px solid rgba(37,99,235,0.2)", borderRadius: 999, padding: "0.3rem 0.9rem", marginBottom: "1.5rem" }}>
          <span style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#2563eb" }}>Accès anticipé</span>
        </div>
        <h2 style={{ position: "relative", fontSize: "clamp(2rem,7vw,5rem)", fontWeight: 900, letterSpacing: "-0.04em", textTransform: "uppercase", lineHeight: 1, marginBottom: "1rem", color: "#0f172a" }}>SOIS PARMI<br />LES PREMIERS.</h2>
        <p style={{ position: "relative", fontSize: "1rem", color: "rgba(15,23,42,0.55)", fontWeight: 300, maxWidth: 480, margin: "0 auto 2rem", lineHeight: 1.7 }}>Ryzer est en développement actif. Laisse-nous ton email pour être notifié au lancement et accéder à la bêta en avant-première.</p>
        {waitlistStatus === "success" ? (
          <div style={{ position: "relative", display: "inline-flex", alignItems: "center", gap: "0.6rem", background: "rgba(22,163,74,0.1)", border: "1px solid rgba(22,163,74,0.3)", borderRadius: 999, padding: "1rem 2rem", color: "#16a34a", fontWeight: 700, fontSize: "1rem" }}>
            <span>✓</span> {waitlistMsg}
          </div>
        ) : (
          <form onSubmit={handleWaitlist} style={{ position: "relative", display: "flex", flexWrap: "wrap", gap: "0.75rem", justifyContent: "center", maxWidth: 460, margin: "0 auto" }}>
            <input
              type="email"
              placeholder="ton@email.com"
              value={email}
              onChange={e => { setEmail(e.target.value); setWaitlistStatus("idle"); }}
              required
              disabled={waitlistStatus === "loading"}
              style={{ flex: 1, minWidth: 200, padding: "0.875rem 1.25rem", borderRadius: 999, border: `1px solid ${waitlistStatus === "error" || waitlistStatus === "duplicate" ? "rgba(239,68,68,0.5)" : "rgba(15,23,42,0.15)"}`, fontSize: "1rem", outline: "none", fontFamily: "inherit", color: "#0f172a", background: "#fff" }}
            />
            <button
              type="submit"
              disabled={waitlistStatus === "loading"}
              style={{ background: "#2563eb", color: "#fff", fontWeight: 700, fontSize: "1rem", padding: "0.875rem 1.75rem", borderRadius: 999, border: "none", cursor: waitlistStatus === "loading" ? "wait" : "pointer", boxShadow: "0 0 30px rgba(37,99,235,0.25)", whiteSpace: "nowrap", opacity: waitlistStatus === "loading" ? 0.7 : 1 }}
            >
              {waitlistStatus === "loading" ? "..." : "Me notifier"}
            </button>
            {(waitlistStatus === "error" || waitlistStatus === "duplicate") && (
              <p style={{ width: "100%", textAlign: "center", margin: 0, fontSize: "0.85rem", color: "#ef4444" }}>{waitlistMsg}</p>
            )}
          </form>
        )}
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer style={{ background: "#fff", borderTop: "1px solid rgba(15,23,42,0.08)", padding: "3.5rem 0 2rem" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 1.25rem" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: "2rem", marginBottom: "2.5rem" }}>
            <div>
              <img src="/logo-bw.png" alt="Ryzer" style={{ height: "1.75rem", borderRadius: 10, objectFit: "contain", opacity: 0.7, marginBottom: "0.875rem" }} />
              <p style={{ fontSize: "0.8rem", color: "rgba(15,23,42,0.55)", maxWidth: 260, lineHeight: 1.6 }}>Créé par des athlètes, pour des athlètes. La référence pour les sports de montagne et de trail.</p>
            </div>
            <div>
              <h4 style={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "0.875rem", color: "#0f172a" }}>Produit</h4>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {[["#features","Fonctionnalités"],["#roadmap","Roadmap"],["#","Appareils"]].map(([href,label]) => (
                  <li key={label}><a href={href} style={{ fontSize: "0.825rem", color: "rgba(15,23,42,0.55)", textDecoration: "none" }}>{label}</a></li>
                ))}
              </ul>
            </div>
            <div>
              <h4 style={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "0.875rem", color: "#0f172a" }}>Entreprise</h4>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {[["#","À propos"],["#","Recrutement"],["/admin","Portail admin"],["#","Contact"]].map(([href,label]) => (
                  <li key={label}><a href={href} style={{ fontSize: "0.825rem", color: "rgba(15,23,42,0.55)", textDecoration: "none" }}>{label}</a></li>
                ))}
              </ul>
            </div>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "0.75rem", paddingTop: "1.5rem", borderTop: "1px solid rgba(15,23,42,0.08)", fontSize: "0.75rem", color: "rgba(15,23,42,0.4)" }}>
            <span>© {new Date().getFullYear()} Ryzer. Tous droits réservés.</span>
            <div style={{ display: "flex", gap: "1.25rem" }}>
              <a href="#" style={{ color: "rgba(15,23,42,0.4)", textDecoration: "none" }}>Confidentialité</a>
              <a href="#" style={{ color: "rgba(15,23,42,0.4)", textDecoration: "none" }}>Conditions</a>
            </div>
          </div>
        </div>
      </footer>

      {/* Responsive styles */}
      <style>{`
        html, body { background: #08090f; }
        .md-show { display: none !important; }
        .md-hide { display: flex !important; }
        @media (min-width: 768px) {
          .md-show { display: flex !important; }
          .md-hide { display: none !important; }
        }
        .stats-grid { grid-template-columns: repeat(2,1fr); }
        @media (min-width: 720px) { .stats-grid { grid-template-columns: repeat(4,1fr); } }
        .feature-row { grid-template-columns: 1fr; }
        @media (min-width: 768px) { .feature-row { grid-template-columns: 1fr 1fr; gap: 5rem !important; } }

      `}</style>
    </div>
  );
}
