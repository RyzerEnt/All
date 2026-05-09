import { Stack } from "expo-router";
import { useColors } from "@/hooks/useColors";

export default function SessionLayout() {
  const colors = useColors();
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="sport-picker" />
      <Stack.Screen name="timer" />
      <Stack.Screen name="result" />
    </Stack>
  );
}
