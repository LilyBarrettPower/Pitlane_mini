import { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { router, usePathname } from "expo-router";

type Props = {
  title: string;
  children: ReactNode;
};

export default function SettingsShell({ title, children }: Props) {
  const pathname = usePathname();

  const isUsers = pathname.includes("/settings/users");
  const isOrganisation = pathname.includes("/settings/organisation");
  const isSettingsHome = pathname.endsWith("/settings") || pathname.endsWith("/settings/");

  return (
    <View style={styles.container}>
      <View style={styles.sidebar}>
        <Text style={styles.sidebarTitle}>Settings</Text>

        <Pressable
          style={[styles.navButton, isSettingsHome && styles.navButtonActive]}
          onPress={() => router.replace("/settings")}
        >
          <Text style={[styles.navButtonText, isSettingsHome && styles.navButtonTextActive]}>
            Overview
          </Text>
        </Pressable>

        <Pressable
          style={[styles.navButton, isUsers && styles.navButtonActive]}
          onPress={() => router.replace("/settings/users")}
        >
          <Text style={[styles.navButtonText, isUsers && styles.navButtonTextActive]}>
            Users
          </Text>
        </Pressable>

        <Pressable
          style={[styles.navButton, isOrganisation && styles.navButtonActive]}
          onPress={() => router.replace("/settings/organisation")}
        >
          <Text style={[styles.navButtonText, isOrganisation && styles.navButtonTextActive]}>
            Organisation Settings
          </Text>
        </Pressable>
      </View>

      <View style={styles.main}>
        <Text style={styles.title}>{title}</Text>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#111827",
    flexDirection: "row",
  },
  sidebar: {
    width: 220,
    backgroundColor: "#10151c",
    padding: 16,
    borderRightWidth: 1,
    borderRightColor: "#374151",
  },
  sidebarTitle: {
    color: "#ffffff",
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 20,
  },
  navButton: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    marginBottom: 10,
    backgroundColor: "#111827",
  },
  navButtonActive: {
    backgroundColor: "#2563eb",
  },
  navButtonText: {
    color: "#d1d5db",
    fontSize: 15,
    fontWeight: "600",
  },
  navButtonTextActive: {
    color: "#ffffff",
  },
  main: {
    flex: 1,
    padding: 24,
  },
  title: {
    color: "#ffffff",
    fontSize: 30,
    fontWeight: "700",
    marginBottom: 20,
  },
});