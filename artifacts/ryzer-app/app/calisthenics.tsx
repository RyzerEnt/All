import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router } from "expo-router";
import { useAuth } from "@clerk/expo";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";

type MCIcon = React.ComponentProps<typeof MaterialCommunityIcons>["name"];

// ─── Colors ──────────────────────────────────────────────────────────────────
const BLUE = "#2563eb";
const ORANGE = "#f97316";
const GREEN = "#22c55e";

function accentColor(a: string) {
  return a === "orange" ? ORANGE : a === "green" ? GREEN : BLUE;
}
function accentBg(a: string) {
  return a === "orange"
    ? "rgba(249,115,22,0.10)"
    : a === "green"
    ? "rgba(34,197,94,0.10)"
    : "rgba(37,99,235,0.10)";
}

// ─── 30-day cycling programme ────────────────────────────────────────────────
type DayExercise = {
  exercise: string;
  icon: string;
  sets: number;
  reps: number;
  unit: string;
  tip: string;
  color: string;
};

const PROGRAM: DayExercise[] = [
  // Week 1 — Fondation
  { exercise: "Push-ups",        icon: "arm-flex",        sets: 3, reps: 10, unit: "reps", tip: "Coudes à 45°, descends jusqu'à la poitrine",         color: BLUE   },
  { exercise: "Squats",          icon: "human",           sets: 3, reps: 15, unit: "reps", tip: "Genoux dans l'axe, descends jusqu'à 90°",             color: GREEN  },
  { exercise: "Planche",         icon: "human-handsdown", sets: 3, reps: 20, unit: "sec",  tip: "Corps aligné, abdos serrés, respire lentement",       color: ORANGE },
  { exercise: "Dips",            icon: "seat",            sets: 3, reps: 8,  unit: "reps", tip: "Coudes vers l'arrière, amplitude complète",            color: BLUE   },
  { exercise: "Fentes",          icon: "walk",            sets: 3, reps: 10, unit: "reps", tip: "Genou avant à 90°, genou arrière près du sol",         color: GREEN  },
  { exercise: "Mountain Climbers",icon:"run-fast",        sets: 3, reps: 15, unit: "reps", tip: "Hanche basse, ramène les genoux rapidement",           color: ORANGE },
  { exercise: "Récupération",    icon: "meditation",      sets: 1, reps: 10, unit: "min",  tip: "Étirements doux, respiration profonde — repos actif",  color: GREEN  },
  // Week 2 — Volume +20%
  { exercise: "Push-ups",        icon: "arm-flex",        sets: 3, reps: 12, unit: "reps", tip: "Engage bien les triceps à la montée",                  color: BLUE   },
  { exercise: "Squats sautés",   icon: "run",             sets: 3, reps: 12, unit: "reps", tip: "Explose vers le haut à chaque répétition",             color: GREEN  },
  { exercise: "Planche",         icon: "human-handsdown", sets: 3, reps: 30, unit: "sec",  tip: "Essaie la variante sur avant-bras",                    color: ORANGE },
  { exercise: "Dips",            icon: "seat",            sets: 3, reps: 10, unit: "reps", tip: "Descente contrôlée en 2 secondes",                     color: BLUE   },
  { exercise: "Fentes alternées",icon: "walk",            sets: 3, reps: 12, unit: "reps", tip: "Alterne gauche/droite sans pause entre les deux",      color: GREEN  },
  { exercise: "Burpees",         icon: "run-fast",        sets: 3, reps: 8,  unit: "reps", tip: "Push-up + saut : exercice full body",                  color: ORANGE },
  { exercise: "Récupération",    icon: "meditation",      sets: 1, reps: 10, unit: "min",  tip: "Foam rolling si disponible, hydrate-toi",              color: GREEN  },
  // Week 3 — Intensité
  { exercise: "Pike Push-ups",   icon: "arm-flex",        sets: 4, reps: 10, unit: "reps", tip: "Hanches hautes, tête vers le sol — épaules++",         color: BLUE   },
  { exercise: "Squat bulgare",   icon: "human",           sets: 3, reps: 10, unit: "reps", tip: "Pied arrière surélevé, 10 reps par jambe",             color: GREEN  },
  { exercise: "Planche latérale",icon:"human-handsdown",  sets: 2, reps: 30, unit: "sec",  tip: "30 s chaque côté, hanche vers le haut",                color: ORANGE },
  { exercise: "Dips profonds",   icon: "seat",            sets: 4, reps: 12, unit: "reps", tip: "Descends plus bas que 90° si possible",                color: BLUE   },
  { exercise: "Fentes sautées",  icon: "walk",            sets: 3, reps: 10, unit: "reps", tip: "Explose et change de jambe en l'air",                  color: GREEN  },
  { exercise: "Mtn Climbers X",  icon: "run-fast",        sets: 4, reps: 20, unit: "reps", tip: "Croise les genoux sous le corps opposé",               color: ORANGE },
  { exercise: "Récupération",    icon: "meditation",      sets: 1, reps: 15, unit: "min",  tip: "Yoga flow ou stretching actif",                        color: GREEN  },
  // Week 4 — Challenge
  { exercise: "Diamond Push-ups",icon:"arm-flex",         sets: 4, reps: 10, unit: "reps", tip: "Mains en losange, triceps au maximum",                 color: BLUE   },
  { exercise: "Pistol Squat",    icon: "human",           sets: 3, reps: 5,  unit: "reps", tip: "Squat sur une jambe, 5 reps chaque côté",              color: GREEN  },
  { exercise: "Planche 45s",     icon: "human-handsdown", sets: 4, reps: 45, unit: "sec",  tip: "Serre les fessiers, ne lâche pas",                     color: ORANGE },
  { exercise: "Dips lestés",     icon: "seat",            sets: 4, reps: 12, unit: "reps", tip: "Ajoute un sac à dos pour résistance",                  color: BLUE   },
  { exercise: "Fentes+rotation", icon: "walk",            sets: 3, reps: 12, unit: "reps", tip: "Torsion du tronc en fente basse",                      color: GREEN  },
  { exercise: "Burpees",         icon: "run-fast",        sets: 4, reps: 10, unit: "reps", tip: "Max effort, 60 s de repos entre séries",               color: ORANGE },
  { exercise: "Récupération",    icon: "meditation",      sets: 1, reps: 20, unit: "min",  tip: "Récupération complète : sommeil, nutrition",            color: GREEN  },
  // Final sprint
  { exercise: "Push-ups explosifs",icon:"arm-flex",       sets: 4, reps: 8,  unit: "reps", tip: "Décolle les mains du sol, max puissance",              color: BLUE   },
  { exercise: "Circuit final",   icon: "fire",            sets: 3, reps: 0,  unit: "",     tip: "10 PU · 15 squats · 45 s planche · 8 burpees",         color: ORANGE },
];

