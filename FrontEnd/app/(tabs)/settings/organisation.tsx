import { Text } from 'react-native';
import SettingsShell from '../../../components/settingsShell';
import { useAuth } from '../../../context/AuthContext';
import { globalStyles } from '../../../constants/styles';

export default function OrganisationSettingsPage() {
  const { organisation } = useAuth();

  return (
    <SettingsShell title="Organisation Settings">
      <Text style={{ color: '#ffffff', fontSize: 16, marginBottom: 12 }}>
        Organisation: {organisation?.name}
      </Text>
      <Text style={{ color: '#d1d5db', fontSize: 15 }}>
        Organisation settings form goes here.
      </Text>
    </SettingsShell>
  );
}