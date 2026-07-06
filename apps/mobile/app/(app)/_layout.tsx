import { Redirect, Stack } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { useAuth } from "../../src/auth/auth-context";
import { colors } from "../../src/lib/theme";

export default function AppLayout() {
  const auth = useAuth();

  if (auth.status === "loading") {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (auth.status !== "authenticated") return <Redirect href="/login" />;

  return (
    <Stack
      screenOptions={{
        headerBackButtonDisplayMode: "minimal",
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.primary,
        headerTitleStyle: { color: colors.text, fontWeight: "800" },
        contentStyle: { backgroundColor: colors.background }
      }}
    >
      <Stack.Screen name="home" options={{ title: "Home" }} />
      <Stack.Screen name="scan-qr" options={{ title: "Scan QR" }} />
      <Stack.Screen name="teacher-attendance" options={{ title: "Student Attendance" }} />
      <Stack.Screen name="attendance-status" options={{ title: "My Attendance" }} />
    </Stack>
  );
}
