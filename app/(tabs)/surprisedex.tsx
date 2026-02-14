import { useState, useEffect, useRef, useCallback } from "react";
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Platform, Animated, StyleSheet } from "react-native";
import * as Haptics from "expo-haptics";

import { ScreenContainer } from "@/components/screen-container";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/use-auth";
import { useColors } from "@/hooks/use-colors";

// Simple web audio player (no hooks in render items)
let currentWebAudio: HTMLAudioElement | null = null;

function playWebAudio(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (currentWebAudio) {
      currentWebAudio.pause();
      currentWebAudio.src = "";
    }
    const audio = new Audio(url);
    currentWebAudio = audio;
    audio.play().then(resolve).catch(reject);
  });
}

function stopWebAudio() {
  if (currentWebAudio) {
    currentWebAudio.pause();
    currentWebAudio.src = "";
    currentWebAudio = null;
  }
}

function SoundCard({
  item,
  isUnlocked,
  isPlaying,
  onPlay,
  colors,
  fadeAnim,
}: {
  item: any;
  isUnlocked: boolean;
  isPlaying: boolean;
  onPlay: () => void;
  colors: any;
  fadeAnim: Animated.Value;
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    if (!isUnlocked) return;
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.95, duration: 80, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 120, useNativeDriver: true }),
    ]).start();
    onPlay();
  };

  return (
    <Animated.View
      style={[
        styles.cardWrapper,
        { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
      ]}
    >
      <TouchableOpacity
        onPress={handlePress}
        disabled={!isUnlocked}
        activeOpacity={isUnlocked ? 0.8 : 1}
        style={[
          styles.card,
          {
            backgroundColor: isUnlocked
              ? isPlaying
                ? colors.success
                : colors.primary
              : colors.surface,
            opacity: isUnlocked ? 1 : 0.5,
          },
        ]}
      >
        <View className="p-5 items-center justify-center gap-2" style={styles.cardContent}>
          {isUnlocked ? (
            <>
              <Text style={styles.emoji}>{isPlaying ? "🎵" : "🎧"}</Text>
              <Text
                className="text-center font-bold"
                style={{ color: colors.background, fontSize: 15 }}
                numberOfLines={2}
              >
                {item.title}
              </Text>
              {item.rarity && (
                <View
                  style={[
                    styles.rarityBadge,
                    {
                      backgroundColor:
                        item.rarity === "legendary"
                          ? "#FFD700"
                          : item.rarity === "rare"
                          ? "rgba(255,255,255,0.25)"
                          : "rgba(255,255,255,0.15)",
                    },
                  ]}
                >
                  <Text
                    style={{
                      fontSize: 10,
                      fontWeight: "800",
                      color: item.rarity === "legendary" ? "#000" : colors.background,
                    }}
                  >
                    {item.rarity.toUpperCase()}
                  </Text>
                </View>
              )}
            </>
          ) : (
            <>
              <Text style={styles.lockedEmoji}>❓</Text>
              <Text className="text-center font-semibold" style={{ color: colors.muted, fontSize: 14 }}>
                Locked
              </Text>
              <Text className="text-xs text-center" style={{ color: colors.muted }}>
                Arm surprises to unlock
              </Text>
            </>
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function SurpriseDexScreen() {
  const colors = useColors();
  const { isAuthenticated } = useAuth();
  const [playingUrl, setPlayingUrl] = useState<string | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (Platform.OS === "web") {
        stopWebAudio();
      }
    };
  }, []);

  const { data: unlocks, isLoading } = trpc.unlocks.list.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  const { data: allSounds } = trpc.sounds.list.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  const handlePlaySound = useCallback(async (soundUrl: string) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    if (playingUrl === soundUrl) {
      if (Platform.OS === "web") {
        stopWebAudio();
      }
      setPlayingUrl(null);
    } else {
      setPlayingUrl(soundUrl);
      if (Platform.OS === "web") {
        try {
          await playWebAudio(soundUrl);
        } catch (err) {
          console.error("Failed to play:", err);
        }
      }
    }
  }, [playingUrl]);

  if (!isAuthenticated) {
    return (
      <ScreenContainer className="items-center justify-center p-6">
        <ActivityIndicator size="large" color={colors.primary} />
        <Text className="mt-4 text-base" style={{ color: colors.muted }}>
          Loading your collection...
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

  return (
    <ScreenContainer className="p-4">
      <View className="gap-3 mb-4">
        <Text className="text-4xl font-black" style={{ color: colors.foreground }}>
          SurpriseDex
        </Text>
        <Text className="text-base" style={{ color: colors.muted }}>
          {unlockedIds.size} of {displaySounds.length} sounds unlocked
        </Text>
      </View>

      <FlatList
        data={displaySounds}
        renderItem={({ item }) => (
          <SoundCard
            item={item}
            isUnlocked={unlockedIds.has(item.id)}
            isPlaying={playingUrl === item.url}
            onPlay={() => handlePlaySound(item.url)}
            colors={colors}
            fadeAnim={fadeAnim}
          />
        )}
        keyExtractor={(item) => item.id.toString()}
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
        scrollEnabled={true}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  cardWrapper: {
    flex: 1,
    margin: 6,
    maxWidth: "50%",
  },
  card: {
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  cardContent: {
    minHeight: 160,
  },
  emoji: {
    fontSize: 36,
  },
  lockedEmoji: {
    fontSize: 40,
  },
  rarityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
    marginTop: 4,
  },
  columnWrapper: {
    justifyContent: "space-between" as const,
  },
});
