// hanap-medicina-mobile/app/(tabs)/index.tsx
import { useEffect, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import client from "../../src/api/client"; // Import the axios client you made

export default function LibraryScreen() {
  const [connectionStatus, setConnectionStatus] = useState(
    "Testing connection...",
  );
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    const pingServer = async () => {
      try {
        // We use the client we configured with the BaseURL
        const response = await client.get("/api/ping");

        if (response.data.success) {
          setConnectionStatus("✅ Connected to Backend!");
          setIsError(false);
        }
      } catch (error: any) {
        console.error("Ping Error:", error.message);
        setConnectionStatus(`❌ Connection Failed: ${error.message}`);
        setIsError(true);
      }
    };

    pingServer();
  }, []);

  return (
    <View className="flex-1 items-center justify-center bg-white p-6">
      <Text className="text-xl font-bold mb-4">Hanap Medicina</Text>

      <View
        className={`p-4 rounded-xl ${isError ? "bg-red-50" : "bg-green-50"}`}
      >
        <Text className={isError ? "text-red-600" : "text-green-600"}>
          {connectionStatus}
        </Text>
      </View>

      {connectionStatus.includes("Testing") && (
        <ActivityIndicator className="mt-4" />
      )}
    </View>
  );
}
