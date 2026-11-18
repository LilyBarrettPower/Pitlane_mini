import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "../../constants/theme";

// Height of the tab bar's content (icons + labels), not counting the
// phone's bottom safe area (home indicator), which is added on top.
const TAB_BAR_CONTENT_HEIGHT = 66;

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const bottomPadding = Math.max(insets.bottom, 8);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.backgroundDeep,
          borderTopWidth: 1,
          borderTopColor: colors.borderDark,
          height: TAB_BAR_CONTENT_HEIGHT + bottomPadding,
          paddingBottom: bottomPadding,
          paddingTop: 6,
        },

        // No vertical padding here - it squeezes the labels and clips them
        tabBarItemStyle: {
          borderRadius: 12,
          marginHorizontal: 4,
        },

        // Soft blue pill behind the active tab
        tabBarActiveBackgroundColor: colors.primarySoft,

        tabBarActiveTintColor: colors.primaryLight,
        tabBarInactiveTintColor: colors.textMuted,

        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "700",
        },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="speedometer" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="vehicles"
        options={{
          title: "Vehicles",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="car-sport" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="tyres/index"
        options={{
          title: "Tyres",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="tire" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="events/index"
        options={{
          title: "Events",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="drivers"
        options={{
          title: "Drivers",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="id-card" size={size} color={color} />
          ),
        }}
      />



      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings" size={size} color={color} />
          ),
        }}
      />




      {/* Hidden Routes: */}
      <Tabs.Screen
        name="vehicles/[id]/index"
        options={{
          href: null,
        }}
      />

      <Tabs.Screen
        name="vehicles/[id]/setups/[setupId]"
        options={{
          href: null,
        }}
      />

      <Tabs.Screen
        name="events/[id]/index"
        options={{
          href: null
        }}
      />

      <Tabs.Screen
        name="events/[id]/vehicles/[eventVehicleId]/index"
        options={{ href: null }}
      />

      <Tabs.Screen
        name="events/[id]/vehicles/[eventVehicleId]/runs/[runId]"
        options={{ href: null }}
      />

      <Tabs.Screen
        name="tyres/[tyreId]/index"
        options={{ href: null }}
      />

      <Tabs.Screen
        name="tyres/sets/[vehicleId]/[setName]"
        options={{ href: null }}
      />


    </Tabs>
  );
}
