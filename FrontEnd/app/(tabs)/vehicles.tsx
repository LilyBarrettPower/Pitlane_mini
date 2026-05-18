import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function vehiclespage() {
    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <Text style={styles.title}>Vehicles</Text>
                <Text style={styles.text}>Vehicle list goes here</Text>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#111827",
    },
    content: {
        flex: 1,
        padding: 24,
    },
    title: {
        color: "#ffffff",
        fontSize: 30,
        fontWeight: "700",
        marginBottom: 12,
    },
    text: {
        color: "#d1d5db",
        fontSize: 16,
    },
});