import { useState } from "react";
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Platform } from "react-native";
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

  // Get unlocked sounds
  const { data: unlocks, isLoading } = trpc.unlocks.list.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  // Get progress
  const { data: progress } = trpc.unlocks.progress.useQuery(
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
          Log in to view your SurpriseDex!
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

  return (
    <ScreenContainer className="p-6">
      {/* Header */}
      <View className="mb-6">
        <Text className="text-3xl font-bold text-foreground text-center">
          SurpriseDex
        </Text>
        {progress && (
          <Text className="text-base text-muted text-center mt-2">
            {progress.unlocked} of {progress.total} collected
          </Text>
        )}
      </View>

      {/* Unlocked Sounds List */}
      {unlocks && unlocks.length > 0 ? (
        <FlatList
          data={unlocks}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ paddingBottom: 20 }}
          renderItem={({ item }) => (
            <View className="bg-surface rounded-2xl p-4 mb-4 border border-border">
              <View className="flex-row items-center justify-between">
                <View className="flex-1 mr-4">
                  <Text className="text-lg font-semibold text-foreground">
                    {item.sound?.title || "Unknown Sound"}
                  </Text>
                  {item.sound?.description && (
                    <Text className="text-sm text-muted mt-1">
                      {item.sound.description}
                    </Text>
                  )}
                  <View className="flex-row items-center gap-2 mt-2">
                    {item.sound?.rarity && (
                      <View
                        className="px-2 py-1 rounded-full"
                        style={{
                          backgroundColor:
                            item.sound.rarity === "legendary"
                              ? "#FFD700"
                              : item.sound.rarity === "rare"
                              ? colors.primary
                              : colors.muted,
                        }}
                      >
                        <Text className="text-xs font-semibold text-white">
                          {item.sound.rarity.toUpperCase()}
                        </Text>
                      </View>
                    )}
                    <Text className="text-xs text-muted">
                      Played {item.timesHeard} {item.timesHeard === 1 ? "time" : "times"}
                    </Text>
                  </View>
                </View>

                {/* Play Button */}
                <TouchableOpacity
                  onPress={() =>
                    handlePlaySound(item.sound?.url || "", item.sound?.title || "")
                  }
                  className="w-12 h-12 rounded-full bg-primary items-center justify-center"
                  activeOpacity={0.6}
                >
                  <IconSymbol name="play.circle.fill" size={28} color="#ffffff" />
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      ) : (
        <View className="flex-1 items-center justify-center">
          <IconSymbol name="lock.fill" size={64} color={colors.muted} />
          <Text className="text-xl text-muted text-center mt-4">
            No sounds unlocked yet!
          </Text>
          <Text className="text-base text-muted text-center mt-2 px-8">
            Arm a surprise to start collecting sounds
          </Text>
        </View>
      )}
    </ScreenContainer>
  );
}
