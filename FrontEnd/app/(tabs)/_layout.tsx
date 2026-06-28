import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,

        tabBarStyle: {
          backgroundColor: '#1f2937',
          borderTopWidth: 0,
          height: 70,
          paddingBottom: 10,
          paddingTop: 10,
        },

        tabBarItemStyle: {
          borderRadius: 12,
          marginHorizontal: 6,
          marginVertical: 6,
        },

        tabBarActiveBackgroundColor: '#2563eb',

        tabBarActiveTintColor: '#ffffff',
        tabBarInactiveTintColor: '#9ca3af',

        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="speedometer" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="vehicles"
        options={{
          title: 'Vehicles',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="car-sport" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="drivers"
        options={{
          title: 'Drivers',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="id-card" size={size} color={color} />
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
        name="settings"
        options={{
          title: 'Settings',
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


    </Tabs>
  );
}
