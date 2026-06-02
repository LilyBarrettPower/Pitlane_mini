import { SafeAreaView } from 'react-native-safe-area-context';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import {useAuth} from '../../context/AuthContext';
import {router} from 'expo-router';
import {useEffect} from 'react';
import { globalStyles } from '../../constants/styles';


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
      <SafeAreaView style={globalStyles.container}>
        <View style={globalStyles.content}>
          <Text style={globalStyles.text}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!token) {
    return null;
  }

  return (
    <SafeAreaView style={globalStyles.container}>
      <View style={styles.content}>
        <Text style={globalStyles.title}>Dashboard</Text>
        <Text style={globalStyles.text}>User: {user?.name}</Text>
        <Text style={globalStyles.text}>Organisation: {organisation?.name}</Text>

        {/* <Pressable style={styles.button} onPress={handleLogout}>
          <Text style={styles.buttonText}>Logout</Text>
        </Pressable> */}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
});