import { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { router, usePathname } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { colors } from "../constants/theme";
import { IconName, PageHeader, Screen, useIsWide } from "./ui/kit";

type Props = {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
};

const NAV_ITEMS: { label: string; href: string; icon: IconName; match: (path: string) => boolean }[] = [
  {
    label: "Account",
    href: "/settings",
    icon: "person-circle-outline",
    match: (path) => path.endsWith("/settings") || path.endsWith("/settings/"),
  },
  {
    label: "Users",
    href: "/settings/users",
    icon: "people-outline",
    match: (path) => path.includes("/settings/users"),
  },
  {
    label: "Tracks",
    href: "/settings/tracks",
    icon: "flag-outline",
    match: (path) => path.includes("/settings/tracks"),
  },
  {
    label: "Organisation",
    href: "/settings/organisation",
    icon: "business-outline",
    match: (path) => path.includes("/settings/organisation"),
  },
];

// Settings pages: sidebar navigation on wide screens, pill tabs on phones
export default function SettingsShell({ title, subtitle, actions, children }: Props) {
  const pathname = usePathname();
  const isWide = useIsWide();

  const nav = (
    <View style={isWide ? styles.sidebar : styles.pills}>
      {NAV_ITEMS.map((item) => {
        const active = item.match(pathname);

        return (
          <Pressable
            key={item.href}
            style={({ pressed }) => [
              isWide ? styles.navItem : styles.pill,
              active && styles.navItemActive,
              pressed && styles.pressed,
            ]}
            onPress={() => router.replace(item.href as any)}
          >
            <Ionicons
              name={item.icon}
              size={18}
              color={active ? colors.primaryLight : colors.textMuted}
            />
            <Text style={[styles.navText, active && styles.navTextActive]}>{item.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );

  return (
    <Screen>
      <PageHeader eyebrow="Settings" title={title} subtitle={subtitle} actions={actions} />

      {isWide ? (
        <View style={styles.wideLayout}>
          {nav}
          <View style={styles.main}>{children}</View>
        </View>
      ) : (
        <>
          {nav}
          <View style={styles.main}>{children}</View>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  pressed: {
    opacity: 0.8,
  },

  wideLayout: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 24,
  },

  sidebar: {
    width: 220,
    gap: 4,
    backgroundColor: colors.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.borderDark,
    padding: 8,
  },

  navItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderRadius: 12,
  },

  pills: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.borderDark,
  },

  navItemActive: {
    backgroundColor: colors.primarySoft,
    borderColor: "transparent",
  },

  navText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: "600",
  },

  navTextActive: {
    color: colors.textPrimary,
    fontWeight: "700",
  },

  main: {
    flex: 1,
    gap: 16,
  },
});
