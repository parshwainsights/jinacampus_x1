import { useState, type PropsWithChildren, type ReactNode } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { colors, radius, shadows, spacing, typography } from "../lib/theme";

export function Screen({ children }: PropsWithChildren) {
  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ padding: spacing.lg, gap: spacing.md, backgroundColor: colors.background }}
      keyboardShouldPersistTaps="handled"
    >
      {children}
    </ScrollView>
  );
}

export function Card({ children, elevated = false }: PropsWithChildren<{ elevated?: boolean }>) {
  return (
    <View
      style={{
        gap: spacing.sm,
        borderRadius: radius.xl,
        borderWidth: 1,
        borderColor: "rgba(226, 232, 240, 0.86)",
        backgroundColor: colors.surfaceGlass,
        padding: spacing.lg,
        ...(elevated ? shadows.elevated : shadows.card)
      }}
    >
      {children}
    </View>
  );
}

export function PageIntro({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View style={{ gap: spacing.xs, paddingVertical: spacing.xs }}>
      <Text selectable style={{ color: colors.text, fontSize: typography.title, fontWeight: "800", letterSpacing: 0 }}>
        {title}
      </Text>
      {subtitle ? (
        <Text selectable style={{ color: colors.muted, fontSize: typography.body, lineHeight: 22 }}>
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}

export function Field({
  label,
  value,
  onChangeText,
  secureTextEntry,
  autoCapitalize = "none",
  keyboardType = "default",
  placeholder
}: {
  label: string;
  value: string;
  onChangeText(value: string): void;
  secureTextEntry?: boolean;
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  keyboardType?: "default" | "email-address";
  placeholder?: string;
}) {
  return (
    <View style={{ gap: spacing.xs }}>
      <Text style={{ color: colors.text, fontSize: 14, fontWeight: "600" }}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        accessibilityLabel={label}
        secureTextEntry={secureTextEntry}
        autoCapitalize={autoCapitalize}
        keyboardType={keyboardType}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        style={{
          minHeight: 50,
          borderRadius: radius.md,
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.surfaceGlass,
          paddingHorizontal: spacing.md,
          color: colors.text,
          fontSize: 16
        }}
      />
    </View>
  );
}

export function PasswordField({
  label,
  value,
  onChangeText,
  placeholder
}: {
  label: string;
  value: string;
  onChangeText(value: string): void;
  placeholder?: string;
}) {
  const [visible, setVisible] = useState(false);
  const toggleLabel = visible ? "Hide password" : "Show password";

  return (
    <View style={{ gap: spacing.xs }}>
      <Text style={{ color: colors.text, fontSize: 14, fontWeight: "700" }}>{label}</Text>
      <View
        style={{
          minHeight: 50,
          flexDirection: "row",
          alignItems: "center",
          borderRadius: radius.md,
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.surfaceGlass,
          overflow: "hidden"
        }}
      >
        <TextInput
          value={value}
          onChangeText={onChangeText}
          accessibilityLabel={label}
          secureTextEntry={!visible}
          autoCapitalize="none"
          placeholder={placeholder}
          placeholderTextColor={colors.muted}
          style={{ flex: 1, minHeight: 50, paddingHorizontal: spacing.md, color: colors.text, fontSize: 16 }}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={toggleLabel}
          onPress={() => setVisible((current) => !current)}
          style={({ pressed }) => ({
            minHeight: 50,
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: spacing.md,
            backgroundColor: pressed ? colors.primarySoft : "transparent"
          })}
        >
          <Text style={{ color: colors.primary, fontSize: 13, fontWeight: "800" }}>{visible ? "Hide" : "Show"}</Text>
        </Pressable>
      </View>
    </View>
  );
}

export function PrimaryButton({
  label,
  onPress,
  disabled,
  loading
}: {
  label: string;
  onPress(): void;
  disabled?: boolean;
  loading?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => ({
        minHeight: 50,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: radius.md,
        backgroundColor: disabled || loading ? colors.disabled : pressed ? colors.primaryDark : colors.primary,
        paddingHorizontal: spacing.lg,
        ...(disabled || loading ? {} : shadows.button)
      })}
    >
      {loading ? (
        <ActivityIndicator color="#ffffff" />
      ) : (
        <Text style={{ color: "#ffffff", fontSize: 16, fontWeight: "700" }}>{label}</Text>
      )}
    </Pressable>
  );
}

export function SecondaryButton({ label, onPress }: { label: string; onPress(): void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => ({
        minHeight: 48,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: pressed ? colors.primarySoft : colors.surfaceGlass,
        paddingHorizontal: spacing.lg
      })}
    >
      <Text style={{ color: colors.text, fontSize: 15, fontWeight: "700" }}>{label}</Text>
    </Pressable>
  );
}

export function Message({ tone = "info", children }: PropsWithChildren<{ tone?: "info" | "error" | "success" | "warning" }>) {
  const palette = tone === "error"
    ? { background: colors.dangerSoft, color: colors.danger, border: "#fecaca" }
    : tone === "success"
      ? { background: colors.successSoft, color: colors.success, border: "#bbf7d0" }
      : tone === "warning"
        ? { background: colors.warningSoft, color: colors.warning, border: "#fde68a" }
        : { background: colors.accentSoft, color: colors.primaryDark, border: "#bae6fd" };

  return (
    <View style={{ borderWidth: 1, borderColor: palette.border, backgroundColor: palette.background, borderRadius: radius.md, padding: spacing.md }}>
      <Text selectable style={{ color: palette.color, fontSize: 14, lineHeight: 20 }}>
        {children}
      </Text>
    </View>
  );
}

export function DetailRow({ label, value }: { label: string; value?: ReactNode }) {
  return (
    <View style={{ gap: 3, borderRadius: radius.md, backgroundColor: colors.surfaceSoft, padding: spacing.md }}>
      <Text style={{ color: colors.muted, fontSize: 12, fontWeight: "800", textTransform: "uppercase" }}>{label}</Text>
      <Text selectable style={{ color: colors.text, fontSize: 16, fontWeight: "600" }}>
        {value ?? "Not available"}
      </Text>
    </View>
  );
}

export function StatusBadge({ label, tone = "info" }: { label: string; tone?: "info" | "success" | "warning" | "error" }) {
  const palette = tone === "success"
    ? { background: colors.successSoft, color: colors.success, border: "#bbf7d0" }
    : tone === "warning"
      ? { background: colors.warningSoft, color: colors.warning, border: "#fde68a" }
      : tone === "error"
        ? { background: colors.dangerSoft, color: colors.danger, border: "#fecaca" }
        : { background: colors.primarySoft, color: colors.primary, border: "#c7d2fe" };

  return (
    <View style={{ alignSelf: "flex-start", borderRadius: radius.pill, borderWidth: 1, borderColor: palette.border, backgroundColor: palette.background, paddingHorizontal: spacing.md, paddingVertical: spacing.xs }}>
      <Text style={{ color: palette.color, fontSize: 12, fontWeight: "800" }}>{label}</Text>
    </View>
  );
}

export function ActionTile({ label, description, disabled = false }: { label: string; description: string; disabled?: boolean }) {
  return (
    <View
      style={{
        minHeight: 92,
        gap: spacing.xs,
        borderRadius: radius.xl,
        borderWidth: 1,
        borderColor: disabled ? colors.border : "#c7d2fe",
        backgroundColor: disabled ? colors.surfaceSoft : colors.surfaceGlass,
        padding: spacing.lg,
        ...shadows.card
      }}
    >
      <StatusBadge label={disabled ? "Web admin" : "Available"} tone={disabled ? "warning" : "success"} />
      <Text selectable style={{ color: colors.text, fontSize: 17, fontWeight: "800" }}>
        {label}
      </Text>
      <Text selectable style={{ color: colors.muted, fontSize: 14, lineHeight: 20 }}>
        {description}
      </Text>
    </View>
  );
}
