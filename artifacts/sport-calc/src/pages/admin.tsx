import React from "react";
import { AppLayout } from "@/components/layout";
import {
  DEFAULT_SPORTS,
  loadMultipliers,
  saveMultipliers,
  resetMultipliers,
  type Multiplier,
} from "@/lib/calc-store";
import { useToast } from "@/hooks/use-toast";

function MultiplierCard({
  multiplier,
  onChange,
}: {
  multiplier: Multiplier;
  onChange: (key: string, value: number) => void;
}) {
  const [val, setVal] = React.useState(multiplier.value.toString());
  const [focused, setFocused] = React.useState(false);

  React.useEffect(() => {
    setVal(multiplier.value.toString());
  }, [multiplier.value]);

  const handleBlur = () => {
    setFocused(false);
    const num = parseFloat(val);
    if (!isNaN(num) && num >= multiplier.min && num <= multiplier.max) {
      onChange(multiplier.key, num);
    } else {
      setVal(multiplier.value.toString());
    }
  };

  return (
    <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem", marginBottom: "0.75rem" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#fff" }}>{multiplier.label}</div>
          <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.4)", marginTop: "0.2rem", lineHeight: 1.4 }}>{multiplier.description}</div>
        </div>
        <div style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.3)", flexShrink: 0, marginTop: "0.25rem", fontFamily: "ui-monospace, monospace" }}>
          [{multiplier.min} – {multiplier.max}]
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
        <input
          type="number"
          step={multiplier.step}
          inputMode="decimal"
          min={multiplier.min}
          max={multiplier.max}
          value={val}
          onChange={(e) => setVal(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={handleBlur}
          style={{
            flex: 1,
            height: 46,
            background: "rgba(255,255,255,0.05)",
            border: focused ? "1px solid rgba(37,99,235,0.6)" : "1px solid rgba(255,255,255,0.1)",
            boxShadow: focused ? "0 0 0 3px rgba(37,99,235,0.12)" : "none",
            borderRadius: 10,
            padding: "0 0.875rem",
            fontSize: "1rem",
            fontWeight: 700,
            color: "#fff",
            textAlign: "right",
            outline: "none",
            fontFamily: "ui-monospace, monospace",
            transition: "border-color 0.2s, box-shadow 0.2s",
          }}
        />
        <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.35)", flexShrink: 0, minWidth: 70, textAlign: "right", fontFamily: "ui-monospace, monospace" }}>
          {multiplier.unit}
        </span>
      </div>
    </div>
  );
}

const statCard = (icon: string, label: string, value: string | number) => (
  <div key={label} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: "1.25rem" }}>
    <div style={{ fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)", marginBottom: "0.6rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
      <span>{icon}</span> {label}
    </div>
    <div style={{ fontSize: "2.25rem", fontWeight: 900, letterSpacing: "-0.03em", color: "#2563eb", lineHeight: 1 }}>{value}</div>
  </div>
);

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

  const avgMet = (DEFAULT_SPORTS.reduce((s, sp) => s + sp.baseMet, 0) / DEFAULT_SPORTS.length).toFixed(1);

  return (
    <AppLayout>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "2.5rem 1.25rem", width: "100%", display: "flex", flexDirection: "column", gap: "2rem" }}>

        {/* HEADER */}
        <div>
          <p style={{ fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#2563eb", marginBottom: "0.5rem" }}>
            Configuration
          </p>
          <h1 style={{ fontSize: "clamp(1.75rem,5vw,2.75rem)", fontWeight: 900, letterSpacing: "-0.035em", textTransform: "uppercase", color: "#fff", margin: 0, lineHeight: 1.1 }}>
            PANNEAU ADMIN
          </h1>
          <p style={{ fontSize: "0.9rem", color: "rgba(255,255,255,0.4)", fontWeight: 300, marginTop: "0.6rem" }}>
            Ajuste les multiplicateurs de calcul des Ryzer Points.
          </p>
        </div>

        {/* STATS */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem" }}>
          {statCard("🏅", "Sports", DEFAULT_SPORTS.length)}
          {statCard("⚙️", "Params", multipliers.length)}
          {statCard("📊", "MET moy.", avgMet)}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "1.5rem" }} className="admin-grid">

          {/* SPORTS LIST */}
          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, overflow: "hidden" }}>
            <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.02)" }}>
              <h2 style={{ fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#fff", margin: 0 }}>Sports disponibles</h2>
              <p style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.3)", margin: "0.2rem 0 0" }}>Liste fixe — modifiable dans le code source</p>
            </div>
            <div>
              {DEFAULT_SPORTS.map((sport) => (
                <div key={sport.id} style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "0.875rem 1.25rem", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                  <span style={{ fontSize: "1.75rem", flexShrink: 0 }}>{sport.icon}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "0.875rem", fontWeight: 600, color: "#fff" }}>{sport.name}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.2rem" }}>
                      <span style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.35)", fontFamily: "ui-monospace, monospace" }}>MET {sport.baseMet}</span>
                      {sport.appliesElevation && (
                        <span style={{ fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "#f97316", background: "rgba(249,115,22,0.12)", border: "1px solid rgba(249,115,22,0.25)", borderRadius: 999, padding: "0.1rem 0.5rem" }}>
                          dénivelé
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* MULTIPLIERS */}
          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, overflow: "hidden" }}>
            <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.02)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <h2 style={{ fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#fff", margin: 0 }}>Multiplicateurs</h2>
                <p style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.3)", margin: "0.2rem 0 0" }}>Sauvegardés dans votre navigateur</p>
              </div>
              <button
                onClick={handleReset}
                style={{
                  display: "flex", alignItems: "center", gap: "0.4rem",
                  padding: "0.45rem 1rem",
                  borderRadius: 999,
                  border: "1px solid rgba(255,255,255,0.12)",
                  background: "transparent",
                  color: "rgba(255,255,255,0.5)",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  transition: "all 0.2s",
                }}
                onMouseOver={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.25)"; (e.currentTarget as HTMLButtonElement).style.color = "#fff"; }}
                onMouseOut={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.12)"; (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.5)"; }}
              >
                ↺ Reset
              </button>
            </div>
            <div>
              {multipliers.map((m) => (
                <MultiplierCard key={m.key} multiplier={m} onChange={handleChange} />
              ))}
            </div>
          </div>

        </div>
      </div>

      <style>{`
        @media (min-width: 1024px) {
          .admin-grid { grid-template-columns: 1fr 1fr !important; }
        }
        input[type=number]::-webkit-inner-spin-button,
        input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
        input[type=number] { -moz-appearance: textfield; }
      `}</style>
    </AppLayout>
  );
}
