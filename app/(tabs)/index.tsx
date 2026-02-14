import { useState, useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator, Platform, Animated, ScrollView, StyleSheet } from "react-native";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/use-auth";
import { useColors } from "@/hooks/use-colors";
import { requestNotificationPermissions, scheduleSurpriseNotification } from "@/lib/notifications";

export default function HomeScreen() {
  const router = useRouter();
  const colors = useColors();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [isArming, setIsArming] = useState(false);

  // Animation refs
  const buttonScale = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Request notification permissions on mount (native only)
  useEffect(() => {
    if (isAuthenticated && Platform.OS !== "web") {
      requestNotificationPermissions();
    }
  }, [isAuthenticated]);

  // Fade in animation on mount
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  // Pulse animation for button
  useEffect(() => {
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    );
    pulseAnimation.start();
    return () => pulseAnimation.stop();
  }, []);

  // Get unlock progress
  const progressQuery = trpc.unlocks.progress.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );
  const progress = progressQuery.data;

  // Arm surprise mutation
  const armMutation = trpc.surprises.arm.useMutation({
    onSuccess: async (data) => {
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        // Schedule local notification on native
        await scheduleSurpriseNotification(data.id, data.fireAt, data.sound.title);
        const minutes = Math.round((data.fireAt.getTime() - Date.now()) / 60000);
        alert(`Surprise armed! 🎁\n\nYou'll get a notification in about ${minutes} minutes!`);
      } else {
        // On web: navigate directly to play screen (no push notifications)
        router.push(`/play/${data.id}` as any);
      }
      setIsArming(false);
      // Refetch progress
      progressQuery.refetch();
    },
    onError: (error) => {
      console.error("[HomeScreen] Arm error:", error);
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      alert("Oops! Something went wrong. Try again! 💜");
      setIsArming(false);
    },
  });

  const handleArmSurprise = () => {
    if (!isAuthenticated) {
      // This shouldn't happen with auto-login, but just in case
      alert("Loading... please wait a moment and try again!");
      return;
    }

    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    // Animate button press
    Animated.sequence([
      Animated.timing(buttonScale, {
        toValue: 0.92,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.timing(buttonScale, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();

    setIsArming(true);
    armMutation.mutate({
      minDelayMinutes: 1,
      maxDelayMinutes: 5,
    });
  };

  if (authLoading) {
    return (
      <ScreenContainer className="items-center justify-center">
        <ActivityIndicator size="large" color={colors.primary} />
        <Text className="mt-4 text-base" style={{ color: colors.muted }}>
          Loading your surprises...
        </Text>
      </ScreenContainer>
    );
  }

  const progressPercent = progress
    ? Math.round((progress.unlocked / Math.max(progress.total, 1)) * 100)
    : 0;

  return (
    <ScreenContainer className="p-6">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        <Animated.View
          style={{ opacity: fadeAnim }}
          className="flex-1 justify-between"
        >
          {/* Header */}
          <View className="gap-2 mb-8">
            <Text
              className="text-5xl font-black"
              style={{ color: colors.foreground }}
            >
              Poopie O'clock
            </Text>
            <Text
              className="text-lg"
              style={{ color: colors.muted }}
            >
              Random audio surprises just for you 💜
            </Text>
          </View>

          {/* Main Button */}
          <View className="items-center justify-center gap-6 my-10">
            <Animated.View
              style={{
                transform: [{ scale: isArming ? buttonScale : pulseAnim }],
              }}
            >
              <TouchableOpacity
                onPress={handleArmSurprise}
                disabled={isArming}
                style={[
                  styles.giftButton,
                  {
                    backgroundColor: colors.primary,
                    opacity: isArming ? 0.7 : 1,
                  },
                ]}
                activeOpacity={0.85}
              >
                {isArming ? (
                  <View className="items-center gap-3">
                    <ActivityIndicator size="large" color={colors.background} />
                    <Text
                      className="text-base font-semibold"
                      style={{ color: colors.background }}
                    >
                      Picking a surprise...
                    </Text>
                  </View>
                ) : (
                  <View className="items-center gap-3">
                    <IconSymbol name="gift.fill" size={72} color={colors.background} />
                    <Text
                      className="text-lg font-bold text-center px-4"
                      style={{ color: colors.background }}
                    >
                      Arm a Surprise
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </Animated.View>

            {/* Status Message */}
            <Text
              className="text-center text-base"
              style={{ color: colors.muted }}
            >
              Tap the gift to get a random surprise 🎁
            </Text>
          </View>

          {/* Progress Section */}
          {isAuthenticated && progress && (
            <View className="gap-4 mb-6">
              <View className="gap-2">
                <View className="flex-row justify-between items-center">
                  <Text
                    className="text-sm font-semibold"
                    style={{ color: colors.foreground }}
                  >
                    Collection Progress
                  </Text>
                  <Text
                    className="text-sm font-bold"
                    style={{ color: colors.primary }}
                  >
                    {progress.unlocked}/{progress.total}
                  </Text>
                </View>
                <View
                  className="h-3 rounded-full overflow-hidden"
                  style={{ backgroundColor: colors.surface }}
                >
                  <View
                    className="h-full rounded-full"
                    style={{
                      backgroundColor: colors.primary,
                      width: `${progressPercent}%`,
                    }}
                  />
                </View>
                <Text
                  className="text-xs"
                  style={{ color: colors.muted }}
                >
                  {progressPercent}% collected
                </Text>
              </View>
            </View>
          )}

          {/* Open SurpriseDex Button */}
          <TouchableOpacity
            onPress={() => router.push("/(tabs)/surprisedex" as any)}
            style={[styles.dexButton, { borderColor: colors.primary }]}
            activeOpacity={0.7}
          >
            <Text
              className="text-lg font-semibold"
              style={{ color: colors.primary }}
            >
              📚 Open SurpriseDex
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  giftButton: {
    width: 220,
    height: 220,
    borderRadius: 110,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  dexButton: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 999,
    borderWidth: 2,
    alignItems: "center",
  },
});
