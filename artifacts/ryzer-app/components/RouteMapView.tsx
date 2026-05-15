import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";

interface Props {
  coords: { latitude: number; longitude: number }[];
  height: number;
  pointCount?: number;
}

export default function RouteMapView({ height, pointCount = 0 }: Props) {
  const colors = useColors();
  return (
    <View style={[styles.placeholder, { height, backgroundColor: colors.card }]}>
      <Feather name="map" size={32} color={colors.mutedForeground} />
      <Text style={[styles.text, { color: colors.mutedForeground }]}>
        {pointCount >= 2 ? `${pointCount} points GPS enregistrés` : "Carte disponible sur mobile"}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  placeholder: { alignItems: "center", justifyContent: "center", gap: 8 },
  text: { fontSize: 12, fontWeight: "600" },
});
