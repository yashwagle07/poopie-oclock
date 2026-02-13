import { useState, useEffect, useRef } from "react";
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Platform, Animated } from "react-native";
import * as Haptics from "expo-haptics";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/use-auth";
import { useColors } from "@/hooks/use-colors";
import { useSoundPlayer } from "@/hooks/use-sound-player";

export default function SurpriseDexScreen() {
  const colors = useColors();
  const { isAuthenticated } = useAuth();
  const [playingUrl, setPlayingUrl] = useState<string | null>(null);
  const { play, pause } = useSoundPlayer(playingUrl);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Fade in animation
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  // Get unlocked sounds
  const { data: unlocks, isLoading } = trpc.unlocks.list.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  // Get all sounds
  const { data: allSounds } = trpc.sounds.list.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  const handlePlaySound = async (soundUrl: string, title: string) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    if (playingUrl === soundUrl) {
      // Stop if already playing
      pause();
      setPlayingUrl(null);
    } else {
      // Play new sound
      setPlayingUrl(soundUrl);
      await play();
    }
  };

  if (!isAuthenticated) {
    return (
      <ScreenContainer className="items-center justify-center p-6">
        <Text className="text-xl text-muted text-center">
          Please log in to view your collection!
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

  const unlockedIds = new Set(unlocks?.map((u) => u.soundId) || []);
  const displaySounds = allSounds || [];

  const renderSoundCard = ({ item, index }: { item: any; index: number }) => {
    const isUnlocked = unlockedIds.has(item.id);
    const isPlaying = playingUrl === item.url;
    const scaleAnim = useRef(new Animated.Value(1)).current;

    const handlePress = () => {
      if (isUnlocked) {
        handlePlaySound(item.url, item.title);

        // Animate press
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 0.95,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 100,
            useNativeDriver: true,
          }),
        ]).start();
      }
    };

    return (
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        }}
      >
        <TouchableOpacity
          onPress={handlePress}
          disabled={!isUnlocked}
          activeOpacity={isUnlocked ? 0.8 : 1}
          className="m-2 rounded-2xl overflow-hidden shadow-lg"
          style={{
            backgroundColor: isUnlocked ? colors.primary : colors.surface,
            opacity: isUnlocked ? 1 : 0.5,
          }}
        >
          <View className="p-6 items-center justify-center gap-3 min-h-[200px]">
            {isUnlocked ? (
              <>
                <Text className="text-4xl">
                  {isPlaying ? "🎵" : "🎧"}
                </Text>
                <Text
                  className="text-center font-bold text-lg"
                  style={{ color: colors.background }}
                  numberOfLines={2}
                >
                  {item.title}
                </Text>
                {item.rarity && (
                  <View
                    className="px-3 py-1 rounded-full mt-2"
                    style={{
                      backgroundColor:
                        item.rarity === "legendary"
                          ? "#FFD700"
                          : item.rarity === "rare"
                          ? colors.background
                          : colors.muted,
                    }}
                  >
                    <Text
                      className="text-xs font-bold"
                      style={{
                        color:
                          item.rarity === "legendary"
                            ? "#000"
                            : colors.foreground,
                      }}
                    >
                      {item.rarity.toUpperCase()}
                    </Text>
                  </View>
                )}
              </>
            ) : (
              <>
                <Text className="text-5xl">❓</Text>
                <Text
                  className="text-center font-semibold"
                  style={{ color: colors.muted }}
                >
                  Locked
                </Text>
                <Text
                  className="text-xs text-center"
                  style={{ color: colors.muted }}
                >
                  Arm surprises to unlock
                </Text>
              </>
            )}
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <ScreenContainer className="p-4">
      <View className="gap-4 mb-4">
        <Text
          className="text-4xl font-black"
          style={{ color: colors.foreground }}
        >
          SurpriseDex
        </Text>
        <Text
          className="text-base"
          style={{ color: colors.muted }}
        >
          {unlockedIds.size} of {displaySounds.length} sounds unlocked
        </Text>
      </View>

      <FlatList
        data={displaySounds}
        renderItem={renderSoundCard}
        keyExtractor={(item) => item.id.toString()}
        numColumns={2}
        columnWrapperStyle={{ justifyContent: "space-between" }}
        scrollEnabled={true}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    </ScreenContainer>
  );
}
