import { StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";

import SettingsShell from "../../../components/settingsShell";
import { useAuth } from "../../../context/AuthContext";
import { colors } from "../../../constants/theme";
import { Avatar, Badge, Button, Field, Panel } from "../../../components/ui/kit";

export default function SettingsPage() {
  const { user, organisation, logout } = useAuth();

  async function handleLogout() {
    await logout();
    router.replace("/");
  }

  return (
    <SettingsShell title="Account" subtitle="Your profile and session">
      <Panel>
        <View style={styles.profile}>
          <Avatar name={user?.name || user?.email} size={56} />
          <View style={styles.profileText}>
            <Text style={styles.profileName}>{user?.name || "Unnamed user"}</Text>
            <Text style={styles.profileEmail}>{user?.email}</Text>
          </View>
          {user?.role ? <Badge label={user.role.toUpperCase()} tone="primary" /> : null}
        </View>

        <View style={styles.fields}>
          <Field label="Organisation" value={organisation?.name} />
          <Field label="Role" value={user?.role ? user.role[0].toUpperCase() + user.role.slice(1) : undefined} />
        </View>
      </Panel>

      <Panel title="Session" icon="log-out-outline">
        <Text style={styles.sessionText}>Log out of Pitlane Mini on this device.</Text>
        <Button
          label="Log out"
          icon="log-out-outline"
          variant="secondary"
          onPress={handleLogout}
          style={styles.logoutButton}
        />
      </Panel>
    </SettingsShell>
  );
}

const styles = StyleSheet.create({
  profile: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },

  profileText: {
    flex: 1,
    gap: 3,
  },

  profileName: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: "800",
  },

  profileEmail: {
    color: colors.textMuted,
    fontSize: 14,
  },

  fields: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.borderDark,
  },

  sessionText: {
    color: colors.textSecondary,
    fontSize: 15,
  },

  logoutButton: {
    alignSelf: "flex-start",
    marginTop: 14,
  },
});
