import { useLocalSearchParams } from 'expo-router';
import { Text, View, StyleSheet } from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";

export default function VehicleDetailPage() {
  const { id } = useLocalSearchParams();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Vehicle Detail</Text>
        <Text style={styles.text}>Vehicle ID: {id}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111827' },
  content: { padding: 24 },
  title: { color: '#fff', fontSize: 28, fontWeight: '700' },
  text: { color: '#d1d5db', marginTop: 12 },
});