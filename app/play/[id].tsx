import { useEffect, useState, useRef } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator, Platform, Animated } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Haptics from "expo-haptics";

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

  // Animation refs
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const celebrationScale = useRef(new Animated.Value(0)).current;
  const rotationAnim = useRef(new Animated.Value(0)).current;

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

      // Trigger celebration animation
      if (data.isNew) {
        Animated.spring(celebrationScale, {
          toValue: 1,
          useNativeDriver: true,
        }).start();
      }
    },
  });

  // Initial fade in
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Rotation animation for gift box
  useEffect(() => {
    if (!hasPlayed) {
      const rotationAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(rotationAnim, {
            toValue: 1,
            duration: 3000,
            useNativeDriver: true,
          }),
          Animated.timing(rotationAnim, {
            toValue: 0,
            duration: 3000,
            useNativeDriver: true,
          }),
        ])
      );
      rotationAnimation.start();

      return () => rotationAnimation.stop();
    }
  }, [hasPlayed]);

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
          className="mt-4 px-6 py-3 rounded-full"
          style={{ backgroundColor: colors.primary }}
        >
          <Text className="text-white font-semibold">Go Home</Text>
        </TouchableOpacity>
      </ScreenContainer>
    );
  }

  const rotation = rotationAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <ScreenContainer className="p-6">
      <Animated.View
        style={{ opacity: fadeAnim }}
        className="flex-1 items-center justify-between"
      >
        {/* Top Spacer */}
        <View />

        {/* Main Content */}
        <View className="items-center gap-8 flex-1 justify-center">
          {/* Gift Box Icon with Rotation */}
          {!hasPlayed && (
            <Animated.View
              style={{
                transform: [
                  { scale: scaleAnim },
                  { rotate: rotation },
                ],
              }}
            >
              <IconSymbol name="gift.fill" size={140} color={colors.primary} />
            </Animated.View>
          )}

          {/* Title */}
          <View className="items-center gap-3">
            <Text
              className="text-4xl font-black text-center"
              style={{ color: colors.foreground }}
            >
              {hasPlayed ? sound.title : "Your Surprise is Ready!"}
            </Text>
            {sound.description && hasPlayed && (
              <Text
                className="text-base text-center px-4"
                style={{ color: colors.muted }}
              >
                {sound.description}
              </Text>
            )}
          </View>

          {/* Play Button or Unlock Result */}
          {!hasPlayed ? (
            <TouchableOpacity
              onPress={handlePlay}
              disabled={!isReady}
              className="w-48 h-48 rounded-full items-center justify-center shadow-2xl"
              style={{
                backgroundColor: colors.primary,
                opacity: isReady ? 1 : 0.6,
              }}
              activeOpacity={0.9}
            >
              {!isReady ? (
                <ActivityIndicator size="large" color={colors.background} />
              ) : (
                <View className="items-center gap-3">
                  <IconSymbol name="play.circle.fill" size={80} color={colors.background} />
                  <Text
                    className="text-white text-lg font-bold"
                    style={{ color: colors.background }}
                  >
                    Tap to Play
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          ) : unlockResult ? (
            <Animated.View
              style={{
                transform: [{ scale: celebrationScale }],
              }}
              className="items-center gap-4 px-6"
            >
              {unlockResult.isNew ? (
                <>
                  <Text className="text-6xl">🎉</Text>
                  <Text
                    className="text-2xl font-black text-center"
                    style={{ color: colors.primary }}
                  >
                    New Sound Unlocked!
                  </Text>
                  <View
                    className="rounded-2xl p-6 border-2 w-full items-center"
                    style={{ borderColor: colors.primary }}
                  >
                    <Text
                      className="text-lg font-bold text-center"
                      style={{ color: colors.foreground }}
                    >
                      {sound.title}
                    </Text>
                    {sound.rarity && (
                      <View
                        className="mt-3 px-4 py-2 rounded-full"
                        style={{
                          backgroundColor:
                            sound.rarity === "legendary"
                              ? "#FFD700"
                              : sound.rarity === "rare"
                              ? colors.primary
                              : colors.muted,
                        }}
                      >
                        <Text
                          className="text-sm font-bold"
                          style={{
                            color:
                              sound.rarity === "legendary" ? "#000" : colors.background,
                          }}
                        >
                          {sound.rarity.toUpperCase()}
                        </Text>
                      </View>
                    )}
                  </View>
                </>
              ) : (
                <>
                  <Text className="text-5xl">😄</Text>
                  <Text
                    className="text-xl font-bold text-center"
                    style={{ color: colors.muted }}
                  >
                    You've heard this one before!
                  </Text>
                </>
              )}
            </Animated.View>
          ) : null}

          {audioError && (
            <Text className="text-error text-center">
              Error: {audioError}
            </Text>
          )}
        </View>

        {/* Navigation Buttons */}
        {hasPlayed && (
          <View className="flex-row gap-4 w-full">
            <TouchableOpacity
              onPress={() => router.push("/(tabs)/" as any)}
              className="flex-1 px-6 py-4 rounded-full border-2"
              style={{ borderColor: colors.primary }}
              activeOpacity={0.7}
            >
              <Text
                className="text-center font-semibold"
                style={{ color: colors.primary }}
              >
                Home
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push("/(tabs)/surprisedex" as any)}
              className="flex-1 px-6 py-4 rounded-full"
              style={{ backgroundColor: colors.primary }}
              activeOpacity={0.7}
            >
              <Text
                className="text-center font-semibold"
                style={{ color: colors.background }}
              >
                Collection
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </Animated.View>
    </ScreenContainer>
  );
}
