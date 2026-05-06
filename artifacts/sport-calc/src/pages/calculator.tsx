import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { AppLayout } from "@/components/layout";
import { DEFAULT_SPORTS, loadMultipliers, computeCalories } from "@/lib/calc-store";
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

const inputStyle: React.CSSProperties = {
  width: "100%",
  height: 52,
  background: "#fff",
  border: "1px solid rgba(15,23,42,0.15)",
  borderRadius: 10,
  padding: "0 1rem",
  fontSize: "1.1rem",
  fontWeight: 700,
  color: "#0f172a",
  outline: "none",
  fontFamily: "inherit",
  transition: "border-color 0.2s, box-shadow 0.2s",
  boxSizing: "border-box",
};

const labelStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "0.4rem",
  fontSize: "0.65rem",
  fontWeight: 700,
  letterSpacing: "0.09em",
  textTransform: "uppercase",
  color: "rgba(15,23,42,0.45)",
  marginBottom: "0.5rem",
};

function Field({ label, error, children }: { label: React.ReactNode; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      {children}
      {error && <p style={{ fontSize: "0.75rem", color: "#ef4444", marginTop: "0.3rem" }}>{error}</p>}
    </div>
  );
}

export default function CalculatorPage() {
  const [result, setResult] = React.useState<CalcResult | null>(null);
  const [focused, setFocused] = React.useState<string | null>(null);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<CalcFormValues>({
    resolver: zodResolver(calcSchema),
    defaultValues: {
      durationMinutes: 60,
      heartRateBpm: 140,
      vo2Max: 45,
      elevationGainMeters: 0,
      weightKg: 70,
    },
  });

  const sportId = Number(watch("sportId"));
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

  const focusStyle = (name: string): React.CSSProperties =>
    focused === name
      ? { ...inputStyle, borderColor: "#2563eb", boxShadow: "0 0 0 3px rgba(37,99,235,0.12)" }
      : inputStyle;

  return (
    <AppLayout>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "2.5rem 1.25rem", width: "100%" }}>

        {/* HEADER */}
        <div style={{ marginBottom: "2.5rem" }}>
          <p style={{ fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#2563eb", marginBottom: "0.5rem" }}>
            Performance
          </p>
          <h1 style={{ fontSize: "clamp(2rem,6vw,3.5rem)", fontWeight: 900, letterSpacing: "-0.035em", lineHeight: 1, textTransform: "uppercase", color: "#0f172a", margin: 0 }}>
            CALCULATEUR<br />
            <span style={{ background: "linear-gradient(90deg,#2563eb,#f97316)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              RYZER POINTS
            </span>
          </h1>
          <p style={{ fontSize: "0.95rem", color: "rgba(15,23,42,0.5)", fontWeight: 300, marginTop: "0.875rem", maxWidth: 480, lineHeight: 1.6 }}>
            Renseigne tes métriques pour obtenir tes Ryzer Points — la mesure de ta dépense d'effort.
          </p>
        </div>

        <div style={{ display: "flex", gap: "1.5rem", alignItems: "flex-start", flexWrap: "wrap" }}>

          {/* FORM */}
          <div style={{ flex: "1 1 360px", minWidth: 0 }}>
            <div style={{ background: "#fff", border: "1px solid rgba(15,23,42,0.08)", borderRadius: 20, padding: "1.75rem", boxShadow: "0 2px 16px rgba(15,23,42,0.06)" }}>

              <form onSubmit={handleSubmit(onSubmit)} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>

                {/* SPORT */}
                <Field label="Sport" error={errors.sportId?.message}>
                  <select
                    {...register("sportId")}
                    style={{
                      ...inputStyle,
                      cursor: "pointer",
                      appearance: "none",
                      WebkitAppearance: "none",
                      background: `#fff url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='rgba(15,23,42,0.4)' d='M6 8L1 3h10z'/%3E%3C/svg%3E") no-repeat right 1rem center`,
                      paddingRight: "2.5rem",
                      color: "#0f172a",
                    }}
                  >
                    <option value="" style={{ background: "#fff", color: "#0f172a" }}>— Sélectionner un sport —</option>
                    {DEFAULT_SPORTS.map((sport) => (
                      <option key={sport.id} value={sport.id.toString()} style={{ background: "#fff", color: "#0f172a" }}>
                        {sport.icon} {sport.name} — MET {sport.baseMet}
                      </option>
                    ))}
                  </select>
                </Field>

                {/* ROW 1: durée + FC */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  <Field label="⏱ Durée (min)" error={errors.durationMinutes?.message}>
                    <input
                      type="number"
                      inputMode="numeric"
                      {...register("durationMinutes")}
                      style={focusStyle("durationMinutes")}
                      onFocus={() => setFocused("durationMinutes")}
                      onBlur={() => setFocused(null)}
                    />
                  </Field>
                  <Field label="♥ FC (bpm)" error={errors.heartRateBpm?.message}>
                    <input
                      type="number"
                      inputMode="numeric"
                      {...register("heartRateBpm")}
                      style={focusStyle("heartRateBpm")}
                      onFocus={() => setFocused("heartRateBpm")}
                      onBlur={() => setFocused(null)}
                    />
                  </Field>
                </div>

                {/* ROW 2: VO2 + poids */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  <Field label="↑ VO2 Max" error={errors.vo2Max?.message}>
                    <input
                      type="number"
                      inputMode="decimal"
                      {...register("vo2Max")}
                      style={focusStyle("vo2Max")}
                      onFocus={() => setFocused("vo2Max")}
                      onBlur={() => setFocused(null)}
                    />
                  </Field>
                  <Field label="⚖ Poids (kg)" error={errors.weightKg?.message}>
                    <input
                      type="number"
                      inputMode="decimal"
                      {...register("weightKg")}
                      style={focusStyle("weightKg")}
                      onFocus={() => setFocused("weightKg")}
                      onBlur={() => setFocused(null)}
                    />
                  </Field>
                </div>

                {/* DÉNIVELÉ (conditionnel) */}
                {selectedSport?.appliesElevation && (
                  <Field label="⛰ Dénivelé (m)" error={errors.elevationGainMeters?.message}>
                    <input
                      type="number"
                      inputMode="numeric"
                      {...register("elevationGainMeters")}
                      style={{
                        ...focusStyle("elevationGainMeters"),
                        borderColor: focused === "elevationGainMeters" ? "#f97316" : "rgba(249,115,22,0.4)",
                        boxShadow: focused === "elevationGainMeters" ? "0 0 0 3px rgba(249,115,22,0.12)" : undefined,
                      }}
                      onFocus={() => setFocused("elevationGainMeters")}
                      onBlur={() => setFocused(null)}
                    />
                  </Field>
                )}

                {/* RÉSULTAT MOBILE */}
                {result && (
                  <div style={{
                    borderRadius: 16,
                    border: "1px solid rgba(37,99,235,0.2)",
                    background: "rgba(37,99,235,0.05)",
                    padding: "1.25rem",
                    textAlign: "center",
                  }}
                    className="lg-hide"
                  >
                    <div style={{ fontSize: "3.5rem", fontWeight: 900, letterSpacing: "-0.04em", color: "#0f172a", lineHeight: 1 }}>
                      {result.calories}
                    </div>
                    <div style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", marginTop: "0.5rem", background: "rgba(37,99,235,0.1)", border: "1px solid rgba(37,99,235,0.25)", borderRadius: 999, padding: "0.2rem 0.75rem" }}>
                      <span style={{ fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#2563eb" }}>Ryzer Points</span>
                    </div>
                    <div style={{ marginTop: "1rem", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", fontSize: "0.75rem", color: "rgba(15,23,42,0.45)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span>Base</span><span style={{ color: "#0f172a", fontWeight: 700 }}>{result.breakdown.base}</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span>FC ×</span><span style={{ color: "#0f172a", fontWeight: 700 }}>{result.breakdown.heartRateFactor}</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span>VO2 ×</span><span style={{ color: "#0f172a", fontWeight: 700 }}>{result.breakdown.vo2Factor}</span>
                      </div>
                      {result.breakdown.elevationBonus > 0 && (
                        <div style={{ display: "flex", justifyContent: "space-between", color: "#f97316" }}>
                          <span>Dénivelé +</span><span style={{ fontWeight: 700 }}>{result.breakdown.elevationBonus}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* CTA */}
                <button
                  type="submit"
                  style={{
                    width: "100%",
                    height: 56,
                    background: "#2563eb",
                    color: "#fff",
                    fontWeight: 800,
                    fontSize: "0.85rem",
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    border: "none",
                    borderRadius: 999,
                    cursor: "pointer",
                    boxShadow: "0 0 28px rgba(37,99,235,0.25)",
                    transition: "transform 0.15s, box-shadow 0.15s",
                    fontFamily: "inherit",
                  }}
                  onMouseOver={e => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(1.02)"; (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 0 36px rgba(37,99,235,0.4)"; }}
                  onMouseOut={e => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)"; (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 0 28px rgba(37,99,235,0.25)"; }}
                >
                  Calculer mes Ryzer Points
                </button>
              </form>
            </div>
          </div>

          {/* RÉSULTAT DESKTOP */}
          <div style={{ width: 360, flexShrink: 0 }} className="lg-show">
            <div style={{
              background: "#fff",
              border: "1px solid rgba(15,23,42,0.08)",
              borderRadius: 20,
              padding: "1.75rem",
              minHeight: 420,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              position: "relative",
              overflow: "hidden",
              boxShadow: "0 2px 16px rgba(15,23,42,0.06)",
            }}>
              {/* Glow bg */}
              <div style={{ position: "absolute", top: -60, right: -60, width: 200, height: 200, borderRadius: "50%", background: "radial-gradient(circle,rgba(37,99,235,0.06) 0%,transparent 70%)", pointerEvents: "none" }} />

              {!result ? (
                <div style={{ textAlign: "center", padding: "2rem 0" }}>
                  <div style={{ fontSize: "4rem", marginBottom: "1rem", opacity: 0.12 }}>⚡</div>
                  <p style={{ fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(15,23,42,0.2)" }}>
                    En attente
                  </p>
                  <p style={{ fontSize: "0.8rem", color: "rgba(15,23,42,0.25)", marginTop: "0.5rem" }}>
                    Lance le calcul pour voir tes Ryzer Points
                  </p>
                </div>
              ) : (
                <div style={{ position: "relative", zIndex: 1 }}>
                  <p style={{ fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#2563eb", marginBottom: "1.25rem" }}>
                    Résultat
                  </p>

                  <div style={{ textAlign: "center", marginBottom: "2rem" }}>
                    <div style={{ fontSize: "5.5rem", fontWeight: 900, letterSpacing: "-0.05em", lineHeight: 1, color: "#0f172a" }}>
                      {result.calories}
                    </div>
                    <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", marginTop: "0.75rem", background: "rgba(37,99,235,0.08)", border: "1px solid rgba(37,99,235,0.2)", borderRadius: 999, padding: "0.3rem 1rem" }}>
                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#2563eb", display: "inline-block" }} />
                      <span style={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#2563eb" }}>Ryzer Points</span>
                    </div>
                  </div>

                  <div style={{ borderTop: "1px solid rgba(15,23,42,0.07)", paddingTop: "1.25rem" }}>
                    <p style={{ fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(15,23,42,0.3)", marginBottom: "1rem" }}>
                      Détail des facteurs
                    </p>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem", fontSize: "0.82rem" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ color: "rgba(15,23,42,0.45)" }}>Base (MET × poids × temps)</span>
                        <span style={{ fontWeight: 700, color: "#0f172a" }}>{result.breakdown.base}</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ color: "rgba(15,23,42,0.45)" }}>Facteur FC</span>
                        <span style={{ fontWeight: 700, color: "#0f172a" }}>×{result.breakdown.heartRateFactor}</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ color: "rgba(15,23,42,0.45)" }}>Facteur VO2</span>
                        <span style={{ fontWeight: 700, color: "#0f172a" }}>×{result.breakdown.vo2Factor}</span>
                      </div>
                      {result.breakdown.elevationBonus > 0 && (
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ color: "#f97316" }}>Bonus dénivelé</span>
                          <span style={{ fontWeight: 700, color: "#f97316" }}>+{result.breakdown.elevationBonus}</span>
                        </div>
                      )}
                      <div style={{ borderTop: "1px solid rgba(15,23,42,0.07)", paddingTop: "0.65rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ color: "rgba(15,23,42,0.45)" }}>Durée</span>
                        <span style={{ fontWeight: 700, color: "#0f172a" }}>{result.breakdown.durationHours}h</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      <style>{`
        .lg-show { display: none; }
        .lg-hide { display: block; }
        @media (min-width: 1024px) {
          .lg-show { display: block !important; }
          .lg-hide { display: none !important; }
        }
        select option { background: #fff; color: #0f172a; }
        input[type=number]::-webkit-inner-spin-button,
        input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
        input[type=number] { -moz-appearance: textfield; }
      `}</style>
    </AppLayout>
  );
}