function getProgramIndex(dateStr: string): number {
  const [y, m, d] = dateStr.split("-").map(Number);
  const days = Math.floor(Date.UTC(y, m - 1, d) / 86400000);
  return days % PROGRAM.length;
}

function todayStr(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

// ─── Types ────────────────────────────────────────────────────────────────────
type CalisChallenge = {
  id: number;
  title: string;
  description: string;
  icon: string;
  xpReward: number;
  accent: string;
  checked: boolean;
};

// ─── API helper ───────────────────────────────────────────────────────────────
function getApiBase() {
  const domain = process.env.EXPO_PUBLIC_DOMAIN;
  return domain ? `https://${domain}` : "";
}

// ─── Animated checkable card ─────────────────────────────────────────────────
function CheckCard({
  item,
  onToggle,
}: {
  item: CalisChallenge;
  onToggle: (id: number) => void;
}) {
  const colors = useColors();
  const color = accentColor(item.accent);
  const bg = accentBg(item.accent);
  const scale = useRef(new Animated.Value(1)).current;

  function press() {
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.96, duration: 80, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1,    duration: 120, useNativeDriver: true }),
    ]).start();
    onToggle(item.id);
  }

  return (
    <Pressable onPress={press}>
      <Animated.View
        style={[
          styles.checkCard,
          {
            backgroundColor: item.checked ? bg : colors.card,
            borderColor: item.checked ? color : colors.border,
            borderWidth: item.checked ? 1.5 : 1,
            transform: [{ scale }],
          },
        ]}
      >
        {/* Checkbox */}
        <View
          style={[
            styles.checkbox,
            {
              borderColor: color,
              backgroundColor: item.checked ? color : "transparent",
            },
          ]}
        >
          {item.checked && <Feather name="check" size={12} color="#fff" />}
        </View>

        {/* Icon */}
        <View style={[styles.cardIconWrap, { backgroundColor: bg }]}>
          <MaterialCommunityIcons name={item.icon as MCIcon} size={20} color={color} />
        </View>

        {/* Content */}
        <View style={styles.checkCardBody}>
          <Text
            style={[
              styles.checkCardTitle,
              { color: colors.foreground, textDecorationLine: item.checked ? "line-through" : "none" },
            ]}
            numberOfLines={1}
          >
            {item.title}
          </Text>
          {!!item.description && (
            <Text style={[styles.checkCardDesc, { color: colors.mutedForeground }]} numberOfLines={1}>
              {item.description}
            </Text>
          )}
        </View>

        {/* XP */}
        <View style={[styles.xpBadge, { backgroundColor: bg }]}>
          <Text style={[styles.xpText, { color }]}>+{item.xpReward} XP</Text>
        </View>
      </Animated.View>
    </Pressable>
  );
}

