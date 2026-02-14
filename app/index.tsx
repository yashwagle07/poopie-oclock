import { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useColors } from "@/hooks/use-colors";

const SPLASH_SEEN_KEY = "poopie_splash_seen";

export default function IndexRedirect() {
  const router = useRouter();
  const colors = useColors();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkSplash = async () => {
      try {
        const seen = await AsyncStorage.getItem(SPLASH_SEEN_KEY);
        if (!seen) {
          // First open - show splash
          await AsyncStorage.setItem(SPLASH_SEEN_KEY, "true");
          router.replace("/splash" as any);
        } else {
          // Already seen - go to tabs
          router.replace("/(tabs)/" as any);
        }
      } catch {
        // On error, just go to tabs
        router.replace("/(tabs)/" as any);
      }
      setChecking(false);
    };

    checkSplash();
  }, []);

  if (checking) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: colors.background,
        }}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return null;
}
