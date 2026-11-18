import { useEffect } from "react";
import { router } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { useAuth } from "../context/AuthContext";
import AuthLayout from "../components/ui/AuthLayout";
import { Button, IconName } from "../components/ui/kit";
import { colors } from "../constants/theme";

const FEATURES: { icon: IconName; text: string }[] = [
  { icon: "stopwatch-outline", text: "Runs, lap times and fuel" },
  { icon: "disc-outline", text: "Tyre sets, pressures and mileage" },
  { icon: "construct-outline", text: "Setups and vehicle history" },
];

export default function LandingPage() {
  const { token, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && token) {
      router.replace("/dashboard");
    }
  }, [token, isLoading]);

  if (isLoading) return null;

  return (
    <AuthLayout
      title="Trackside, sorted."
      subtitle="Manage your team's vehicles, runs, tyres and setups in one place."
    >
      <View style={styles.features}>
        {FEATURES.map((feature) => (
          <View key={feature.text} style={styles.feature}>
            <View style={styles.featureIcon}>
              <Ionicons name={feature.icon} size={16} color={colors.primaryLight} />
            </View>
            <Text style={styles.featureText}>{feature.text}</Text>
          </View>
        ))}
      </View>

      <Button label="Log in" onPress={() => router.push("/login")} />
      <Button
        label="Register your organisation"
        variant="secondary"
        onPress={() => router.push("/register")}
      />
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  features: {
    gap: 12,
    marginBottom: 8,
  },

  feature: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  featureIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },

  featureText: {
    color: colors.textSecondary,
    fontSize: 15,
  },
});
