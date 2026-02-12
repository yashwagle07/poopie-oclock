import { useEffect, useState } from "react";
import { useAudioPlayer, setAudioModeAsync } from "expo-audio";
import { Platform } from "react-native";

/**
 * Hook for playing audio from a URL
 */
export function useSoundPlayer(url: string | null) {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create audio player with the URL
  const player = useAudioPlayer(url || "");

  useEffect(() => {
    // Configure audio mode to play in silent mode on iOS
    const configureAudio = async () => {
      try {
        if (Platform.OS === "ios") {
          await setAudioModeAsync({
            playsInSilentMode: true,
          });
        }
        setIsReady(true);
      } catch (err) {
        console.error("Failed to configure audio:", err);
        setError("Failed to configure audio");
      }
    };

    configureAudio();

    // Cleanup on unmount
    return () => {
      if (player) {
        player.pause();
      }
    };
  }, []);

  const play = async () => {
    if (!isReady || !url) {
      setError("Audio not ready");
      return;
    }

    try {
      player.play();
    } catch (err) {
      console.error("Failed to play audio:", err);
      setError("Failed to play audio");
    }
  };

  const pause = () => {
    try {
      player.pause();
    } catch (err) {
      console.error("Failed to pause audio:", err);
    }
  };

  const stop = () => {
    try {
      player.pause();
      player.seekTo(0);
    } catch (err) {
      console.error("Failed to stop audio:", err);
    }
  };

  return {
    player,
    isReady,
    error,
    play,
    pause,
    stop,
  };
}
