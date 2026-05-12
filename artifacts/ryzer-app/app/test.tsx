import React from "react";
import { View, Text, StyleSheet, ScrollView, Platform } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Link } from "expo-router";

type CheckItem = {
  label: string;
  status: "ok" | "warn";
  detail?: string;
};

function Check({ item }: { item: CheckItem }) {
  return (
    <View style={styles.checkRow}>
      <Feather
        name={item.status === "ok" ? "check-circle" : "alert-circle"}
        size={20}
        color={item.status === "ok" ? "#22c55e" : "#f59e0b"}
      />
      <View style={{ flex: 1, marginLeft: 10 }}>
        <Text style={styles.checkLabel}>{item.label}</Text>
        {item.detail ? (
          <Text style={styles.checkDetail}>{item.detail}</Text>
        ) : null}
      </View>
    </View>
  );
}

export default function TestScreen() {
  const checks: CheckItem[] = [
    { label: "Metro bundler", status: "ok", detail: "Ce fichier charge → Metro fonctionne" },
    { label: "expo-router", status: "ok", detail: "Navigation vers /test réussie" },
    { label: "React Native Web", status: "ok", detail: `Platform.OS = "${Platform.OS}"` },
    { label: "@expo/vector-icons", status: "ok", detail: "Feather icons chargés" },
    {
      label: "EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY",
      status: process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ? "ok" : "warn",
      detail: process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY
        ? "Défini ✓"
        : "Non défini — Clerk ne fonctionnera pas",
    },
    {
      label: "EXPO_PUBLIC_DOMAIN",
      status: process.env.EXPO_PUBLIC_DOMAIN ? "ok" : "warn",
      detail: process.env.EXPO_PUBLIC_DOMAIN ?? "Non défini",
    },
  ];

  const allOk = checks.every((c) => c.status === "ok");

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={[styles.badge, { backgroundColor: allOk ? "#dcfce7" : "#fef9c3" }]}>
        <Feather
          name={allOk ? "check-circle" : "alert-circle"}
          size={40}
          color={allOk ? "#16a34a" : "#ca8a04"}
        />
        <Text style={[styles.badgeText, { color: allOk ? "#16a34a" : "#ca8a04" }]}>
          {allOk ? "Expo fonctionne !" : "Expo fonctionne (avec avertissements)"}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Diagnostics</Text>
        {checks.map((c) => (
          <Check key={c.label} item={c} />
        ))}
      </View>

      <Link href="/" style={styles.link}>
        <Text style={styles.linkText}>← Retour à l'app principale</Text>
      </Link>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#f1f5f9",
    gap: 20,
  },
  badge: {
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    borderRadius: 16,
    gap: 12,
    width: "100%",
    maxWidth: 480,
  },
  badgeText: {
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 20,
    width: "100%",
    maxWidth: 480,
    gap: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 4,
  },
  checkRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  checkLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0f172a",
  },
  checkDetail: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 2,
  },
  link: {
    marginTop: 8,
  },
  linkText: {
    fontSize: 14,
    color: "#2563eb",
    fontWeight: "600",
  },
});
