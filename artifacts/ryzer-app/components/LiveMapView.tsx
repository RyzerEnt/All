import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";

interface Props {
  coords: { latitude: number; longitude: number }[];
  height: number;
}

export default function LiveMapView({ height }: Props) {
  const colors = useColors();
  return (
    <View style={[styles.placeholder, { height, backgroundColor: colors.card }]}>
      <Feather name="map" size={36} color={colors.mutedForeground} />
      <Text style={[styles.text, { color: colors.mutedForeground }]}>
        Carte disponible sur mobile
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  placeholder: { alignItems: "center", justifyContent: "center", gap: 10 },
  text: { fontSize: 13, fontWeight: "600" },
});
