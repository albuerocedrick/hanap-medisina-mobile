import { SafeAreaView, Text, View } from "react-native";

export default function HistoryScreen() {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="p-6">
        <Text className="text-3xl font-bold text-slate-800">History</Text>
        <Text className="text-slate-500 mt-2">Browse healing plants.</Text>
      </View>
    </SafeAreaView>
  );
}
