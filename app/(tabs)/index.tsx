import { useState, useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator, Platform, Animated, ScrollView } from "react-native";
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
  const [hasNotificationPermission, setHasNotificationPermission] = useState(false);

  // Animation refs
  const buttonScale = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Request notification permissions on mount
  useEffect(() => {
    if (isAuthenticated && Platform.OS !== "web") {
      requestNotificationPermissions().then(setHasNotificationPermission);
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
  const { data: progress, isLoading: progressLoading } = trpc.unlocks.progress.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  // Arm surprise mutation
  const armMutation = trpc.surprises.arm.useMutation({
    onSuccess: async (data) => {
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      // Animate button press
      Animated.sequence([
        Animated.timing(buttonScale, {
          toValue: 0.95,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(buttonScale, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();

      // Schedule local notification
      if (Platform.OS !== "web") {
        await scheduleSurpriseNotification(
          data.id,
          data.fireAt,
          data.sound.title
        );
      }

      // Show success message
      const minutes = Math.round((data.fireAt.getTime() - Date.now()) / 60000);
      alert(`Surprise armed! 🎁\n\nYou'll get a notification in about ${minutes} minutes!`);
      setIsArming(false);
    },
    onError: (error) => {
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      alert("Failed to arm surprise. Please try again.");
      setIsArming(false);
    },
  });

  const handleArmSurprise = () => {
    if (!isAuthenticated) {
      alert("Please log in first!");
      return;
    }

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
          <View className="items-center justify-center gap-8 my-12">
            <Animated.View
              style={{
                transform: [{ scale: isArming ? buttonScale : pulseAnim }],
              }}
            >
              <TouchableOpacity
                onPress={handleArmSurprise}
                disabled={isArming || !isAuthenticated}
                className="w-56 h-56 rounded-full items-center justify-center shadow-2xl"
                style={{
                  backgroundColor: colors.primary,
                  opacity: isArming || !isAuthenticated ? 0.6 : 1,
                }}
                activeOpacity={0.9}
              >
                {isArming ? (
                  <ActivityIndicator size="large" color={colors.background} />
                ) : (
                  <View className="items-center gap-4">
                    <IconSymbol name="gift.fill" size={80} color={colors.background} />
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
            {!isAuthenticated ? (
              <Text
                className="text-center text-lg"
                style={{ color: colors.muted }}
              >
                Log in to start collecting surprise sounds!
              </Text>
            ) : (
              <Text
                className="text-center text-base"
                style={{ color: colors.muted }}
              >
                Tap the gift to arm a surprise 🎁
              </Text>
            )}
          </View>

          {/* Progress Section */}
          {isAuthenticated && progress && (
            <View className="gap-4 mb-4">
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
                  <Animated.View
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
            className="px-6 py-4 rounded-full border-2 items-center"
            style={{ borderColor: colors.primary }}
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
