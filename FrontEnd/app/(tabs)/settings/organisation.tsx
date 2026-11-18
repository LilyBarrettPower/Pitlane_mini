import { StyleSheet, Text, View } from "react-native";

import SettingsShell from "../../../components/settingsShell";
import { useAuth } from "../../../context/AuthContext";
import { colors } from "../../../constants/theme";
import { Field, Panel } from "../../../components/ui/kit";

export default function OrganisationSettingsPage() {
  const { organisation } = useAuth();

  return (
    <SettingsShell title="Organisation" subtitle="Details about your team">
      <Panel title="Details" icon="business-outline">
        <View style={styles.fields}>
          <Field label="Organisation name" value={organisation?.name} />
        </View>
      </Panel>

      <Panel title="Coming soon" icon="construct-outline">
        <Text style={styles.muted}>
          Organisation settings such as team logo, units and defaults will live here.
        </Text>
      </Panel>
    </SettingsShell>
  );
}

const styles = StyleSheet.create({
  fields: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },

  muted: {
    color: colors.textMuted,
    fontSize: 15,
  },
});
