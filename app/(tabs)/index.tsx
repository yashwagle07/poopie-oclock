import { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator, Platform } from "react-native";
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

  // Request notification permissions on mount
  useEffect(() => {
    if (isAuthenticated && Platform.OS !== "web") {
      requestNotificationPermissions().then(setHasNotificationPermission);
    }
  }, [isAuthenticated]);

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
      alert(`Error: ${error.message}`);
      setIsArming(false);
    },
  });

  const handleArmSurprise = async () => {
    if (!isAuthenticated) {
      alert("Please log in to arm a surprise!");
      return;
    }

    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    setIsArming(true);
    armMutation.mutate({
      minDelayMinutes: 1, // For testing: 1 minute min
      maxDelayMinutes: 5, // For testing: 5 minutes max
    });
  };

  const handleOpenDex = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push("/(tabs)/surprisedex" as any);
  };

  if (authLoading || progressLoading) {
    return (
      <ScreenContainer className="items-center justify-center">
        <ActivityIndicator size="large" color={colors.primary} />
      </ScreenContainer>
    );
  }

  const progressPercent = progress ? Math.round((progress.unlocked / progress.total) * 100) : 0;

  return (
    <ScreenContainer className="p-6">
      <View className="flex-1 justify-between">
        {/* Hero Section */}
        <View className="items-center gap-4 mt-8">
          <Text className="text-4xl font-bold text-foreground text-center">
            Surprise Sounds
          </Text>
          <Text className="text-base text-muted text-center">
            Random audio surprises just for you 💝
          </Text>
        </View>

        {/* Main Action */}
        <View className="items-center gap-8">
          {/* Arm Surprise Button */}
          <TouchableOpacity
            onPress={handleArmSurprise}
            disabled={isArming || !isAuthenticated}
            className="w-64 h-64 rounded-full items-center justify-center"
            activeOpacity={0.9}
          >
            <View className="w-full h-full rounded-full bg-primary items-center justify-center shadow-lg">
              {isArming ? (
                <ActivityIndicator size="large" color="#ffffff" />
              ) : (
                <>
                  <IconSymbol name="gift.fill" size={80} color="#ffffff" />
                  <Text className="text-white text-xl font-bold mt-4">
                    Arm a Surprise
                  </Text>
                </>
              )}
            </View>
          </TouchableOpacity>

          {/* Progress Section */}
          {isAuthenticated && progress && (
            <View className="items-center gap-3 w-full">
              <Text className="text-lg font-semibold text-foreground">
                SurpriseDex Progress
              </Text>
              
              {/* Progress Circle */}
              <View className="relative items-center justify-center">
                <View className="w-32 h-32 rounded-full border-8 border-surface items-center justify-center">
                  <Text className="text-3xl font-bold text-primary">
                    {progressPercent}%
                  </Text>
                </View>
              </View>

              <Text className="text-base text-muted">
                {progress.unlocked} of {progress.total} sounds collected
              </Text>
            </View>
          )}

          {!isAuthenticated && (
            <View className="items-center gap-2 px-6">
              <Text className="text-base text-muted text-center">
                Log in to start collecting surprise sounds!
              </Text>
            </View>
          )}
        </View>

        {/* Secondary Action */}
        <View className="items-center pb-4">
          <TouchableOpacity
            onPress={handleOpenDex}
            disabled={!isAuthenticated}
            className="flex-row items-center gap-2 px-8 py-4 rounded-full border-2 border-primary"
            activeOpacity={0.7}
          >
            <IconSymbol name="book.fill" size={24} color={colors.primary} />
            <Text className="text-primary text-lg font-semibold">
              Open SurpriseDex
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScreenContainer>
  );
}
