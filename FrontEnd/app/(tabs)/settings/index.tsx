import { Text } from 'react-native';
import SettingsShell from '../../../components/settingsShell';

export default function SettingsPage() {
  return (
    <SettingsShell title="Settings">
      <Text style={{ color: '#d1d5db', fontSize: 16 }}>
        Choose a settings section from the left.
      </Text>
    </SettingsShell>
  );
}