// ─── Calendar ─────────────────────────────────────────────────────────────────
const MONTH_FR = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];
const DAY_LABELS = ["L","M","M","J","V","S","D"];

function Calendar({
  year, month,
  completedDates,
  selectedDate,
  onSelectDate,
}: {
  year: number;
  month: number;
  completedDates: Set<string>;
  selectedDate: string | null;
  onSelectDate: (d: string) => void;
}) {
  const colors = useColors();
  const today = todayStr();
  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDow = new Date(year, month - 1, 1).getDay(); // 0=Sun
  const startOffset = firstDow === 0 ? 6 : firstDow - 1; // Monday-first

  const cells: (number | null)[] = [
    ...Array(startOffset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  // Pad to complete last row
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <View>
      {/* Day headers */}
      <View style={styles.calRow}>
        {DAY_LABELS.map((l, i) => (
          <Text key={i} style={[styles.calDayLabel, { color: colors.mutedForeground }]}>{l}</Text>
        ))}
      </View>

      {/* Day cells */}
      {Array.from({ length: cells.length / 7 }, (_, row) => (
        <View key={row} style={styles.calRow}>
          {cells.slice(row * 7, row * 7 + 7).map((day, col) => {
            if (!day) return <View key={col} style={styles.calCell} />;
            const dateStr = `${year}-${String(month).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
            const isToday = dateStr === today;
            const isDone  = completedDates.has(dateStr);
            const isSelected = dateStr === selectedDate;
            const prog = PROGRAM[getProgramIndex(dateStr)];
            const isFuture = dateStr > today;

            return (
              <Pressable
                key={col}
                style={({ pressed }) => [
                  styles.calCell,
                  {
                    backgroundColor: isSelected
                      ? BLUE
                      : isToday
                      ? "rgba(37,99,235,0.12)"
                      : "transparent",
                    opacity: pressed ? 0.7 : isFuture ? 0.45 : 1,
                    borderRadius: 10,
                  },
                ]}
                onPress={() => onSelectDate(dateStr)}
              >
                <Text
                  style={[
                    styles.calDayNum,
                    {
                      color: isSelected ? "#fff" : isToday ? BLUE : colors.foreground,
                      fontWeight: isToday || isSelected ? "800" : "500",
                    },
                  ]}
                >
                  {day}
                </Text>
                {/* Exercise abbreviation */}
                <Text
                  style={[
                    styles.calExLabel,
                    { color: isSelected ? "rgba(255,255,255,0.75)" : prog.color },
                  ]}
                  numberOfLines={1}
                >
                  {prog.exercise.slice(0, 4)}
                </Text>
                {/* Completion dot */}
                {isDone && (
                  <View style={[styles.calDot, { backgroundColor: isSelected ? "#fff" : GREEN }]} />
                )}
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

// ─── Day Detail Card ──────────────────────────────────────────────────────────
function DayDetail({
  dateStr,
  completed,
  onToggle,
  toggling,
}: {
  dateStr: string;
  completed: boolean;
  onToggle: () => void;
  toggling: boolean;
}) {
  const colors = useColors();
  const prog = PROGRAM[getProgramIndex(dateStr)];
  const today = todayStr();
  const isFuture = dateStr > today;

  const [y, m, d] = dateStr.split("-").map(Number);
  const label = `${d} ${MONTH_FR[m - 1]} ${y}`;

  return (
    <View style={[styles.dayCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.dayCardHeader}>
        <View style={[styles.dayIconWrap, { backgroundColor: `${prog.color}18` }]}>
          <MaterialCommunityIcons name={prog.icon as MCIcon} size={26} color={prog.color} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.dayCardDate, { color: colors.mutedForeground }]}>{label}</Text>
          <Text style={[styles.dayCardName, { color: colors.foreground }]}>{prog.exercise}</Text>
        </View>
        {completed && (
          <View style={[styles.doneBadge, { backgroundColor: "rgba(34,197,94,0.15)" }]}>
            <Feather name="check-circle" size={14} color={GREEN} />
            <Text style={[styles.doneBadgeText, { color: GREEN }]}>Fait</Text>
          </View>
        )}
      </View>

      {/* Sets / Reps */}
      {prog.reps > 0 && (
        <View style={styles.setsRow}>
          <View style={[styles.setChip, { backgroundColor: `${prog.color}15` }]}>
            <Text style={[styles.setChipVal, { color: prog.color }]}>{prog.sets}</Text>
            <Text style={[styles.setChipLabel, { color: colors.mutedForeground }]}>séries</Text>
          </View>
          <View style={[styles.setChip, { backgroundColor: `${prog.color}15` }]}>
            <Text style={[styles.setChipVal, { color: prog.color }]}>{prog.reps}</Text>
            <Text style={[styles.setChipLabel, { color: colors.mutedForeground }]}>{prog.unit}</Text>
          </View>
        </View>
      )}
      {prog.reps === 0 && (
        <View style={styles.setsRow}>
          <View style={[styles.setChip, { backgroundColor: `${prog.color}15` }]}>
            <Text style={[styles.setChipVal, { color: prog.color }]}>{prog.sets}</Text>
            <Text style={[styles.setChipLabel, { color: colors.mutedForeground }]}>tours</Text>
          </View>
        </View>
      )}

      {/* Tip */}
      <Text style={[styles.dayTip, { color: colors.mutedForeground }]}>💡 {prog.tip}</Text>

      {/* Toggle button */}
      {!isFuture && (
        <Pressable
          onPress={onToggle}
          disabled={toggling}
          style={({ pressed }) => [
            styles.toggleBtn,
            {
              backgroundColor: completed ? "rgba(34,197,94,0.12)" : prog.color,
              borderColor: completed ? GREEN : prog.color,
              opacity: pressed || toggling ? 0.75 : 1,
            },
          ]}
        >
          {toggling ? (
            <ActivityIndicator size="small" color={completed ? GREEN : "#fff"} />
          ) : (
            <>
              <Feather
                name={completed ? "x-circle" : "check-circle"}
                size={16}
                color={completed ? GREEN : "#fff"}
              />
              <Text style={[styles.toggleBtnText, { color: completed ? GREEN : "#fff" }]}>
                {completed ? "Marquer comme non fait" : "Marquer comme fait"}
              </Text>
            </>
          )}
        </Pressable>
      )}
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function CalisthenicsScreen() {
  const colors   = useColors();
  const insets   = useSafeAreaInsets();
  const { getToken } = useAuth();
  const isWeb    = Platform.OS === "web";
  const topPad   = isWeb ? 67 : insets.top;
  const bottomPad = isWeb ? 34 : insets.bottom;

  const [tab, setTab] = useState<"defis" | "programme">("defis");

  // ── Défis state ──────────────────────────────────────────────────────────
  const [challenges, setChallenges] = useState<CalisChallenge[]>([]);
  const [defiLoading, setDefiLoading]     = useState(true);
  const [defiRefreshing, setDefiRefreshing] = useState(false);
  const [toggling, setToggling]           = useState<number | null>(null);

  // ── Programme state ───────────────────────────────────────────────────────
  const now = new Date();
  const [calMonth, setCalMonth] = useState({ year: now.getFullYear(), month: now.getMonth() + 1 });
  const [completedDates, setCompletedDates] = useState<Set<string>>(new Set());
  const [progLoading, setProgLoading]       = useState(true);
  const [progRefreshing, setProgRefreshing] = useState(false);
  const [selectedDate, setSelectedDate]     = useState<string>(todayStr());
  const [dayToggling, setDayToggling]       = useState(false);

  // ── Auth fetch ────────────────────────────────────────────────────────────
  const authFetch = useCallback(
    async (path: string, options: RequestInit = {}) => {
      const token = await getToken();
      const base  = getApiBase();
      return fetch(`${base}/api${path}`, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(options.headers ?? {}),
        },
      });
    },
    [getToken]
  );

  // ── Load défis ────────────────────────────────────────────────────────────
  const loadDefis = useCallback(async () => {
    try {
      const res = await authFetch("/me/calisthenics");
      if (res.ok) setChallenges(await res.json());
    } catch {}
    setDefiLoading(false);
  }, [authFetch]);

  // ── Toggle challenge ─────────────────────────────────────────────────────
  const toggleChallenge = useCallback(
    async (id: number) => {
      setToggling(id);
      setChallenges((prev) =>
        prev.map((c) => (c.id === id ? { ...c, checked: !c.checked } : c))
      );
      try {
        await authFetch(`/me/calisthenics/${id}/toggle`, { method: "POST" });
      } catch {
        setChallenges((prev) =>
          prev.map((c) => (c.id === id ? { ...c, checked: !c.checked } : c))
        );
      }
      setToggling(null);
    },
    [authFetch]
  );

  // ── Load programme ────────────────────────────────────────────────────────
  const loadProgramme = useCallback(
    async (year: number, month: number) => {
      try {
        const res = await authFetch(`/me/daily-program?year=${year}&month=${month}`);
        if (res.ok) {
          const { completed } = await res.json();
          setCompletedDates(new Set(completed));
        }
      } catch {}
      setProgLoading(false);
    },
    [authFetch]
  );

  // ── Toggle day ────────────────────────────────────────────────────────────
  const toggleDay = useCallback(
    async (date: string) => {
      setDayToggling(true);
      const wasCompleted = completedDates.has(date);
      setCompletedDates((prev) => {
        const next = new Set(prev);
        wasCompleted ? next.delete(date) : next.add(date);
        return next;
      });
      try {
        await authFetch("/me/daily-program/toggle", {
          method: "POST",
          body: JSON.stringify({ date }),
        });
      } catch {
        setCompletedDates((prev) => {
          const next = new Set(prev);
          wasCompleted ? next.add(date) : next.delete(date);
          return next;
        });
      }
      setDayToggling(false);
    },
    [authFetch, completedDates]
  );

  // ── Initial loads ─────────────────────────────────────────────────────────
  useEffect(() => { loadDefis(); }, []);
  useEffect(() => {
    setProgLoading(true);
    loadProgramme(calMonth.year, calMonth.month);
  }, [calMonth]);

  const totalChecked = challenges.filter((c) => c.checked).length;

  // ── Month navigation ─────────────────────────────────────────────────────
  function prevMonth() {
    setCalMonth(({ year, month }) =>
      month === 1 ? { year: year - 1, month: 12 } : { year, month: month - 1 }
    );
  }
  function nextMonth() {
    const thisYear  = now.getFullYear();
    const thisMonth = now.getMonth() + 1;
    setCalMonth(({ year, month }) => {
      if (year === thisYear && month === thisMonth) return { year, month };
      return month === 12 ? { year: year + 1, month: 1 } : { year, month: month + 1 };
    });
  }
  const isCurrentMonth =
    calMonth.year === now.getFullYear() && calMonth.month === now.getMonth() + 1;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <View
        style={[
          styles.header,
          { paddingTop: topPad + 8, backgroundColor: colors.background, borderBottomColor: colors.border },
        ]}
      >
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Callisthénie</Text>
          <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>
            Défis & programme quotidien
          </Text>
        </View>
        <View style={[styles.headerIcon, { backgroundColor: "rgba(37,99,235,0.10)" }]}>
          <MaterialCommunityIcons name="arm-flex" size={22} color={BLUE} />
        </View>
      </View>

      {/* ── Tab bar ────────────────────────────────────────────────────── */}
      <View style={[styles.tabBar, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        {(["defis", "programme"] as const).map((t) => {
          const active = tab === t;
          const label  = t === "defis" ? "Défis" : "Programme";
          return (
            <Pressable key={t} onPress={() => setTab(t)} style={styles.tabItem}>
              <Text style={[styles.tabLabel, { color: active ? BLUE : colors.mutedForeground, fontWeight: active ? "800" : "500" }]}>
                {label}
              </Text>
              {active && <View style={[styles.tabUnderline, { backgroundColor: BLUE }]} />}
            </Pressable>
          );
        })}
      </View>

      {/* ── Défis tab ──────────────────────────────────────────────────── */}
      {tab === "defis" && (
        <ScrollView
          contentContainerStyle={{ paddingTop: 16, paddingBottom: bottomPad + 80, paddingHorizontal: 20 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={defiRefreshing}
              onRefresh={async () => { setDefiRefreshing(true); await loadDefis(); setDefiRefreshing(false); }}
              tintColor={BLUE}
            />
          }
        >
          {defiLoading ? (
            <View style={styles.loader}>
              <ActivityIndicator size="large" color={BLUE} />
            </View>
          ) : challenges.length === 0 ? (
            <View style={styles.empty}>
              <MaterialCommunityIcons name="arm-flex-outline" size={52} color={colors.mutedForeground} />
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Aucun défi callisthénie</Text>
              <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>
                L'administrateur peut en ajouter depuis le portail admin.
              </Text>
            </View>
          ) : (
            <>
              {/* Progress summary */}
              <View style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.summaryRow}>
                  <View style={[styles.summaryIcon, { backgroundColor: "rgba(37,99,235,0.10)" }]}>
                    <MaterialCommunityIcons name="arm-flex" size={24} color={BLUE} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.summaryTitle, { color: colors.foreground }]}>
                      {totalChecked} / {challenges.length} défis cochés
                    </Text>
                    <Text style={[styles.summarySub, { color: colors.mutedForeground }]}>
                      Coche chaque défi une fois accompli
                    </Text>
                  </View>
                </View>
                <View style={[styles.progTrack, { backgroundColor: colors.border, marginTop: 12 }]}>
                  <View
                    style={[
                      styles.progFill,
                      {
                        width: `${challenges.length > 0 ? (totalChecked / challenges.length) * 100 : 0}%` as any,
                        backgroundColor: BLUE,
                      },
                    ]}
                  />
                </View>
              </View>

              {/* Challenge cards */}
              {challenges.map((c) => (
                <CheckCard key={c.id} item={c} onToggle={toggleChallenge} />
              ))}
            </>
          )}
        </ScrollView>
      )}

      {/* ── Programme tab ─────────────────────────────────────────────── */}
      {tab === "programme" && (
        <ScrollView
          contentContainerStyle={{ paddingTop: 16, paddingBottom: bottomPad + 80, paddingHorizontal: 20 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={progRefreshing}
              onRefresh={async () => {
                setProgRefreshing(true);
                await loadProgramme(calMonth.year, calMonth.month);
                setProgRefreshing(false);
              }}
              tintColor={BLUE}
            />
          }
        >
          {/* Intro card */}
          <View style={[styles.introCard, { backgroundColor: "rgba(37,99,235,0.07)", borderColor: "rgba(37,99,235,0.15)" }]}>
            <Feather name="calendar" size={16} color={BLUE} />
            <Text style={[styles.introText, { color: BLUE }]}>
              Un exercice différent chaque jour — programme de 30 jours en cycle continu.
            </Text>
          </View>

          {/* Month navigation */}
          <View style={styles.monthNav}>
            <Pressable onPress={prevMonth} style={styles.monthNavBtn} hitSlop={12}>
              <Feather name="chevron-left" size={20} color={colors.foreground} />
            </Pressable>
            <Text style={[styles.monthLabel, { color: colors.foreground }]}>
              {MONTH_FR[calMonth.month - 1]} {calMonth.year}
            </Text>
            <Pressable
              onPress={nextMonth}
              hitSlop={12}
              style={[styles.monthNavBtn, { opacity: isCurrentMonth ? 0.25 : 1 }]}
            >
              <Feather name="chevron-right" size={20} color={colors.foreground} />
            </Pressable>
          </View>

          {/* Calendar */}
          {progLoading ? (
            <View style={styles.loader}>
              <ActivityIndicator size="large" color={BLUE} />
            </View>
          ) : (
            <View style={[styles.calContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Calendar
                year={calMonth.year}
                month={calMonth.month}
                completedDates={completedDates}
                selectedDate={selectedDate}
                onSelectDate={setSelectedDate}
              />
            </View>
          )}

          {/* Legend */}
          <View style={styles.legend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: GREEN }]} />
              <Text style={[styles.legendLabel, { color: colors.mutedForeground }]}>Fait</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: BLUE }]} />
              <Text style={[styles.legendLabel, { color: colors.mutedForeground }]}>Aujourd'hui</Text>
            </View>
          </View>

          {/* Selected day detail */}
          {selectedDate && (
            <DayDetail
              dateStr={selectedDate}
              completed={completedDates.has(selectedDate)}
              onToggle={() => toggleDay(selectedDate)}
              toggling={dayToggling}
            />
          )}
        </ScrollView>
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1 },

  // Header
  header: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingHorizontal: 20, paddingBottom: 14,
    borderBottomWidth: 1,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: "800" },
  headerSub:   { fontSize: 11, fontWeight: "500", marginTop: 1 },
  headerIcon:  { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },

  // Tabs
  tabBar: {
    flexDirection: "row",
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  tabItem:       { flex: 1, alignItems: "center", paddingVertical: 12 },
  tabLabel:      { fontSize: 13 },
  tabUnderline:  { position: "absolute", bottom: 0, height: 2, width: "60%", borderRadius: 2 },

  // Défis
  loader: { paddingTop: 60, alignItems: "center" },
  empty:  { alignItems: "center", paddingTop: 60, gap: 10 },
  emptyTitle: { fontSize: 17, fontWeight: "800" },
  emptySub:   { fontSize: 13, textAlign: "center", lineHeight: 18 },

  summaryCard: { borderWidth: 1, borderRadius: 18, padding: 16, marginBottom: 20 },
  summaryRow:  { flexDirection: "row", alignItems: "center", gap: 14 },
  summaryIcon: { width: 46, height: 46, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  summaryTitle: { fontSize: 14, fontWeight: "800", marginBottom: 2 },
  summarySub:   { fontSize: 11, fontWeight: "500" },
  progTrack:  { height: 5, borderRadius: 999, overflow: "hidden" },
  progFill:   { height: "100%", borderRadius: 999 },

  // Check card
  checkCard: {
    flexDirection: "row", alignItems: "center",
    borderRadius: 14, padding: 12, gap: 10, marginBottom: 8,
  },
  checkbox: {
    width: 22, height: 22, borderRadius: 7, borderWidth: 1.5,
    alignItems: "center", justifyContent: "center", flexShrink: 0,
  },
  cardIconWrap: {
    width: 40, height: 40, borderRadius: 11,
    alignItems: "center", justifyContent: "center", flexShrink: 0,
  },
  checkCardBody:  { flex: 1, gap: 2 },
  checkCardTitle: { fontSize: 13, fontWeight: "700" },
  checkCardDesc:  { fontSize: 11, fontWeight: "500" },
  xpBadge:  { borderRadius: 999, paddingHorizontal: 7, paddingVertical: 3, flexShrink: 0 },
  xpText:   { fontSize: 9, fontWeight: "800", letterSpacing: 0.3 },

  // Programme
  introCard: {
    flexDirection: "row", alignItems: "center", gap: 8,
    borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 16,
  },
  introText: { flex: 1, fontSize: 12, fontWeight: "600", lineHeight: 17 },

  monthNav: {
    flexDirection: "row", alignItems: "center",
    justifyContent: "space-between", marginBottom: 12,
  },
  monthNavBtn: { padding: 6 },
  monthLabel:  { fontSize: 16, fontWeight: "800" },

  // Calendar
  calContainer: { borderWidth: 1, borderRadius: 18, padding: 12, marginBottom: 12 },
  calRow:    { flexDirection: "row" },
  calDayLabel: {
    width: `${100 / 7}%` as any,
    textAlign: "center",
    fontSize: 10, fontWeight: "700", letterSpacing: 0.5,
    paddingBottom: 8,
  },
  calCell: {
    width: `${100 / 7}%` as any,
    aspectRatio: 0.75,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 4,
    gap: 1,
  },
  calDayNum:  { fontSize: 12, fontWeight: "600" },
  calExLabel: { fontSize: 7, fontWeight: "700", letterSpacing: 0.2 },
  calDot:     { width: 4, height: 4, borderRadius: 2 },

  legend: { flexDirection: "row", gap: 16, marginBottom: 14, paddingHorizontal: 4 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  legendDot:  { width: 8, height: 8, borderRadius: 4 },
  legendLabel: { fontSize: 11, fontWeight: "500" },

  // Day detail
  dayCard: { borderWidth: 1, borderRadius: 18, padding: 16, marginBottom: 12 },
  dayCardHeader: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 14 },
  dayIconWrap: { width: 50, height: 50, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  dayCardDate: { fontSize: 11, fontWeight: "500", marginBottom: 2 },
  dayCardName: { fontSize: 17, fontWeight: "900" },
  doneBadge:   { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
  doneBadgeText: { fontSize: 11, fontWeight: "700" },

  setsRow: { flexDirection: "row", gap: 10, marginBottom: 12 },
  setChip:  { flex: 1, borderRadius: 12, padding: 12, alignItems: "center" },
  setChipVal:   { fontSize: 22, fontWeight: "900" },
  setChipLabel: { fontSize: 10, fontWeight: "600", marginTop: 2 },

  dayTip: { fontSize: 12, fontWeight: "500", lineHeight: 18, marginBottom: 14 },

  toggleBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, borderRadius: 14, paddingVertical: 14,
    borderWidth: 1.5,
  },
  toggleBtnText: { fontSize: 14, fontWeight: "800" },
});
