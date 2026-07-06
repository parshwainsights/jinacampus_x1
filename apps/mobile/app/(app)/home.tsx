import { Link } from "expo-router";
import { Image, Pressable, Text, View } from "react-native";
import { useAuth } from "../../src/auth/auth-context";
import { ActionTile, Card, DetailRow, PageIntro, Screen, SecondaryButton, StatusBadge } from "../../src/components/ui";
import { colors, radius, shadows, spacing } from "../../src/lib/theme";
import { getRoleAwareActions } from "../../src/lib/role-actions";

export default function HomeScreen() {
  const auth = useAuth();
  const user = auth.user;
  const institutionName = user?.institution?.displayName || user?.institution?.name || "JinaCampus";
  const institutionInitial = institutionName.trim().slice(0, 1).toUpperCase() || "J";
  const roleLabels = user?.roles.map((role) => role.label).join(", ") || "No role labels available";
  const actions = getRoleAwareActions(user);

  return (
    <Screen>
      <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}>
        {user?.institution?.logoUrl ? (
          <Image
            source={{ uri: user.institution.logoUrl }}
            accessibilityLabel={`${institutionName} logo`}
            style={{ width: 58, height: 58, borderRadius: radius.lg, backgroundColor: colors.surfaceSoft, ...shadows.card }}
          />
        ) : (
          <View
            accessibilityLabel="Institution logo fallback"
            style={{
              width: 58,
              height: 58,
              alignItems: "center",
              justifyContent: "center",
              borderRadius: radius.lg,
              backgroundColor: colors.primary,
              ...shadows.button
            }}
          >
            <Text style={{ color: "#ffffff", fontSize: 24, fontWeight: "800" }}>{institutionInitial}</Text>
          </View>
        )}
        <View style={{ flex: 1 }}>
          <PageIntro title={institutionName} subtitle="JinaCampus - The Complete School OS, powered by Parshav Insights. Native v0.1 focuses on staff QR attendance and teacher attendance." />
        </View>
      </View>

      <Card elevated>
        <StatusBadge label="Secure session restored" tone="info" />
        <DetailRow label="User" value={user?.name} />
        <DetailRow label="Email" value={user?.email} />
        <DetailRow label="Roles" value={roleLabels} />
        <DetailRow label="Branch" value={user?.branch?.name} />
        <DetailRow label="Academic year" value={user?.academicYear?.name} />
      </Card>

      <View style={{ gap: spacing.sm }}>
        {actions.map((action) => {
          const content = <ActionTile label={action.label} description={action.description} disabled={action.disabled} />;

          if (!action.href || action.disabled) return <View key={action.label}>{content}</View>;

          return (
            <Link href={action.href} asChild key={action.label}>
              <Pressable>{content}</Pressable>
            </Link>
          );
        })}
      </View>

      <SecondaryButton label="Sign out" onPress={() => void auth.signOut()} />
    </Screen>
  );
}
