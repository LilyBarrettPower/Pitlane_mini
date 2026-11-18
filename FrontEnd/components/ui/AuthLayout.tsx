// Shared layout for the landing, login and register pages:
// brand mark at the top, then a centred card.

import { ReactNode } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { colors, spacing } from "../../constants/theme";

export default function AuthLayout({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.column}>
            <View style={styles.brand}>
              <View style={styles.brandMark}>
                <Ionicons name="speedometer" size={22} color="#ffffff" />
              </View>
              <Text style={styles.brandName}>Pitlane Mini</Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.title}>{title}</Text>
              {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}

              <View style={styles.body}>{children}</View>
            </View>

            {footer ? <View style={styles.footer}>{footer}</View> : null}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },

  screen: {
    flex: 1,
    backgroundColor: colors.backgroundDeep,
  },

  scroll: {
    flexGrow: 1,
    justifyContent: "center",
    padding: spacing.lg,
  },

  column: {
    width: "100%",
    maxWidth: 440,
    alignSelf: "center",
    gap: 24,
  },

  brand: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },

  brandMark: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },

  brandName: {
    color: colors.textPrimary,
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: 0.3,
  },

  card: {
    backgroundColor: colors.card,
    borderRadius: spacing.radiusModal,
    borderWidth: 1,
    borderColor: colors.borderDark,
    padding: 28,
  },

  title: {
    color: colors.textPrimary,
    fontSize: 24,
    fontWeight: "800",
  },

  subtitle: {
    color: colors.textMuted,
    fontSize: 15,
    marginTop: 6,
  },

  body: {
    marginTop: 24,
    gap: 16,
  },

  footer: {
    alignItems: "center",
  },
});
