import { Link } from "expo-router";
import { Text, View, Pressable, StyleSheet } from "react-native";
import {useEffect} from "react";
import {router} from "expo-router";
import {useAuth} from "../context/AuthContext";
import { SafeAreaView } from "react-native-safe-area-context";
import { globalStyles } from "../constants/styles";

export default function LandingPage() {
  const {token, isLoading} = useAuth();

  useEffect(() => {
    if(!isLoading && token) {
      router.replace("/dashboard");
    }
  }, [token, isLoading]);

  if (isLoading) return null;

  
  return (
    <SafeAreaView style={globalStyles.container}>
      <View style={[globalStyles.content]}>
        <Text style={[globalStyles.title]}>Pitlane Mini</Text>

        <Text style={globalStyles.subTitle}>
          Trackside management for vehicles, runs, tyres, setups, issues, and checklists.
        </Text>

        <View style={styles.buttonGroup}>
          <Link href="/login" asChild>
            <Pressable style={globalStyles.buttonPrimary}>
              <Text style={globalStyles.buttonPrimaryText}>Login</Text>
            </Pressable>
          </Link>

          <Link href="/register" asChild>
            <Pressable style={globalStyles.buttonSecondary}>
              <Text style={globalStyles.ButtonSecondaryText}>Register Organisation</Text>
            </Pressable>
          </Link>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({

  buttonGroup: {
    gap: 12,
  },
 
});