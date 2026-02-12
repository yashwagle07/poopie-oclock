import { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator, Platform } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withRepeat } from "react-native-reanimated";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/use-auth";
import { useColors } from "@/hooks/use-colors";
import { useSoundPlayer } from "@/hooks/use-sound-player";

export default function PlaySurpriseScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colors = useColors();
  const { isAuthenticated } = useAuth();
  const [hasPlayed, setHasPlayed] = useState(false);
  const [unlockResult, setUnlockResult] = useState<{ isNew: boolean; message: string } | null>(null);

  // Fetch surprise details
  const { data: surprise, isLoading } = trpc.surprises.getById.useQuery(
    { id: Number(id) },
    { enabled: isAuthenticated && !!id }
  );

  // Fetch sound details
  const { data: sound } = trpc.sounds.getById.useQuery(
    { id: surprise?.soundId || 0 },
    { enabled: !!surprise?.soundId }
  );

  // Audio player
  const { play, isReady, error: audioError } = useSoundPlayer(sound?.url || null);

  // Mutations
  const markOpenedMutation = trpc.surprises.markOpened.useMutation();
  const processUnlockMutation = trpc.unlocks.processUnlock.useMutation({
    onSuccess: (data) => {
      setUnlockResult(data);
      if (data.isNew && Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    },
  });

  // Animation values
  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);

  useEffect(() => {
    // Pulsing animation for gift box
    scale.value = withRepeat(withSpring(1.1, { damping: 2 }), -1, true);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { rotate: `${rotation.value}deg` }],
  }));

  const handlePlay = async () => {
    if (!isAuthenticated || !surprise || !sound) {
      alert("Unable to play surprise");
      return;
    }

    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    // Play audio
    await play();
    setHasPlayed(true);

    // Mark surprise as opened
    if (surprise.status !== "opened") {
      markOpenedMutation.mutate({ id: surprise.id });
    }

    // Process unlock logic
    processUnlockMutation.mutate({ soundId: sound.id });
  };

  if (!isAuthenticated) {
    return (
      <ScreenContainer className="items-center justify-center p-6">
        <Text className="text-xl text-muted text-center">
          Please log in to play your surprise!
        </Text>
      </ScreenContainer>
    );
  }

  if (isLoading) {
    return (
      <ScreenContainer className="items-center justify-center">
        <ActivityIndicator size="large" color={colors.primary} />
      </ScreenContainer>
    );
  }

  if (!surprise || !sound) {
    return (
      <ScreenContainer className="items-center justify-center p-6">
        <Text className="text-xl text-muted text-center">
          Surprise not found
        </Text>
        <TouchableOpacity
          onPress={() => router.push("/(tabs)/" as any)}
          className="mt-4 px-6 py-3 rounded-full bg-primary"
        >
          <Text className="text-white font-semibold">Go Home</Text>
        </TouchableOpacity>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="p-6">
      <View className="flex-1 items-center justify-center gap-8">
        {/* Gift Box Icon */}
        {!hasPlayed && (
          <Animated.View style={animatedStyle}>
            <IconSymbol name="gift.fill" size={120} color={colors.primary} />
          </Animated.View>
        )}

        {/* Title */}
        <View className="items-center gap-2">
          <Text className="text-3xl font-bold text-foreground text-center">
            {hasPlayed ? sound.title : "Your Surprise is Ready!"}
          </Text>
          {sound.description && hasPlayed && (
            <Text className="text-base text-muted text-center px-8">
              {sound.description}
            </Text>
          )}
        </View>

        {/* Play Button */}
        {!hasPlayed ? (
          <TouchableOpacity
            onPress={handlePlay}
            disabled={!isReady}
            className="w-48 h-48 rounded-full bg-primary items-center justify-center shadow-lg"
            activeOpacity={0.9}
          >
            {!isReady ? (
              <ActivityIndicator size="large" color="#ffffff" />
            ) : (
              <>
                <IconSymbol name="play.circle.fill" size={80} color="#ffffff" />
                <Text className="text-white text-xl font-bold mt-4">
                  Tap to Play
                </Text>
              </>
            )}
          </TouchableOpacity>
        ) : (
          <>
            {/* Unlock Result */}
            {unlockResult && (
              <View className="items-center gap-4 px-6">
                {unlockResult.isNew ? (
                  <>
                    <IconSymbol name="sparkles" size={64} color="#FFD700" />
                    <Text className="text-2xl font-bold text-foreground text-center">
                      New Sound Unlocked! 🎉
                    </Text>
                    <View className="bg-surface rounded-2xl p-6 border border-border">
                      <Text className="text-lg font-semibold text-foreground text-center">
                        {sound.title}
                      </Text>
                      {sound.rarity && (
                        <View
                          className="mt-3 px-4 py-2 rounded-full self-center"
                          style={{
                            backgroundColor:
                              sound.rarity === "legendary"
                                ? "#FFD700"
                                : sound.rarity === "rare"
                                ? colors.primary
                                : colors.muted,
                          }}
                        >
                          <Text className="text-sm font-semibold text-white">
                            {sound.rarity.toUpperCase()}
                          </Text>
                        </View>
                      )}
                    </View>
                  </>
                ) : (
                  <>
                    <IconSymbol name="checkmark.circle.fill" size={64} color={colors.muted} />
                    <Text className="text-xl font-semibold text-muted text-center">
                      You've heard this one before!
                    </Text>
                  </>
                )}
              </View>
            )}

            {/* Navigation Buttons */}
            <View className="flex-row gap-4 mt-4">
              <TouchableOpacity
                onPress={() => router.push("/(tabs)/" as any)}
                className="px-6 py-3 rounded-full border-2 border-primary"
                activeOpacity={0.7}
              >
                <Text className="text-primary font-semibold">Home</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => router.push("/(tabs)/surprisedex" as any)}
                className="px-6 py-3 rounded-full bg-primary"
                activeOpacity={0.7}
              >
                <Text className="text-white font-semibold">View Collection</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {audioError && (
          <Text className="text-error text-center mt-4">
            Error: {audioError}
          </Text>
        )}
      </View>
    </ScreenContainer>
  );
}
