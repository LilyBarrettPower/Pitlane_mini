import { SafeAreaView } from 'react-native-safe-area-context';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import {useAuth} from '../../context/AuthContext';
import {router} from 'expo-router';
import {useEffect} from 'react';


export default function DashboardPage() {
  const {user, organisation, logout, token, isLoading} = useAuth();


  // For development purposes only:
    useEffect(() => {
    console.log('DASHBOARD LOADED');
    console.log('TOKEN:', token);
    console.log('USER:', user);
    console.log('ORG:', organisation);
  }, [token, user, organisation]);


  useEffect(() => {
    if (!isLoading && !token) {
      router.replace('/');
    }
  }, [token, isLoading]);


  // async function handleLogout() {
  //   await logout();
  //   router.replace('/');
  // }

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.text}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!token) {
    return null;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Dashboard</Text>
        <Text style={styles.text}>User: {user?.name}</Text>
        <Text style={styles.text}>Organisation: {organisation?.name}</Text>

        {/* <Pressable style={styles.button} onPress={handleLogout}>
          <Text style={styles.buttonText}>Logout</Text>
        </Pressable> */}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    color: '#ffffff',
    fontSize: 30,
    fontWeight: '700',
    marginBottom: 12,
  },
  text: {
    color: '#d1d5db',
    fontSize: 16,
  },
  button: {
    backgroundColor: '#2563eb',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
});